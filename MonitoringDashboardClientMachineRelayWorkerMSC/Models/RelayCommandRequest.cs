namespace MonitoringDashboardClientMachineRelayWorkerMSC.Models;

// Mirrors the backend's RelayCommandRequest interface exactly
// (MonitoringDashboardOrchestratorServiceLayerMSC/src/Features/ClientMachineServices/Services/ClientMachineRelayPoolService.ts).
// Serialized/deserialized with camelCase property naming to match the
// backend's plain JSON.stringify output.
public sealed class RelayCommandRequest
{
    public string RequestId { get; set; } = string.Empty;

    // "login_check" | "query" | "query_all" | "invoke"
    public string Type { get; set; } = string.Empty;

    public string Hostname { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    // Required for "query" and "invoke" only.
    public string? ServiceName { get; set; }

    // Required for "invoke" only - "start" | "stop".
    public string? Action { get; set; }
}
