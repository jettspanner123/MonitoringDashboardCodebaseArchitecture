# API Contract: Reports

New Fastify feature `Features/Reports/ReportsController.ts`, registered at prefix
`/api/v1/reports` (a new `ReportsRoutes` class added to `ApplicationRouteFactory`,
following the exact pattern every other feature already uses). Every response is
wrapped in the existing `ApiResponseClass<T>` envelope
(`{ data, success, message, errors, statusCode }`) per the constitution's Structured
API Response Envelope principle — omitted below for brevity, shown only as the `data`
payload.

## `GET /api/v1/reports/day-completeness`

Powers the date-range picker's per-day coloring (FR-005) as the visible calendar
month or environment changes.

**Query**: `environment` (required, one of the `Environment` enum values),
`monthStart`, `monthEnd` (required, ISO date strings — the calendar's visible range).

**Response `data`**: `Record<string, "complete" | "partial" | "empty">`, keyed by ISO
date (`YYYY-MM-DD`), one entry per day in `[monthStart, monthEnd]`.

## `GET /api/v1/reports/available-categories`

Powers the modal's nested checklist (FR-004) as the selected date range or
environment changes.

**Query**: `environment` (required), `startDate`, `endDate` (required, ISO date
strings, inclusive).

**Response `data`**:

```json
{
  "pageLoad": ["Admin Controlls", "JRDS", "NOCAS", "..."],
  "atlasWidget": ["AtlasWidget1", "AtlasWidget2", "..."],
  "queueStatus": ["XPDMGW Queue Status", "3DEXPERIENCE Platform GW Queue Status"]
}
```

Only categories with sub-items are present here; Authentication Login, Authentication
Ping, and Indexing Freshness have no sub-items and are not included (the frontend
always offers them as a single, non-expandable checkbox). Lists reflect distinct
`pageName` values actually recorded in the given environment/range — never a fixed
list (research.md §3).

## `POST /api/v1/reports/generate`

Computes and persists one report snapshot (FR-008 through FR-011).

**Body**:

```json
{
  "environment": "PRODUCTION",
  "startDate": "2026-11-14",
  "endDate": "2026-11-20",
  "selectedKeys": ["AuthenticationLogin", "PageLoad:Admin Controlls", "AtlasWidget:AtlasWidget1"]
}
```

`startDate == endDate` is a valid single-day request. `selectedKeys` MUST be
non-empty (FR-006 — the frontend already disables "Generate" in this case, but the
backend validates it too). Executes synchronously (research.md §5) — no live-progress
channel.

**Response `data`**: `{ "reportId": "<cuid>" }`

**Errors**: 400 if `environment` is invalid, `startDate > endDate`, or `selectedKeys`
is empty.

## `GET /api/v1/reports/:reportId`

Loads a previously generated, frozen report (FR-012, FR-013, FR-014).

**Params**: `reportId`.

**Response `data`**: The stored `GeneratedReport` row — `environment`, `rangeStart`,
`rangeEnd`, `selectedKeys` (parsed back to an array), `content` (parsed back to the
object shape in data-model.md's "Report content shape"), `createdAt`.

**Errors**: 404 if no report exists with that id (existing `EntityNotFoundCException`
pattern, matching `RunsController`'s `GET_BY_ID`).
