# Running the Client Machine Services Feature Locally

Three pieces, each in its own terminal.

## 1. Backend

```
cd MonitoringDashboardOrchestratorServiceLayerMSC
npm run dev
```

Runs on `http://localhost:4000`. The `.env` already has the generated
`CLIENT_MACHINE_JWT_SECRET`, `CLIENT_MACHINE_PASSWORD_ENCRYPTION_KEY`, and
`RELAY_SHARED_SECRET` — nothing to configure.

## 2. Frontend

```
cd MonitoringDashboardClientServiceLayerMSC
npm run dev
```

Open the printed localhost URL and go to the "Client Machines" tab.

## 3. Relay worker (optional — only needed to test the actual login/service flow)

Without this running, the page correctly shows "Service control is
currently offline" and nothing further can be tested.

```
cd MonitoringDashboardClientMachineRelayWorkerMSC
```

Set these two environment variables before running (PowerShell):

```powershell
$env:RelayConnection__BackendWebSocketUrl = "ws://localhost:4000/api/v1/client-machine-services/relay/connect"
$env:RelayConnection__SharedSecret = "5d038b62fc2d9345c8826ca12aa9f43881e3c13d3fd2f10c6707ac209b84e691"
dotnet run
```

You should see `Connected to backend.` in its log, and the page should flip
from "offline" to showing the machine list.

## What to expect when testing login

Unless the machine running the relay is actually VPN-connected with real
reachability to `vmt10008847e002`/`vms10008847e003`, logging in with real
credentials will fail the same way a fake credential does — a clean error
message, not a crash, since `net use` can't reach the VM from here. To see
the full successful path (login → curated services → Start/Stop/Restart),
run the relay on a machine that's actually on the VPN with access to those
two VMs, using the real daily `hostname\account` + password.

Without real VM access, you can still verify: the login error message, the
relay connect/disconnect toggling the "offline" banner live, and the
overall page layout/animations.
