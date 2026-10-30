# Installing the Client Machine Relay Worker

`MonitoringDashboardClientMachineRelayWorkerMSC` is a .NET 10 Worker Service.
It's been built and verified end-to-end against a local backend (connects,
authenticates, runs a real `net use`/`sc.exe` attempt and relays the result
back) — these steps are accurate to the actual project, not a plan.

This needs to be installed on **each of the 4 machines** (yours + the 3
others) that will act as a relay — any one of them being online lets the
Client Machines feature work for everyone.

## 1. Prerequisites, per machine

- Windows, with the **.NET 10 runtime** installed (`dotnet --list-runtimes`
  to check; install the ASP.NET/Generic runtime if missing).
- That person's VPN connected, with the usual RDP-level access to
  `vmt10008847e002` and `vms10008847e003` already working.
- Normal outbound internet access to reach the Render backend over HTTPS/WSS
  (default on any office/home network — nothing special to open).
- Admin rights on the machine, to install a Windows Service.

**Important caveat to check on each machine:** a Windows Service runs even
without anyone logged into Windows — but it can only reach the target VMs if
the VPN tunnel is actually up. Some corporate VPN clients only establish a
tunnel once someone is logged into an interactive desktop session; others
support an "always-on" mode that works before login. **Confirm which kind of
VPN client each of the 4 of you uses** — if it requires an interactive
login, that machine effectively needs to stay logged in (not just powered
on) for its relay instance to actually work.

## 2. Get the build

From the `MonitoringDashboardClientMachineRelayWorkerMSC` project folder:

```
dotnet publish -c Release -r win-x64 --self-contained false -o ./publish
```

Copy the resulting `./publish` folder to the target machine.

## 3. Configure it

Set these two values before starting the service — either in
`appsettings.json` (copied alongside the published exe) or as environment
variables (`RelayConnection__BackendWebSocketUrl`,
`RelayConnection__SharedSecret` — the double underscore is .NET's standard
config-section-nesting syntax):

```json
{
  "RelayConnection": {
    "BackendWebSocketUrl": "wss://observacoreappcodebasearchitecture.onrender.com/api/v1/client-machine-services/relay/connect",
    "SharedSecret": "<get this value directly from whoever generated it>"
  }
}
```

**Never commit a real `SharedSecret` value to the repo** — `appsettings.json`
ships with empty placeholders; fill it in only on each installed machine, or
use the environment variable instead.

## 4. Install it as a Windows Service

So it survives reboots and doesn't need anyone logged in to start running
(the VPN caveat above still applies to actually *reaching* the target VMs):

```
sc.exe create ClientMachineRelayWorker binPath= "C:\path\to\publish\MonitoringDashboardClientMachineRelayWorkerMSC.exe" start= auto
sc.exe failure ClientMachineRelayWorker reset= 86400 actions= restart/5000/restart/5000/restart/5000
sc.exe start ClientMachineRelayWorker
```

The `sc.exe failure` line makes Windows auto-restart the service if it
crashes, instead of silently staying down.

## 5. Verify it worked

- Check Windows Event Viewer (Application log, source
  `MonitoringDashboardClientMachineRelayWorkerMSC`) for "Connected to
  backend." — that's the worker's own log line once the websocket handshake
  (including the shared-secret check) succeeds.
- Open the ObservaCore Client Machines page — it should no longer show
  "Service control is currently offline" once at least one relay (this one,
  or anyone else's) is connected.

## 6. Uninstalling

```
sc.exe stop ClientMachineRelayWorker
sc.exe delete ClientMachineRelayWorker
```

## 7. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Page still shows "offline" after starting the service | `SharedSecret` doesn't match what the backend expects, or `BackendWebSocketUrl` is wrong/unreachable |
| Service starts then immediately stops | Check the Event Viewer log for the actual exception - likely a missing/malformed config value |
| A specific machine/service action fails, but the page itself is online | Not a relay problem - check the exact error shown in the UI (bad VM credentials, that specific VM unreachable, VPN not actually connected on whichever relay picked up the request, etc.) |
| `net use` succeeds manually but fails through the relay | The Windows Service runs as `LocalSystem` by default, which has no network identity of its own for outbound SMB - if this happens, the service account may need to be changed to a domain account with VPN-equivalent network access (not yet needed in local testing, flagging as a possible real-world gotcha) |
