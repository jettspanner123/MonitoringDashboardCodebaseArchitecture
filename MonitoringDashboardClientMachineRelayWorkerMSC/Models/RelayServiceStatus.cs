namespace MonitoringDashboardClientMachineRelayWorkerMSC.Models;

// Mirrors the backend's RelayServiceStatusInterface exactly.
public sealed class RelayServiceStatus
{
    public string ServiceName { get; set; } = string.Empty;
    public int? StateCode { get; set; }
    public string? StateLabel { get; set; }
}
