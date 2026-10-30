using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using MonitoringDashboardClientMachineRelayWorkerMSC.Models;
using MonitoringDashboardClientMachineRelayWorkerMSC.Options;
using MonitoringDashboardClientMachineRelayWorkerMSC.Services;

namespace MonitoringDashboardClientMachineRelayWorkerMSC;

// Holds one outbound websocket connection to the ObservaCore backend,
// authenticated via RelayConnection:SharedSecret (the backend rejects the
// connection otherwise - see ClientMachineServicesController.RELAY_CONNECT).
// Reconnects with a fixed delay if the connection drops for any reason - no
// coordination with any other relay instance is needed (see the PRD's
// multi-relay pool design).
public sealed class Worker(
    ILogger<Worker> logger,
    IOptions<RelayConnectionOptions> options,
    WindowsServiceControlClient serviceControlClient
) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly TimeSpan ReconnectDelay = TimeSpan.FromSeconds(5);

    // ClientWebSocket only allows one SendAsync in flight at a time - this
    // guards concurrent responses from racing each other, even though
    // multiple commands can be *executed* concurrently.
    private readonly SemaphoreSlim _sendLock = new(1, 1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var relayOptions = options.Value;
        if (string.IsNullOrWhiteSpace(relayOptions.BackendWebSocketUrl) || string.IsNullOrWhiteSpace(relayOptions.SharedSecret))
        {
            logger.LogError("RelayConnection:BackendWebSocketUrl and RelayConnection:SharedSecret must both be configured.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ConnectAndListenAsync(relayOptions, stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Relay connection dropped - retrying in {Delay}s.", ReconnectDelay.TotalSeconds);
            }

            if (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(ReconnectDelay, stoppingToken);
            }
        }
    }

    private async Task ConnectAndListenAsync(RelayConnectionOptions relayOptions, CancellationToken stoppingToken)
    {
        using var socket = new ClientWebSocket();
        var separator = relayOptions.BackendWebSocketUrl.Contains('?') ? "&" : "?";
        var uri = new Uri($"{relayOptions.BackendWebSocketUrl}{separator}secret={Uri.EscapeDataString(relayOptions.SharedSecret)}");

        logger.LogInformation("Connecting to backend relay endpoint...");
        await socket.ConnectAsync(uri, stoppingToken);
        logger.LogInformation("Connected to backend.");

        var buffer = new byte[64 * 1024];
        while (socket.State == WebSocketState.Open && !stoppingToken.IsCancellationRequested)
        {
            using var messageStream = new MemoryStream();
            WebSocketReceiveResult result;
            do
            {
                result = await socket.ReceiveAsync(buffer, stoppingToken);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    logger.LogInformation("Backend closed the connection.");
                    return;
                }
                messageStream.Write(buffer, 0, result.Count);
            } while (!result.EndOfMessage);

            var json = Encoding.UTF8.GetString(messageStream.ToArray());
            // Fire-and-forget: multiple commands (e.g. different hostnames,
            // or a Start/Stop poll loop) can execute concurrently - the
            // per-hostname lock inside WindowsServiceControlClient is what
            // keeps net use calls to the SAME host serialized.
            _ = HandleCommandAsync(socket, json, stoppingToken);
        }
    }

    private async Task HandleCommandAsync(ClientWebSocket socket, string json, CancellationToken stoppingToken)
    {
        RelayCommandRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<RelayCommandRequest>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to parse command from backend: {Json}", json);
            return;
        }
        if (request == null) return;

        RelayCommandResponse response;
        try
        {
            response = await serviceControlClient.ExecuteAsync(request);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled error executing command {RequestId}", request.RequestId);
            response = new RelayCommandResponse { RequestId = request.RequestId, Success = false, ErrorMessage = ex.Message };
        }

        var responseBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(response, JsonOptions));

        await _sendLock.WaitAsync(stoppingToken);
        try
        {
            if (socket.State == WebSocketState.Open)
            {
                await socket.SendAsync(responseBytes, WebSocketMessageType.Text, true, stoppingToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send response for {RequestId} - connection likely dropped.", request.RequestId);
        }
        finally
        {
            _sendLock.Release();
        }
    }
}
