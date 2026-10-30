namespace MonitoringDashboardClientMachineRelayWorkerMSC.Models;

// Mirrors the backend's RelayCommandResponse interface exactly - this is
// what gets sent back over the websocket for the backend to correlate by
// RequestId.
public sealed class RelayCommandResponse
{
    public string RequestId { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }

    // Present for "query" and "invoke".
    public RelayServiceStatus? Service { get; set; }

    // Present for "query_all" only.
    public List<RelayServiceStatus>? Services { get; set; }
}
