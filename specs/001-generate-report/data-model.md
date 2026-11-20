# Data Model: Generate Report

## New entity: `GeneratedReport`

One row per completed report generation — an immutable snapshot (see research.md §2
and §5; FR-011, FR-014). Added via a new hand-written `prisma/manual-sql/006_*.sql`
file, following this schema's established convention (never `prisma migrate`).

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (`@id @default(cuid())`) | Also serves as the `reportId` in `/report/:reportId`. |
| `environment` | `Environment` (existing enum) | The environment the report was generated for. |
| `rangeStart` | `DateTime` | Inclusive start of the selected date range (midnight UTC of that calendar day). |
| `rangeEnd` | `DateTime` | Inclusive end of the selected date range (midnight UTC of that calendar day). A single-day report has `rangeStart == rangeEnd`. |
| `selectedKeys` | `String` | JSON array of the flat category/sub-item keys the user selected (see "Selection key scheme" below). Free-form JSON-as-text, matching `ApplicationEndpoint.config`'s existing convention — not a new Postgres JSON column type. |
| `content` | `String` | JSON-as-text: the fully computed, frozen report payload (see "Report content shape" below). |
| `createdAt` | `DateTime` (`@default(now())`) | Generation time. |

```prisma
model GeneratedReport {
  id            String      @id @default(cuid())
  environment   Environment
  rangeStart    DateTime
  rangeEnd      DateTime
  selectedKeys  String
  content       String
  createdAt     DateTime    @default(now())

  @@map("MD_GeneratedReportTBL")
}
```

No relations to other tables — a report is a frozen, self-contained copy of what the
underlying checks looked like at generation time (FR-014), not a live reference to
them.

## Selection key scheme

A flat array of strings, each identifying one selected category or sub-item:

- Categories with no sub-items select as the bare checkType string: `"AuthenticationLogin"`, `"AuthenticationPing"`, `"IndexingFreshness"`.
- Categories with sub-items select as `"<checkType>:<pageName>"`, e.g. `"PageLoad:Admin Controlls"`, `"AtlasWidget:AtlasWidget1"`, `"QueueStatus:XPDMGW Queue Status"`.
  - Note: Page Loads and Atlas Widgets share the same underlying `checkType` value (`"PageLoad"` in the existing check data) but are distinguished here as separate key prefixes, matching the `pageName`-prefix discriminator in research.md §3. The "parent category checked" state shown in the UI is a derived, frontend-only convenience (all/some/none of its known sub-items selected) — the backend only ever receives and stores the resolved flat list.

## Report content shape (the `content` JSON)

Discriminated by `mode`:

**Single-day** (`rangeStart == rangeEnd`):

```json
{
  "mode": "single-day",
  "date": "2026-11-20",
  "categories": {
    "AuthenticationLogin": { "checks": [ /* same shape PingCheckCard/LoginCheckCard already consume */ ] },
    "AuthenticationPing": { "checks": [ ... ] },
    "PageLoad": { "checks": [ ... ] },
    "AtlasWidget": { "checks": [ ... ] },
    "IndexingFreshness": { "checks": [ ... ] },
    "QueueStatus": { "checks": [ ... ] }
  }
}
```

Only categories/sub-items actually present in `selectedKeys` are included. Each
`checks` array holds the same per-check fields the existing `PageCheckDTO`/frontend
check cards already render (status, message, pageName, statusCode, etc.) — no new
per-check shape is introduced.

**Range** (`rangeStart != rangeEnd`):

```json
{
  "mode": "range",
  "categories": {
    "<checkType or checkType:pageName>": {
      "total": 0,
      "passed": 0,
      "failed": 0,
      "passRate": 0.0
    }
  },
  "dayCompleteness": {
    "2026-11-14": "complete",
    "2026-11-15": "partial",
    "2026-11-16": "empty"
  },
  "failures": [
    { "date": "2026-11-15", "category": "PageLoad", "pageName": "JRDS", "message": "..." }
  ]
}
```

`dayCompleteness` values are one of `"complete"` (every selected category that is
expected to run that day has at least one recorded check), `"partial"` (only some
do), or `"empty"` (none do) — see research.md and FR-005/FR-009; this is the same
three-state rule reused for both the modal's date picker and the report's own
day-by-day strip.

## Existing entities this feature reads (no changes)

- `TestRun` — scoped by `environment` and `createdAt` within the selected range.
- `AuthenticationLoginCheck`, `AuthenticationPingCheck`, `PageLoadCheck`,
  `IndexingFreshnessCheck`, `QueueStatusCheck` — the six categories' underlying data,
  all joined to `TestRun` via `testRunId`, read-only.
