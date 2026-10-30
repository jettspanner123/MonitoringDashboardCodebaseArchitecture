namespace MonitoringDashboardClientMachineRelayWorkerMSC.Options;

// Bound from appsettings.json / environment variables (RelayConnection__BackendWebSocketUrl,
// RelayConnection__SharedSecret) - see the installation steps doc for exact
// values. Never committed with real values.
public sealed class RelayConnectionOptions
{
    public const string SectionName = "RelayConnection";

    public string BackendWebSocketUrl { get; set; } = string.Empty;
    public string SharedSecret { get; set; } = string.Empty;
}
