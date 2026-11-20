---

description: "Task list for implementing Generate Report"
---

# Tasks: Generate Report

**Input**: Design documents from `/specs/001-generate-report/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/reports-api.md, quickstart.md

**Tests**: Omitted — this codebase has no automated test runner for either the
frontend or backend (confirmed in plan.md's Technical Context), and the spec did not
request a TDD approach. Validation is the `quickstart.md` manual scenarios (T030).

**Organization**: Tasks are grouped by user story (spec.md's P1/P2/P3) so each can be
implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Web app — `MonitoringDashboardOrchestratorServiceLayerMSC/src/` (backend),
`MonitoringDashboardClientServiceLayerMSC/src/` (frontend), per plan.md's Project
Structure.

---

## Phase 1: Setup

**Purpose**: Dependencies and empty feature folders, nothing behavioral yet.

- [X] T001 Add `pdf-lib` (`^1.17.1`) and `html2canvas-pro` (`^2.4.1`) to `MonitoringDashboardClientServiceLayerMSC/package.json` dependencies and install them (research.md §1 — versions matched to SignForge's existing use of both).
- [X] T002 [P] Create the empty backend feature folder `MonitoringDashboardOrchestratorServiceLayerMSC/src/Features/Reports/` with `Services/` and `Models/` subfolders, per plan.md's Project Structure.
- [X] T003 [P] Create the empty frontend feature folder `MonitoringDashboardClientServiceLayerMSC/src/Features/Report/` and an empty `MonitoringDashboardClientServiceLayerMSC/src/Routes/ReportScreenRoute.tsx` placeholder file, per plan.md's Project Structure.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The persisted-report schema, routing scaffolding, and the two
modal-configuration endpoints (day-completeness, available-categories) every user
story's modal depends on regardless of which story's report content is ultimately
generated.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Add the `GeneratedReport` model to `MonitoringDashboardOrchestratorServiceLayerMSC/prisma/schema.prisma`, exactly per data-model.md's schema block: `id String @id @default(cuid())`, `environment Environment`, `rangeStart DateTime`, `rangeEnd DateTime`, `selectedKeys String`, `content String`, `createdAt DateTime @default(now())`, mapped `@@map("MD_GeneratedReportTBL")`.
- [X] T005 Write `MonitoringDashboardOrchestratorServiceLayerMSC/prisma/manual-sql/006_add_generated_report.sql` creating `MD_GeneratedReportTBL` matching T004 column-for-column, with a leading comment explaining what it adds and why it is hand-written (constitution's Database & Migration Discipline — never `prisma migrate`). Apply it via `bunx tsx scripts/RunManualSql.ts prisma/manual-sql/006_add_generated_report.sql`, then run `prisma generate`.
- [X] T006 Add a `ReportsRoutes` class to `MonitoringDashboardOrchestratorServiceLayerMSC/src/Factories/ApplicationRouteFactory.ts` (`CONTROLLER_URL = '/api/v1/reports'`, `DAY_COMPLETENESS = '/day-completeness'`, `AVAILABLE_CATEGORIES = '/available-categories'`, `GENERATE = '/generate'`, `GET_BY_ID = '/:reportId'`) and expose it as `public readonly reports = ReportsRoutes;` on `ApplicationRouteFactory`, matching every existing route class's pattern.
- [X] T007 [P] Create backend models in `MonitoringDashboardOrchestratorServiceLayerMSC/src/Features/Reports/Models/`: `DayCompletenessStateType.ts`, `ReportCategoryKeyType.ts`, `GeneratedReportContentDTO.ts` (single-day/range discriminated union), `GeneratedReportDTO.ts`, `AvailableCategoriesDTO.ts`.
- [X] T008 Implement `ReportsService.current.getDayCompleteness(environment, monthStart, monthEnd)` in `MonitoringDashboardOrchestratorServiceLayerMSC/src/Features/Reports/Services/ReportsService.ts`: for each day in `[monthStart, monthEnd]`, query that day's `TestRun` (scoped by `environment`) and its 5 check relations, and classify it `'complete'` (every one of the 6 categories has at least one recorded check that day), `'partial'` (some but not all), or `'empty'` (none). Reused `RunsService.current.mapRunToPageChecks` (made `public`; `RUN_WITH_CHECKS_INCLUDE`/`RunWithChecks` exported) rather than re-deriving the check-table mapping.
- [X] T009 Implement `ReportsService.current.getAvailableCategories(environment, startDate, endDate)` in the same service: return distinct `PageLoadCheck.pageName` values in range split into `pageLoad` (not starting with `"AtlasWidget"`) and `atlasWidget` (starting with `"AtlasWidget"`) per research.md §3's exact discriminator, plus distinct `QueueStatusCheck.pageName` values, scoped to `environment` and the date range — matching contracts/reports-api.md's response shape.
- [X] T010 Implement `MonitoringDashboardOrchestratorServiceLayerMSC/src/Features/Reports/ReportsController.ts` wiring `GET` on `ReportsRoutes.DAY_COMPLETENESS` and `ReportsRoutes.AVAILABLE_CATEGORIES` to T008/T009, validating `environment` against the existing `Environment` enum and `monthStart`/`monthEnd` or `startDate`/`endDate` as parseable ISO dates (400 via `ValidationCException` otherwise), responses wrapped in `ApiResponseClass.succeeded(...)`.
- [X] T011 Register `ReportsController` in `MonitoringDashboardOrchestratorServiceLayerMSC/src/index.ts` with `{ prefix: ApplicationRouteFactory.current.reports.CONTROLLER_URL }`, alongside the existing controller registrations.
- [X] T012 [P] Create frontend types in a new `MonitoringDashboardClientServiceLayerMSC/src/Types/ReportType.ts` mirroring T007/T009's shapes (`DayCompletenessStateType`, the available-categories response shape, a `SelectionKey` string type) and export them through `MonitoringDashboardClientServiceLayerMSC/src/Types/index.ts`'s existing barrel.
- [X] T013 Create `MonitoringDashboardClientServiceLayerMSC/src/Services/ReportService.ts` (`public static current`) with methods calling `GET day-completeness`, `GET available-categories`, `POST generate`, and `GET /:reportId`, following `ApplicationMonitorService.ts`'s existing fetch + `ApiResponseType` success-check pattern (constitution's Structured API Response Envelope).

**Checkpoint**: The persisted table exists, the modal's two configuration endpoints work, and the frontend has a typed client for all four endpoints. User story implementation can now begin.

---

## Phase 3: User Story 1 - Generate a same-day report (Priority: P1) 🎯 MVP

**Goal**: Replace "Run Smoke Test" with "Generate Report"; generating a same-day
report produces exact, category-filtered results on a new, dedicated page.

**Independent Test**: Open the modal, leave the date range on a single day with
known data, check a subset of categories, generate, and confirm the resulting page
shows exact results for only the selected categories.

### Implementation for User Story 1

- [X] T014 [US1] Implement `ReportsService.current.generateReport({ environment, startDate, endDate, selectedKeys })` in `ReportsService.ts` — single-day branch (`startDate === endDate`): query the matching `TestRun` and its checks for that environment/date, filter to only the categories/sub-items present in `selectedKeys` (data-model.md's key scheme), build the `{ mode: "single-day", date, categories: { ...checks } }` content shape, persist a new `GeneratedReport` row with `rangeStart === rangeEnd`, and return its `id`. (The range branch — T025 — was written in the same pass, since both branches share one cohesive method; marked done here and cross-referenced at T025.)
- [X] T015 [US1] Implement `ReportsService.current.getReportById(reportId)` and wire `GET /api/v1/reports/:reportId` in `ReportsController.ts`, parsing the stored `selectedKeys`/`content` JSON strings back to objects; throw `EntityNotFoundCException` (404) if no row matches, matching `RunsController`'s existing `GET_BY_ID` pattern.
- [X] T016 [US1] Wire `POST /api/v1/reports/generate` in `ReportsController.ts`: validate `environment` is a valid `Environment`, `startDate <= endDate`, and `selectedKeys` is a non-empty array (400 via `ValidationCException` otherwise — contracts/reports-api.md), call T014, respond `ApiResponseClass.succeeded({ reportId })`.
- [X] T017 [P] [US1] In `MonitoringDashboardClientServiceLayerMSC/src/Features/Dashboard/DashboardScreenController.tsx`, remove the "Run Smoke Test" `PrimaryActionButtonSharedComponent`, its `ConfirmationModalSharedComponent` usage, and every dedicated state/handler it alone used (`isRunTestModalOpen`, `isTriggeringRun`, `triggerRunError`, `selectedEnvironment`, `selectedTestIds`, `toggleTestSelection`, `isAuthenticationLoginUnchecked`, `handleOpenRunTestModal`, `handleConfirmRunTest`) — run `impact()` on each before removing it, per the constitution's GitNexus-Gated Workflow. Also removed `LiveRunProgressModalComponent`'s usage/`liveTestRunId` state from this file (exclusively tied to the removed trigger flow); the component/service/route files themselves were deliberately left in place as self-contained and possibly useful for a future "watch the scheduled run live" feature.
- [X] T018 [P] [US1] Remove `MonitoringDashboardOrchestratorServiceLayerMSC/src/Features/Runs/Services/RunTriggerService.ts`, the `TRIGGER` constant from `RunsRoutes` in `ApplicationRouteFactory.ts`, and its handler in `RunsController.ts` (FR-001) — run `impact()` on `RunTriggerService` first. Also removed the now-caller-less `triggerRun` method from the frontend's `RunsService.ts`.
- [X] T019 [US1] Read `DatePickerSharedComponent.tsx` in full: it is single-date-only and widely used elsewhere, so retrofitting it for ranges risked regressing every existing caller. Built a new sibling `DateRangePickerSharedComponent.tsx` instead, mirroring its exact visual language (WAI-ARIA grid, month nav, sizing classes) with its own range-specific prop contract (`DateRangeType`, `onVisibleMonthChange`, `dayClassName` coloring hook, click-twice range selection) — a considered exception to Reuse Before New Code, not a skip of it.
- [X] T020 [US1] Create `MonitoringDashboardClientServiceLayerMSC/src/Features/Dashboard/Components/GenerateReportModalComponent.tsx`: an environment dropdown (`CustomSelectSharedComponent`, options from `DashboardCON.ENVIRONMENTS`), T019's range picker with its days colored via `ReportService.current.getDayCompleteness(...)` (refetched whenever the visible month or environment changes), and a nested checklist — Authentication Login, Authentication Ping, and Indexing Freshness as single checkboxes; Page Loads, Atlas Widgets, and Queue Status each expandable into sub-items fetched via `ReportService.current.getAvailableCategories(...)` (refetched whenever the selected range or environment changes) — with a footer "Generate" button disabled until at least one key is selected (FR-006).
- [X] T021 [US1] Create `MonitoringDashboardClientServiceLayerMSC/src/Features/Dashboard/Components/ReportGenerationLoadingModalComponent.tsx`: a modal with no close button and no backdrop-dismiss, showing a placeholder loading indicator (to be swapped for a real animation asset later per spec Assumptions).
- [X] T022 [US1] Wire `DashboardScreenController.tsx`: add a "Generate Report" button (`FileBarChart` from `lucide-react`) in the slot T017 vacated, opening T020's modal; on T020's Generate action, close it, open T021's loading modal, call `ReportService.current.generateReport(...)`, then on success call `onReportGenerated(reportId)` (wired to router navigation in T023) and close the loading modal (on failure, toast the error and close the loading modal without navigating).
- [X] T023 [US1] Add a `/report/$reportId` route in `MonitoringDashboardClientServiceLayerMSC/src/Router/ApplicationRouter.tsx` (a new `createRoute` sibling to the existing `dashboardRoute`, wired to `onReportGenerated`'s navigation) and fill in `MonitoringDashboardClientServiceLayerMSC/src/Routes/ReportScreenRoute.tsx` (from T003) as its thin wrapper, per plan.md's Structure Decision (a real path segment, independently bookmarkable, not a `?app=` search param).
- [X] T024 [US1] Create `MonitoringDashboardClientServiceLayerMSC/src/Features/Report/ReportScreenController.tsx`: fetch the report via `ReportService.current.getReportById(reportId)` on mount; for `content.mode === "single-day"`, render each included category's checks grouped under its heading, reusing the existing `PingCheckCardSharedComponent` / `LoginCheckCardSharedComponent` / `PageLoadCheckCardSharedComponent` / `IndexingFreshnessCardSharedComponent` / `QueueStatusCardSharedComponent` exactly as the Dashboard's "Today's Test" tab already does. (Range-mode rendering — T026 — was written in the same pass since both modes share one component; marked done here and cross-referenced at T026.)

**Checkpoint**: User Story 1 is fully functional and independently testable — a same-day report can be configured, generated, and viewed.

---

## Phase 4: User Story 2 - Generate a multi-day report (Priority: P2)

**Goal**: The same modal, when given a multi-day range, produces per-category
summaries, a day-by-day completeness strip, and a combined failure list instead of
exact single-day numbers.

**Independent Test**: Select a range spanning several days (including one with no
recorded runs), generate, and confirm the report shows aggregated totals, the empty
day correctly marked "empty" (not a failure), and one combined failure list.

### Implementation for User Story 2

- [X] T025 [US2] Extend T014's `generateReport(...)` with the range branch (`startDate !== endDate`): compute, per category/sub-item in `selectedKeys`, `{ total, passed, failed, passRate }` across the range; reuse T008's exact per-day completeness rule to build the range's `dayCompleteness` map; and build the combined `failures` list (every failing check in range, with `date`, `category`, `pageName`, `message`) — per data-model.md's "range" content shape.
- [X] T026 [US2] In `ReportScreenController.tsx` (T024), add rendering for `content.mode === "range"`: a summary stat block per category (total/pass/fail/pass-rate), a day-by-day strip reusing the same three-state coloring (emerald/amber/neutral), and one combined failure table (date, category, page, message).

**Checkpoint**: User Story 1 and User Story 2 both work independently.

---

## Phase 5: User Story 3 - Revisit or share a generated report (Priority: P3)

**Goal**: A generated report's URL shows the identical frozen content to anyone who
opens it, with no sign-in and no regeneration, and can be exported to PDF.

**Independent Test**: Open a previously generated report's URL in a fresh,
unauthenticated session and confirm identical content renders; click Export and
confirm a PDF downloads.

### Implementation for User Story 3

- [X] T027 [US3] Create `MonitoringDashboardClientServiceLayerMSC/src/Services/ReportPDFExportService.ts` (`public static current`), mirroring SignForge's `PDFGeneratorService.ts` pattern (`html2canvas-pro` + `pdf-lib`), adapted to slice an arbitrary-length report container into A4-height pages (SignForge's version only ever had a fixed 3-page document) rather than one fixed page count; triggers a browser download via a `Blob` URL and an invisible anchor click (research.md §1).
- [X] T028 [US3] Add an "Export PDF" action to `ReportScreenController.tsx` (T024), wired to T027.

**Checkpoint**: All three user stories are independently functional. US3's "no
sign-in, unchanged after underlying data changes" behavior requires no additional
backend work — it falls directly out of T014/T015's snapshot persistence and this
app's existing lack of an authentication system.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T029 [P] Run `impact()` on every pre-existing symbol touched across T004-T028 and `detect_changes({scope: "all"})` before committing, per the constitution's GitNexus-Gated Workflow. Also discovered mid-implementation that `RunLiveProgressService.ts` (kept in T017 under the assumption it was self-contained) actually imported the now-deleted `RunTriggerService` for its `isRunActive()` check — confirmed via text search it had exactly one caller (`RunsController`'s `LIVE` websocket route, itself only ever meaningful for a manually-triggered run) and deleted both it and the route/`LIVE` constant.
- [X] T030 Ran all scenarios end-to-end against the local dev stack (`MonitoringDashboardRunnerScriptsNMSC/DevelopmentServerScripts`) via chrome-devtools-mcp + direct API calls. Caught and fixed a real bug in the process: `ReportsController.ts` parsed `endDate`/`monthEnd` from bare `"YYYY-MM-DD"` strings via `new Date(...)`, which lands on UTC midnight — as an upper (`lte`) bound this silently excluded every check recorded later that same day, so a single-day report or `available-categories` call for "today" always came back empty. Fixed with `ReportsValidationCON.toEndOfUtcDay(...)` widening every end-of-range date to `23:59:59.999` before it reaches `ReportsService`. Verified after the fix: same-day report (Nov 9) correctly shows only the selected categories with real data; range report (Nov 6-12) correctly shows per-category totals/pass-rate, empty days (Nov 7/8/11) marked "empty" not failures, and a combined failure list; PDF export downloaded a valid 473KB file.
- [X] T031 [P] Confirmed via text search (zero references outside their own declaration) that `DashboardCON.RUN_SMOKE_TEST_ITEMS`, `RUN_SMOKE_TEST_ENVIRONMENTS`, and `AUTHENTICATION_LOGIN_TEST_ID` were genuinely dead after T017's removal; deleted them (and the now-unused `RunSmokeTestItemDef` interface and its icon imports) from `DashboardCON.tsx`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational only.
- **User Story 2 (Phase 4)**: Depends on Foundational and on T014/T024 existing (extends them) — cannot start before Phase 3's T014/T024 exist, so it is sequential after US1 here, not parallel to it.
- **User Story 3 (Phase 5)**: Depends on Foundational and on T024 existing (adds an export action to the same page) — sequential after US1, independent of US2.
- **Polish (Final Phase)**: Depends on whichever user stories were completed.

### Within Each User Story

- Backend service logic before the controller route that calls it.
- Backend endpoints before the frontend components that call them.
- Dashboard removal (T017/T018) can run in parallel with backend work (T014-T016) — different files.
- Report page scaffolding (T023) before report page content rendering (T024).

### Parallel Opportunities

- T002 and T003 (Setup) are independent folders.
- T007 and T012 (Foundational models/types) touch different files than the services that consume them.
- T017 and T018 (US1 removals) touch entirely different files from T014-T016 (US1 backend) and from each other.
- T029 and T031 (Polish) are independent checks.

---

## Parallel Example: User Story 1

```bash
# Backend and dashboard-cleanup can proceed together — different files:
Task: "Implement ReportsService.current.generateReport single-day branch in MonitoringDashboardOrchestratorServiceLayerMSC/src/Features/Reports/Services/ReportsService.ts"
Task: "Remove the Run Smoke Test button/modal/state from MonitoringDashboardClientServiceLayerMSC/src/Features/Dashboard/DashboardScreenController.tsx"
Task: "Remove RunTriggerService.ts and its route"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1).
3. **STOP and VALIDATE**: run `quickstart.md` Scenario 1 independently.
4. Ship — a same-day report is already a complete, useful increment on its own.

### Incremental Delivery

1. Setup + Foundational → modal configuration (date coloring, nested checklist) works end-to-end, nothing to show yet.
2. + User Story 1 → same-day reports work (MVP) → validate → ship.
3. + User Story 2 → multi-day reports work → validate → ship.
4. + User Story 3 → sharing/export work → validate → ship.

## Notes

- `impact()` before editing any pre-existing symbol, and `detect_changes({scope: "all"})` before every commit, apply throughout — not repeated as a task per file; see T029 and the constitution's GitNexus-Gated Workflow.
- No test tasks are included; see the Tests note at the top of this file.
- Commit after each task or logical group, per this repository's established "commit incrementally" convention.
