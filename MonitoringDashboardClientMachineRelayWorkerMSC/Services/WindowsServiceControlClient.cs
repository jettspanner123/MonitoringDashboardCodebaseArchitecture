using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text.RegularExpressions;
using MonitoringDashboardClientMachineRelayWorkerMSC.Models;

namespace MonitoringDashboardClientMachineRelayWorkerMSC.Services;

// Executes the exact net use + sc.exe sequence validated by hand against a
// real target VM (see the PRD, section 2). One net use session is opened,
// the actual command runs, then the session is always torn down - Windows
// only allows one authenticated connection per target host at a time, so
// every hostname's operations are serialized through its own lock.
public sealed class WindowsServiceControlClient(ILogger<WindowsServiceControlClient> logger)
{
    private static readonly TimeSpan ProcessTimeout = TimeSpan.FromSeconds(15);
    private static readonly Regex ServiceNameRegex = new(@"SERVICE_NAME:\s*(.+)", RegexOptions.Compiled);
    private static readonly Regex StateRegex = new(@"STATE\s*:\s*(\d+)\s+(\S+)", RegexOptions.Compiled);
    private static readonly Regex FailedRegex = new(@"FAILED\s+(\d+):\s*(.+)", RegexOptions.Compiled);

    private readonly ConcurrentDictionary<string, SemaphoreSlim> _hostLocks = new();

    private SemaphoreSlim GetHostLock(string hostname) => _hostLocks.GetOrAdd(hostname, _ => new SemaphoreSlim(1, 1));

    private static async Task<(int ExitCode, string StdOut, string StdErr)> RunProcessAsync(
        string fileName,
        IReadOnlyList<string> arguments
    )
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = fileName,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };
        foreach (var argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        using var process = new Process { StartInfo = startInfo };
        process.Start();

        var stdOutTask = process.StandardOutput.ReadToEndAsync();
        var stdErrTask = process.StandardError.ReadToEndAsync();

        using var timeoutCts = new CancellationTokenSource(ProcessTimeout);
        try
        {
            await process.WaitForExitAsync(timeoutCts.Token);
        }
        catch (OperationCanceledException)
        {
            try
            {
                process.Kill(entireProcessTree: true);
            }
            catch
            {
                // Already exited between the timeout firing and Kill() - fine.
            }
            return (-1, string.Empty, $"{fileName} timed out after {ProcessTimeout.TotalSeconds}s.");
        }

        return (process.ExitCode, await stdOutTask, await stdErrTask);
    }

    private async Task<bool> OpenNetUseSessionAsync(string hostname, string username, string password)
    {
        // Password passed as a positional argument, not the interactive "*"
        // prompt - decided in the PRD (section 2): simplest option, with the
        // accepted tradeoff that it's briefly visible in this process's own
        // argument list on the relay machine while the command runs.
        var (exitCode, stdOut, stdErr) = await RunProcessAsync(
            "net.exe",
            [ "use", $@"\\{hostname}\IPC$", password, $"/user:{username}" ]
        );

        if (exitCode != 0)
        {
            logger.LogWarning("net use to {Hostname} failed: {StdOut} {StdErr}", hostname, stdOut, stdErr);
        }
        return exitCode == 0;
    }

    private static async Task CloseNetUseSessionAsync(string hostname)
    {
        await RunProcessAsync("net.exe", [ "use", $@"\\{hostname}\IPC$", "/delete", "/yes" ]);
    }

    private static List<RelayServiceStatus> ParseScQueryOutput(string output)
    {
        var results = new List<RelayServiceStatus>();
        string? currentName = null;

        foreach (var line in output.Split('\n'))
        {
            var nameMatch = ServiceNameRegex.Match(line);
            if (nameMatch.Success)
            {
                currentName = nameMatch.Groups[1].Value.Trim();
                continue;
            }

            var stateMatch = StateRegex.Match(line);
            if (stateMatch.Success && currentName != null)
            {
                results.Add(new RelayServiceStatus
                {
                    ServiceName = currentName,
                    StateCode = int.Parse(stateMatch.Groups[1].Value),
                    StateLabel = stateMatch.Groups[2].Value.Trim(),
                });
                currentName = null;
            }
        }

        return results;
    }

    public async Task<RelayCommandResponse> ExecuteAsync(RelayCommandRequest request)
    {
        var hostLock = GetHostLock(request.Hostname);
        await hostLock.WaitAsync();

        try
        {
            var authenticated = await OpenNetUseSessionAsync(request.Hostname, request.Username, request.Password);
            if (!authenticated)
            {
                return new RelayCommandResponse
                {
                    RequestId = request.RequestId,
                    Success = false,
                    ErrorMessage = $@"Could not authenticate to \\{request.Hostname} with the supplied credentials.",
                };
            }

            try
            {
                return request.Type switch
                {
                    "login_check" => new RelayCommandResponse { RequestId = request.RequestId, Success = true },
                    "query" => await RunQueryAsync(request),
                    "query_all" => await RunQueryAllAsync(request),
                    "invoke" => await RunInvokeAsync(request),
                    _ => new RelayCommandResponse
                    {
                        RequestId = request.RequestId,
                        Success = false,
                        ErrorMessage = $"Unknown command type \"{request.Type}\".",
                    },
                };
            }
            finally
            {
                await CloseNetUseSessionAsync(request.Hostname);
            }
        }
        finally
        {
            hostLock.Release();
        }
    }

    private async Task<RelayCommandResponse> RunQueryAsync(RelayCommandRequest request)
    {
        var (_, stdOut, stdErr) = await RunProcessAsync(
            "sc.exe",
            [ $@"\\{request.Hostname}", "query", request.ServiceName ?? string.Empty ]
        );
        var combined = stdOut + stdErr;

        var failedMatch = FailedRegex.Match(combined);
        if (failedMatch.Success)
        {
            return new RelayCommandResponse { RequestId = request.RequestId, Success = false, ErrorMessage = failedMatch.Groups[2].Value.Trim() };
        }

        var status = ParseScQueryOutput(combined).FirstOrDefault();
        if (status == null)
        {
            return new RelayCommandResponse { RequestId = request.RequestId, Success = false, ErrorMessage = "Could not parse sc.exe output." };
        }

        return new RelayCommandResponse { RequestId = request.RequestId, Success = true, Service = status };
    }

    private async Task<RelayCommandResponse> RunQueryAllAsync(RelayCommandRequest request)
    {
        // "state= all" (note the required space after "state=") includes
        // stopped services too - plain "query" only lists active ones.
        var (_, stdOut, stdErr) = await RunProcessAsync(
            "sc.exe",
            [ $@"\\{request.Hostname}", "query", "state=", "all" ]
        );
        var combined = stdOut + stdErr;

        var failedMatch = FailedRegex.Match(combined);
        if (failedMatch.Success)
        {
            return new RelayCommandResponse { RequestId = request.RequestId, Success = false, ErrorMessage = failedMatch.Groups[2].Value.Trim() };
        }

        return new RelayCommandResponse { RequestId = request.RequestId, Success = true, Services = ParseScQueryOutput(combined) };
    }

    private async Task<RelayCommandResponse> RunInvokeAsync(RelayCommandRequest request)
    {
        var verb = request.Action == "start" ? "start" : "stop";
        var (_, stdOut, stdErr) = await RunProcessAsync(
            "sc.exe",
            [ $@"\\{request.Hostname}", verb, request.ServiceName ?? string.Empty ]
        );
        var combined = stdOut + stdErr;

        var failedMatch = FailedRegex.Match(combined);
        if (failedMatch.Success)
        {
            return new RelayCommandResponse { RequestId = request.RequestId, Success = false, ErrorMessage = failedMatch.Groups[2].Value.Trim() };
        }

        return new RelayCommandResponse { RequestId = request.RequestId, Success = true, Service = ParseScQueryOutput(combined).FirstOrDefault() };
    }
}
