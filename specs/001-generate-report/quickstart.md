# Quickstart: Generate Report

Validates the feature end-to-end once implemented. Assumes the local dev stack is
already set up per `MonitoringDashboardAgentDocumentationNMCS/STARTING_CLIENT_MACHINE_RELAY_WORKER_LOCALLY_STEPS.md`'s
backend/frontend steps (the relay worker is not needed for this feature).

## Prerequisites

- Backend running (`cd MonitoringDashboardOrchestratorServiceLayerMSC && npm run dev`), with the
  `006_*.sql` manual-sql migration for `MD_GeneratedReportTBL` already applied via
  `bunx tsx scripts/RunManualSql.ts prisma/manual-sql/006_*.sql`.
- Frontend running (`cd MonitoringDashboardClientServiceLayerMSC && npm run dev`).
- At least one existing `TestRun` with check data for some environment/date (any
  environment already exercised by `MorningSmokeTestAutomation` works).

## Scenario 1 — Same-day report (User Story 1)

1. Open the Morning Smoke Test page. Confirm the old "Run Smoke Test" button is gone
   and a "Generate Report" button is in its place.
2. Click "Generate Report". Confirm the modal shows an environment dropdown, a
   date-range picker, and the nested checklist (6 categories, 3 of them expandable).
3. Leave the range on a single day known to have data; check only "Authentication
   Ping" and "Page Loads".
4. Confirm "Generate" is disabled until at least one box is checked, then click it.
5. Confirm the configuration modal closes and a second, control-free loading modal
   appears.
6. Confirm the browser is taken to a new `/report/:reportId` URL once generation
   finishes, showing only Authentication Ping and Page Loads cards for that day, in
   the same card style used elsewhere on this page.

## Scenario 2 — Multi-day report (User Story 2)

1. Repeat steps 1-2 above, this time selecting a range spanning several days,
   including at least one day known to have no recorded runs.
2. Generate with at least one category checked.
3. On the resulting report page, confirm: per-category total/pass/fail/pass-rate
   numbers, a day-by-day strip showing the day with no data as "empty" (not an
   error), and a single combined failure list spanning the whole range.

## Scenario 3 — Revisit and export (User Story 3)

1. Copy the URL from either scenario above.
2. Open it in a new, unauthenticated browser session (or an incognito window).
Confirm the identical report renders with no login prompt and no regeneration step.
3. Click the report's export action. Confirm a PDF file downloads containing the
   report's content.
4. (Manual, requires direct DB access) Modify or delete one of the underlying checks
   that fed this report, then reload the report's URL. Confirm the report's displayed
   numbers are unchanged (FR-014) — it is reading the stored snapshot, not recomputing.

## Out of scope for this validation

- No report-history/browsing UI exists (by design — see spec Assumptions); reports
  are only reachable via the URL produced at generation time.
- No cap on date-range size is enforced; a very large range is expected to simply
  take longer, not fail.
