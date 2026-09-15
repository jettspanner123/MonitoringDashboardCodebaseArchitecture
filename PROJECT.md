# Monitoring Dashboard

A view-only dashboard that shows the results of the daily morning smoke test, so the team doesn't have to manually click through every page at 8:30am to confirm things are working.

## Problem

Every morning, someone has to get up early and manually check a set of PLM pages/services to confirm they're working before the day starts. A separate automation script (see below) now runs the same checks automatically at 8:30 AM; this dashboard exists so the results can be reviewed later — around 11am — instead of watching the checks happen live.

## Scope

**In scope (now)**:
- Displaying Runs, PageChecks, and PopupCheckResults produced by the existing automation script
- Reading results from a database that the automation script writes to as it runs
- Showing each Run's Health, and drilling into individual PageCheck/PopupCheckResult Outcomes
- Keeping full history of every past Run (no retention window)

**Out of scope (for now, explicitly)**:
- Triggering or scheduling the Run itself — handled entirely by the automation script, external to this project
- Ingesting results from more than one automation source/client
- Any notification/alerting on failures

**Planned, not built yet**:
- A notification system for failures
- Possibly supporting multiple automation sources/clients later

## Tech stack

- Frontend: React 19.2 + Vite + TypeScript (`MonitoringDashboardClientServiceLayerMSC`)
- Data source: a database, written to directly by the automation script as each check completes — see [Database Over Event Bus](./MonitoringDashboardAgentDocumentationNMCS/ArchitectureDecisionRecords/DATABASE_OVER_EVENT_BUS_FOR_SMOKE_TEST_RESULTS.md)
- No backend/API layer exists yet — TBD whether the frontend reads the database directly or through a thin API; to be decided when work starts

## Architecture

- `MorningSmokeTestAutomation` (separate repo, Playwright + TypeScript): runs daily at 8:30 AM, checks Pages (and nested PopupChecks) against Atlas Copco's 3DEXPERIENCE/3DSpace PLM platform, writes each Outcome to the database
- `MonitoringDashboardClientServiceLayerMSC` (this repo's frontend): reads from that database and displays Runs, PageChecks, and PopupCheckResults

## Conventions

- Files and folders use PascalCase, except Markdown docs (`CONTEXT.md`, `PROJECT.md`, `README.md`, `CODING-RULES.md`) which keep their conventional casing
- ADRs live at `MonitoringDashboardAgentDocumentationNMCS/ArchitectureDecisionRecords/` (not the domain-modeling skill's default `docs/adr/` — a future session won't auto-discover this path and should be pointed here explicitly)
- ADR filenames are `SCREAMING_CASE.md`, no numeric prefix (e.g. `DATABASE_OVER_EVENT_BUS_FOR_SMOKE_TEST_RESULTS.md`) — a deliberate deviation from the domain-modeling skill's default `NNNN-slug.md` numbering

## Status

- Frontend: blank Vite/React/TS scaffold, no feature code yet
- Automation script: exists and working, currently outputs to Playwright's own HTML report only — not yet writing to a database
- Database: not yet chosen/created

_This file is a living document — update it as decisions are made._
