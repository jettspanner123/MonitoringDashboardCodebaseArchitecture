# Client Machine Services Page

**Status:** Draft — for review before implementation begins.

## 1. Problem

ObservaCore's backend runs on Render, on the public internet. The client
machines whose Windows services need monitoring/control are Windows VMs
reachable only from inside the office network/VPN (the same way the user
reaches them today via RDP). Render has no path into that network and never
will. So the backend cannot talk to these VMs directly — something has to
bridge the gap from *inside* the VPN out to the cloud, not the other way
around.

## 2. Validated mechanism (confirmed working by the user)

Exact real transcript the user ran against a live target VM:

```
PS C:\Users\UddeshyaSingh> net use \\vms10008847e003\IPC$ /user:ATLASCOPCO\A98038559_adm *
Type the password for \\vms10008847e003\IPC$:
The command completed successfully.

PS C:\Users\UddeshyaSingh> sc.exe \\vms10008847e003 query XPDMEventOrchestrator

SERVICE_NAME: XPDMEventOrchestrator
        TYPE               : 10  WIN32_OWN_PROCESS
        STATE              : 4  RUNNING
                                (STOPPABLE, NOT_PAUSABLE, ACCEPTS_SHUTDOWN)
        WIN32_EXIT_CODE    : 0  (0x0)
        SERVICE_EXIT_CODE  : 0  (0x0)
        CHECKPOINT         : 0x0
        WAIT_HINT          : 0x0
```

`net use` opens an authenticated SMB/IPC$ session to the target host using the
supplied `hostname\accountname` + daily-rotating password. Once that session
exists, `sc.exe \\hostname ...` rides on it to query/start/stop a named
service — `sc.exe` itself takes no credential arguments. This is the
mechanism this feature builds on (not PowerShell Remoting/WinRM, which would
require separate configuration on every target machine).

Known technical consequences of using it this way:

- **The `*` password prompt is interactive**, which a headless relay can't
  use. **Decided:** pass the password as a positional argument instead —
  `net use \\host\IPC$ <password> /user:domain\account` — the simplest
  option. Accepted tradeoff: this briefly exposes the plaintext password in
  the process's command line (visible to any other process/admin on the
  relay machine via the process list while the command runs).
- Windows only allows **one active authenticated connection per target host
  per session** on the machine making the connection. If two requests target
  the same VM concurrently, the second `net use` will fail unless the first
  is torn down first. **The relay must serialize `net use`/`sc.exe` calls
  per target hostname** (a per-host queue/lock), and always run
  `net use \\hostname\IPC$ /delete` after each operation to clean up.
- `sc.exe`'s output is **plain text, not structured data** — the relay must
  parse it into JSON before sending it back (`SERVICE_NAME`, `STATE` code +
  label, `TYPE`, exit codes). Standard SCM `STATE` codes to map:
  `1 STOPPED, 2 START_PENDING, 3 STOP_PENDING, 4 RUNNING, 5 CONTINUE_PENDING,
  6 PAUSE_PENDING, 7 PAUSED`.
- Failure cases print a **different shape** the parser must also recognize
  — e.g. `[SC] EnumQueryServicesStatus:OpenService FAILED 1060: The
  specified service does not exist as an installed service.` (bad service
  name), or `FAILED 5: Access is denied.` / `FAILED 1722: The RPC server is
  unavailable.` (bad credentials / unreachable host) — these map directly to
  the two distinct failure states in section 5 (relay-down vs.
  machine-specific failure).
- `sc.exe` has no atomic "restart" verb. **Restart = stop, poll until the
  service reports `STOPPED`, then start, poll until `RUNNING`** (with a
  timeout per phase). This is a multi-step operation, same shape as the
  cold-start retry loop already built for the Application Monitor feature.
- `sc.exe \\host query` with no service name returns **every** service on
  the box; `sc.exe \\host query <name>` returns just that one. Both are the
  same command the user already validated — this is what makes the "default
  curated list + show all" toggle (section 5) cheap to support.

## 3. Architecture

**Multiple relay instances, not one.** 4 people (the user + 3 others) use
this feature, each with their own VPN + RDP access to both target VMs
already. Rather than requiring one dedicated always-on host, each person
runs their own copy of the relay worker on their own machine. The backend
keeps a **pool of currently-connected relays** and routes each command to
any one of them — as long as at least one of the 4 is online and
VPN-connected, the feature works for everyone, not just that one person.

```
Browser (ObservaCore SPA)
   │  HTTPS
   ▼
ObservaCore Backend (Render)  ──┐
   │  existing Postgres          │  outbound-initiated WebSocket(s),
   │  (machines, audit log)      │  held open, authenticated with
   ▼                             │  a shared secret
   (new) Relay WebSocket route ◄─┤  — the backend accepts any number of
            ▲                    │    simultaneous relay connections and
            │                    │    just needs ONE currently open to
            │                    │    service a request
            │
   Relay Worker × up to 4 (one per person's machine, each a
   persistent Windows Service/background worker)
   - Each instance independently holds its own outbound WebSocket
     connection to the Render backend whenever that person's machine is on
     and VPN-connected. No coordination between instances is needed.
   - All 4 installs share one identical secret (see below) — simplest to
     set up for a team this size; the tradeoff is that compromising one
     machine means rotating the secret everywhere, not just on that one
     machine.
   - Executes `net use` + `sc.exe` against target VMs per command received,
     serialized per target hostname, and returns results over the same
     connection.
            │
            ▼
   Target Windows VMs (vmt10008847e002, vms10008847e003 — fixed list, see section 4)
```

This mirrors two patterns already built in this codebase: the Run Trigger +
`RunLiveProgressService` websocket pattern (trigger something, watch it live),
and the Hit-Attempt-Tracker websocket pattern just built for Application
Monitor's cold-start retries (multi-step operation, streamed live, only the
final outcome persisted).

**Relay connection auth:** every relay instance presents the same shared
secret (`RELAY_SHARED_SECRET`, an env var baked into each install's config
and matched on the Render backend) when it opens its WebSocket connection.
This has nothing to do with the VM login credentials — it exists purely so
the backend can tell a real relay apart from a random internet client trying
to connect to that same websocket endpoint and pretend to be one. The
backend rejects any connection attempt without the correct value.

**Mid-operation relay disconnect:** if the relay handling a request
disconnects mid-flight (e.g. that person's laptop sleeps), the attempt
simply fails and the user is shown exactly what happened (not a generic
error) — retrying the action naturally routes to whichever relay is online
at that moment. No automatic cross-relay retry in v1; revisit if this proves
to actually happen often in practice.

## 3a. Pre-navigation login gate (JWT + daily re-validation)

Clicking the new nav item does **not** navigate immediately. Instead:

1. A modal appears, wherever the user currently is, with `hostname\account`
   + password fields.
2. On submit, the backend runs a **real credential check** through the relay
   — a `net use \\<first configured machine>\IPC$ /user:<account> <password>`
   attempt (the same mechanism as section 2; just establishing the IPC$
   session is proof enough, no service query needed), then immediately tears
   it down with `net use \\...\IPC$ /delete`.
3. **On success:** the backend issues a short-lived **JWT access token** plus
   a **refresh token**. The refresh token is stored server-side **together
   with the password itself, encrypted at rest** (see section 4 — this is a
   deliberate reversal of the earlier "never persist credentials" stance,
   made explicitly so the flow below can work). The modal dismisses and the
   page navigates in, as one smooth sequential transition (modal exit →
   route change), no jarring instant cut.
4. **On failure:** the modal shows an inline error; nothing is issued, no
   navigation happens.
5. **On every later visit to the Client Machines page specifically** (not
   the rest of the app — confirmed in review), if a valid access/refresh
   token pair already exists, the backend silently re-runs the same real
   `net use` check using the **stored** (decrypted) password, with no modal
   shown to the user:
   - If it still succeeds (password hasn't rotated yet today), the user goes
     straight into the page — no re-login.
   - If it fails (the daily password has changed, or the stored one is
     otherwise no longer valid), the stored refresh token + password are
     invalidated and the login modal reappears, requiring a fresh username
     and the new password.

This means the practical "session length" is however long today's password
keeps working, not a fixed token expiry — though the refresh token still
carries a hard backstop expiry purely as a safety net. **Confirmed
lifetimes:** access token 30 minutes (silently renewed via the refresh
token while it's still valid), refresh token 2 days backstop.

**Scope:** this JWT only gates the Client Machines page and its backend
routes. It is not a general ObservaCore login system — the rest of the app
stays exactly as open as it is today.

## 4. Data model (new tables, `MD_` prefix matching this project's existing convention)

```
MD_ClientMachineConstantTBL
  id, hostname, nickname, createdAt

MD_ClientMachineServiceConstantTBL
  id, machineId (FK), serviceName, displayLabel, sortOrder, isActive, createdAt
  -- the curated "default shown" services per machine, admin-seeded the same
  -- way AssetSphere's endpoints were seeded (manual SQL, not user-editable
  -- from the UI in v1)

MD_ClientMachineServiceActionAuditTBL
  id, machineId (FK), serviceName, action (Start|Stop|Restart),
  performedBy, performedAt, succeeded, errorMessage, durationMs
  -- performedBy is the validated hostname\account username from the JWT,
  -- captured automatically - not a free-text field (resolved; see section
  -- 3a and the former Open Item 3)

MD_ClientMachineRefreshTokenTBL
  id, username, refreshTokenHash, encryptedPassword, issuedAt, expiresAt,
  revokedAt
  -- one row per logged-in session. refreshTokenHash is a hash of the
  -- refresh token (never the raw token itself - standard practice so a DB
  -- leak alone can't be replayed as a valid token). encryptedPassword is
  -- the actual daily VM password, encrypted at rest, needed so the backend
  -- can silently re-run the real net use check on later visits without
  -- asking the user again (section 3a).
```

For v1, the full fixed machine list is confirmed: `vmt10008847e002` and
`vms10008847e003`.

**Credential persistence — reversed from the earlier draft, deliberately**:
the first draft of this PRD said credentials would never be persisted
anywhere. That's no longer true. To support "don't make me log in every time,
but do ask again once today's password stops working" (section 3a), the
backend now stores the password itself, encrypted at rest, alongside the
refresh token, for as long as that session is valid. This is a conscious
security tradeoff accepted during review: the password now sits in the
database for up to ~24h (until it rotates) instead of existing only in
memory for a single request. Encryption approach mirrors the
`DB_ENCRYPTION_KEY` pattern already used elsewhere in this ecosystem
(`MorningSmokeTestAutomation`) — a server-only symmetric key, never shipped
to the browser.

## 5. UX

- New navbar item, labeled **"Client Machines"**, nav id/route slug
  `client-machines` → a new page, generic enough to support more machines as
  the fixed list grows.
- Access is gated by the pre-navigation login modal described in section
  3a, not by fields on the page itself — by the time the page actually
  renders, the user is already holding a valid access token and every
  request carries it automatically.
- Per machine, a card/section showing the **curated default service list**
  (from `MD_ClientMachineServiceConstantTBL`) with live status per service,
  plus a **"Show all services"** toggle that runs the unfiltered
  `sc.exe \\host query` and lists everything on that box (with a search box,
  since that list can run into the hundreds).
- Each service row: Start / Stop / Restart buttons.
  - **Stop** and **Restart** require a confirmation modal first (Start does
    not — nothing to lose by starting a stopped service).
  - **Restart** opens a live progress modal ("Stopping…" → "Starting…" →
    "Running"), reusing the Application Monitor's wake-up-modal visual
    pattern (framer-motion row animation, shared-element icon morph).
- **No auto-refresh/polling** — status only updates on an explicit action or
  manual refresh, matching this dashboard's existing "nothing silently polls"
  convention and avoiding needless load on the relay/target VMs.
- Two distinct failure states, never conflated:
  1. **No relay is currently connected** (all 4 people's instances are
     offline) — the whole page shows "Service control is currently
     offline" — nothing machine-specific is attempted.
  2. **A relay is up but a specific machine/service call failed** (bad
     credentials, VM unreachable, `net use`/`sc.exe` error, or the relay
     handling that one request disconnected mid-flight) — only that
     machine/row shows the error, with the **exact underlying message**
     (not a generic "something went wrong") so the user knows what actually
     happened; everything else keeps working.

## 6. Audit logging

Every Start/Stop/Restart **attempt** (not view/query actions) is written to
`MD_ClientMachineServiceActionAuditTBL` once it resolves — who, when, which
machine/service, which action, success/failure, and how long it took.

**"Who" is the real validated username** from the authenticated JWT (e.g.
`ATLASCOPCO\A98038559_adm`), captured automatically — not a free-text field.
The login gate in section 3a makes this possible: by the time anyone can
reach an action button, they've already had that exact username verified
against a real machine login, so it's an actually-trustworthy attribution,
not an honesty-based one.

## 7. Out of scope for v1

- **General ObservaCore authentication** — the JWT/login flow in section 3a
  is specific to validating real client-machine credentials for this one
  feature; it is not a site-wide user-identity system, and the rest of
  ObservaCore stays exactly as open as it is today.
- User-editable machine/service list from the UI — machines and their
  default service lists are admin-seeded via manual SQL, same as
  AssetSphere's endpoints.
- Auto-refresh/live polling of service status.
- Logging view/query actions (only control actions are audited).

## 8. Naming (confirmed)

- Nav label: **Client Machines** / route slug: `client-machines`
- New backend feature folder: `Features/ClientMachineServices/`
- New relay project: **`MonitoringDashboardClientMachineRelayWorkerMSC`** — a standalone .NET
  worker service, sibling to the existing client/orchestrator projects in
  this repo.
- Tables: as listed in section 4 (`MD_ClientMachineConstantTBL`,
  `MD_ClientMachineServiceConstantTBL`, `MD_ClientMachineServiceActionAuditTBL`,
  `MD_ClientMachineRefreshTokenTBL`).

## 9. Open items — still need an answer before or during build

1. **New secrets to generate at deploy time** (server-only env vars, never
   shipped to the browser, never written into this document or any file in
   the repo):
   - A JWT signing secret. **One was pasted directly into chat during this
     review — it must not be used as-is for anything checked into source
     control**; treat it as already exposed and either regenerate a fresh
     one at deploy time or store the given one directly as a Render
     environment variable without it ever touching a file in this repo.
   - A password-encryption key (same `DB_ENCRYPTION_KEY`-style approach as
     `MorningSmokeTestAutomation`), still needs generating.
   - `RELAY_SHARED_SECRET` — the one value shared identically across all 4
     relay installs and the Render backend (section 3), still needs
     generating.
