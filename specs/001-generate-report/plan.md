# Implementation Plan: Generate Report

**Branch**: `001-generate-report` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-generate-report/spec.md`

## Summary

Replace the "Run Smoke Test" button on the Morning Smoke Test page with "Generate
Report." A new modal collects an environment, a date range, and a nested
category/sub-item checklist (derived live from recorded data); generating computes
the report synchronously on the backend, persists it as an immutable snapshot with a
`cuid()` id, and takes the user to a new `/report/:reportId` page — exact per-check
results for a single day, or per-category summaries plus a day-by-day completeness
strip plus a combined failure list for a range. The report is exportable to PDF
client-side (reusing SignForge's established `pdf-lib` + `html2canvas-pro` pattern).

## Technical Context

**Language/Version**: TypeScript 5.5 (backend), TypeScript ~6.0 (frontend)

**Primary Dependencies**: Backend — Fastify 5, Prisma 6 (`@prisma/client`), existing
`ApiResponseClass`/`ApplicationRouteFactory` conventions. Frontend — React 19,
TanStack Query/Router, Tailwind v4, `motion`, `lucide-react`, plus two **new**
frontend dependencies: `pdf-lib` (`^1.17.1`) and `html2canvas-pro` (`^2.4.1`),
versions matching SignForge's existing use of both.

**Storage**: PostgreSQL via Supabase, Prisma ORM, hand-written `manual-sql`
migrations (never `prisma migrate`) — see constitution's Database & Migration
Discipline.

**Testing**: No automated test runner exists for this frontend or backend; validated
by the `quickstart.md` manual scenarios via the local dev stack, consistent with how
every other feature in this codebase has been verified so far.

**Target Platform**: Web — React SPA (Vercel) + Fastify REST API (Render).

**Project Type**: Web application (existing frontend + backend workspaces).

**Performance Goals**: Report generation is a same-process database aggregation
(research.md §5); no external network calls, so no special performance budget beyond
"typical dashboard query speed."

**Constraints**: No cap on requested date-range size (spec Assumptions); generation
is synchronous, so a very large range simply takes longer rather than failing or
needing a job queue.

**Scale/Scope**: Internal tool; one check-history dataset per environment, modest
daily volume (one smoke-test run per day per environment plus occasional manual
historical backfill).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance |
|---|---|
| I. Class-Based Singletons | New `ReportsService`/`ReportsRoutes` follow the existing `public static current` / route-factory-class pattern exactly. New frontend pieces are functional components (the documented exemption). |
| II. Zero Magic Strings | New routes added to `ApplicationRouteFactory` as a `ReportsRoutes` class, referenced via `.current.reports.*`, never hardcoded in the controller. |
| III. Strict TypeScript | New DTOs/interfaces for the report payload and selection keys; no `any`. |
| IV. Structured API Response Envelope | All four new endpoints (contracts/reports-api.md) wrap responses in `ApiResponseClass`. |
| V. Reuse Before New Code | PDF export reuses SignForge's exact `pdf-lib`/`html2canvas-pro` pattern; single-day report reuses the existing category card components; category/sub-item classification reuses the existing `pageName.startsWith('AtlasWidget')` discriminator; report id reuses the existing `cuid()` convention. Only the `GeneratedReport` table, its service/controller, and the two new report-specific modal components and report page are genuinely new. |
| Database & Migration Discipline | New table added via a hand-written `prisma/manual-sql/006_*.sql` file, documented, applied via `RunManualSql.ts`. |
| GitNexus-Gated Workflow | Applies during implementation (`/speckit-implement`), not to this planning document itself — `impact()` before editing any existing symbol (e.g. `DashboardScreenController`, `ApplicationRouteFactory`), `detect_changes()` before every commit. |

No violations. Complexity Tracking table intentionally omitted below.

## Project Structure

### Documentation (this feature)

```text
specs/001-generate-report/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── reports-api.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
MonitoringDashboardOrchestratorServiceLayerMSC/
├── prisma/
│   ├── schema.prisma                           # + GeneratedReport model
│   └── manual-sql/006_add_generated_report.sql # new (hand-written)
└── src/
    ├── Factories/ApplicationRouteFactory.ts     # + ReportsRoutes class
    └── Features/Reports/                        # new feature folder
        ├── ReportsController.ts
        ├── Services/ReportsService.ts
        └── Models/                              # DTOs for the report payload shapes

MonitoringDashboardClientServiceLayerMSC/
└── src/
    ├── Router/ApplicationRouter.tsx             # + /report/$reportId route
    ├── Routes/ReportScreenRoute.tsx              # new
    ├── Features/
    │   ├── Dashboard/
    │   │   ├── DashboardScreenController.tsx    # Run Smoke Test removed, Generate Report added
    │   │   └── Components/
    │   │       ├── GenerateReportModalComponent.tsx        # new
    │   │       └── ReportGenerationLoadingModalComponent.tsx # new
    │   └── Report/
    │       ├── ReportScreenController.tsx       # new
    │       └── Services/ReportService.ts        # new (frontend API client)
    └── Shared/Components/                        # existing check-card components reused as-is
```

**Structure Decision**: Follows this repo's existing `Features/<Name>/` (backend) and
`Features/<Name>/` + `Routes/<Name>ScreenRoute.tsx` (frontend) conventions exactly —
no new top-level structure introduced. The report page is a genuinely new top-level
route (`/report/:reportId`), not another `?app=` search param on the existing
single-page route, since it must be independently bookmarkable/shareable per FR-012.

## Complexity Tracking

*No violations — table intentionally empty.*
