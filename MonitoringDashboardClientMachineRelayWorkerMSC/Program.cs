using MonitoringDashboardClientMachineRelayWorkerMSC;
using MonitoringDashboardClientMachineRelayWorkerMSC.Options;
using MonitoringDashboardClientMachineRelayWorkerMSC.Services;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.Configure<RelayConnectionOptions>(builder.Configuration.GetSection(RelayConnectionOptions.SectionName));
builder.Services.AddSingleton<WindowsServiceControlClient>();
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
