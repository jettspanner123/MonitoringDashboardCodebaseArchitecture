# Research: Generate Report

All items below were resolved by inspecting this codebase and its two sibling
applications (AssetSphere, SignForge) directly — no items remain open.

## 1. PDF export mechanism

**Decision**: Generate the PDF client-side, in the browser, from the already-rendered
report page — using `pdf-lib` (`^1.17.1`) to assemble the PDF and `html2canvas-pro`
(`^2.4.1`) to rasterize the report's DOM sections into images embedded as PDF pages.
Trigger a direct browser download via a `Blob` URL, exactly as
`SignForgeClientServiceLayerMSC/src/Services/PDFGeneratorService.ts` already does for
offer-letter PDFs.

**Rationale**: This is a real, working, already-shipped pattern in a sibling
application in the same family (per the constitution's "Reuse Before New Code"
principle, sibling codebases are the fallback when nothing exists here yet). It keeps
the backend simple (no PDF library, no headless-browser dependency, no extra request)
since the content to export is already fully rendered on the report page by the time
the user clicks "Export."

**Alternatives considered**: Server-side PDF generation (e.g. a headless-Chromium
print-to-PDF, or a server PDF library) was rejected — it would require a new backend
dependency with no existing precedent anywhere in this app family, and duplicates
rendering logic that already exists correctly on the frontend.

## 2. Report identifier scheme

**Decision**: Use Prisma's existing `@default(cuid())` convention — identical to every
other model in this schema — for the new report table's primary key, and use that same
id directly as the `reportId` in the `/report/:reportId` URL.

**Rationale**: `cuid()` already produces a short, non-sequential, non-guessable,
URL-safe string. It satisfies the spec's "short, non-guessable identifier" requirement
with zero new code, and keeps this table consistent with all 15 others.

**Alternatives considered**: A custom slug/nanoid generator was rejected as pure added
complexity — `cuid()` already does this with no new dependency.

## 3. Mapping categories/sub-items to existing check data

**Decision**: The six report categories map onto existing data exactly as the frontend
already discriminates them (`RunsService.computeHealth`'s source data, inspected
directly in `RunsService.ts` and `DashboardScreenController.tsx`):

| Report category | Source table | Discriminator |
|---|---|---|
| Authentication Login | `AuthenticationLoginCheck` | n/a (no sub-items) |
| Authentication Ping | `AuthenticationPingCheck` | n/a (no sub-items) |
| Page Loads | `PageLoadCheck` | `pageName` NOT starting with `"AtlasWidget"` |
| Atlas Widgets | `PageLoadCheck` | `pageName` starting with `"AtlasWidget"` |
| Indexing Freshness | `IndexingFreshnessCheck` | n/a (no sub-items) |
| Queue Status | `QueueStatusCheck` | sub-item = distinct `pageName` |

Sub-item lists for Page Loads, Atlas Widgets, and Queue Status are derived live per
request (distinct `pageName` values actually present for the chosen environment and
date range), not a fixed list — environments are not guaranteed to have identical
check sets over time.

**Rationale**: Replicates the exact, already-correct discriminator logic
(`pageName.startsWith('AtlasWidget')`) the frontend already uses, rather than
inventing a second, possibly-inconsistent classification.

**Alternatives considered**: Adding a new `category` column to `PageLoadCheck` was
rejected — it would require a schema migration touching a table owned by
`MorningSmokeTestAutomation`'s own migration history (see constitution's Database &
Migration Discipline), for a distinction the existing string prefix already encodes
correctly.

## 4. Single-day report visual reuse

**Decision**: Reuse the Dashboard's existing category-grouped card-grid presentation
(the same `PingCheckCardSharedComponent` / `LoginCheckCardSharedComponent` /
`PageLoadCheckCardSharedComponent` / `IndexingFreshnessCardSharedComponent` /
`QueueStatusCardSharedComponent` already used by the "Today's Test" tab), generalized
to render for whichever single date was selected rather than only "today."

**Rationale**: Directly confirmed with the user as the intended reuse target; these
components already handle every category's real data shape correctly.

**Alternatives considered**: `RunDetailScreenController`'s flat single-table view
(Page / Check / Status / Message / Details) was considered since it already supports
viewing an arbitrary historical run, but was rejected — it is a different, denser
visual treatment than the confirmed card-grid target.

## 5. Report generation execution model

**Decision**: Synchronous request/response. `POST /api/v1/reports/generate` performs
the aggregation and persists the snapshot within the same request, returning
`{ reportId }` once complete. The frontend's "control-free loading modal" is simply
shown for the duration of that one HTTP call.

**Rationale**: Unlike Client Machine Services' hit/action flows (which need
websocket-driven live progress because they involve slow, flaky calls to real remote
VMs), report generation is pure internal database aggregation — fast and
deterministic. Introducing a websocket/live-progress channel here would copy a pattern
built to solve a problem (unpredictable external network calls) that does not exist
in this feature.

**Alternatives considered**: A websocket live-progress channel (mirroring
`ApplicationMonitorService`/`ClientMachineServicesService`) was rejected as
unnecessary complexity for a same-process DB query.
