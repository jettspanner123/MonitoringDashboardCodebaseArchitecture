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
- Backend: Node.js + TypeScript + Fastify + Prisma (`MonitoringDashboardOrchestratorServiceLayerMSC`) — the frontend calls this backend rather than reading the database directly; architecture pattern (Feature folders, `ApiResponseClass<T>` envelope, `ApplicationRouteFactory`, singleton `.current` services) adapted from AssetSphere's/SignForge's backends, same as those two projects adapted the pattern between each other despite different languages
- Data source: Supabase Postgres, written to directly by the automation script as each check completes — see [Database Over Event Bus](./MonitoringDashboardAgentDocumentationNMCS/ArchitectureDecisionRecords/DATABASE_OVER_EVENT_BUS_FOR_SMOKE_TEST_RESULTS.md). The backend is read-only with respect to schema — it mirrors the automation script's tables via its own `prisma/schema.prisma` but never runs migrations; the automation script alone owns schema evolution
- Row Level Security is enabled (no policies) on all tables — only the backend's own privileged connection (table owner) can read/write; the Supabase anon/authenticated roles used by client-side libraries are fully locked out

## Architecture

- `MorningSmokeTestAutomation` (separate repo, Playwright + TypeScript): runs daily at 8:30 AM, checks Pages (and nested PopupChecks) against Atlas Copco's 3DEXPERIENCE/3DSpace PLM platform, writes each Outcome to the database
- `MonitoringDashboardOrchestratorServiceLayerMSC` (this repo's backend): reads from that database, translates the raw check tables into this project's `Run`/`PageCheck` domain vocabulary (see `CONTEXT.md`), and exposes it over a REST API (`GET /api/v1/runs`, `GET /api/v1/runs/:id`)
- `MonitoringDashboardClientServiceLayerMSC` (this repo's frontend): calls the backend above and displays Runs, PageChecks, and PopupCheckResults

## Conventions

- Files and folders use PascalCase, except Markdown docs (`CONTEXT.md`, `PROJECT.md`, `README.md`, `CODING-RULES.md`) which keep their conventional casing
- ADRs live at `MonitoringDashboardAgentDocumentationNMCS/ArchitectureDecisionRecords/` (not the domain-modeling skill's default `docs/adr/` — a future session won't auto-discover this path and should be pointed here explicitly)
- ADR filenames are `SCREAMING_CASE.md`, no numeric prefix (e.g. `DATABASE_OVER_EVENT_BUS_FOR_SMOKE_TEST_RESULTS.md`) — a deliberate deviation from the domain-modeling skill's default `NNNN-slug.md` numbering

## Status

- Frontend: blank Vite/React/TS scaffold with the dark/light theme system built; no dashboard feature code yet
- Backend: `MonitoringDashboardOrchestratorServiceLayerMSC` built — `HealthCheck` and `Runs` features working end-to-end against real production data (`GET /api/v1/runs`, `GET /api/v1/runs/:id`), verified live
- Automation script: exists and working, writes every check result directly to Supabase as it runs
- Database: Supabase Postgres (project `MonitoringDashboardDatabase`), 6 tables, RLS enabled with no policies (backend-only access)
- Not yet built: `PopupCheck`/`PopupCheckResult` persistence (no table exists for this yet — the backend's `Run`/`PageCheck` translation currently has no popup-check data to surface), and the frontend's actual dashboard UI

_This file is a living document — update it as decisions are made._
