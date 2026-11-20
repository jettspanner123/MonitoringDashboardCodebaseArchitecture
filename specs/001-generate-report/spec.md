# Feature Specification: Generate Report

**Feature Branch**: `001-generate-report`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Replace the 'Run Smoke Test' button on the Morning Smoke Test page with a 'Generate Report' button. Clicking it opens a modal asking for an environment, a date range, and a nested checklist of check categories (and their individual pages/items) to include. Generating closes that modal, shows a control-free loading modal while the backend computes the report, then opens the finished report on its own page. Single-day reports show exact per-check results; multi-day reports show per-category summaries, a day-by-day completeness strip, and a combined failure list. Reports are persisted as immutable snapshots, each reachable at its own shareable URL, and exportable as a PDF."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate a same-day report (Priority: P1)

A user on the Morning Smoke Test page wants a clean, filtered view of exactly what happened today, instead of scrolling the full live dashboard. They click "Generate Report," leave the date range on today, pick only the categories they care about, and generate.

**Why this priority**: This is the core, everyday use of the feature — "this is the status of all the checks" for the current day — and delivers value on its own even before multi-day reporting exists.

**Independent Test**: Can be fully tested by opening the modal, selecting today's date and a subset of categories, generating, and confirming the resulting page shows exact results for only the selected categories/items.

**Acceptance Scenarios**:

1. **Given** the Morning Smoke Test page, **When** the user clicks "Generate Report," **Then** a modal opens with an environment dropdown, a date-range picker, and a nested checklist of check categories (Authentication Login, Authentication Ping, Page Loads, Atlas Widgets, Indexing Freshness, Queue Status), each category showing its own specific pages/items drawn from what has actually been recorded for the selected environment and date range.
2. **Given** the modal is open, **When** no category or item is selected, **Then** the "Generate" action is disabled.
3. **Given** the modal is open with today selected as a single-day range and at least one category checked, **When** the user clicks "Generate," **Then** the configuration modal closes and a second, control-free modal with a loading indicator appears.
4. **Given** report generation completes successfully, **When** the loading modal is showing, **Then** the user is automatically taken to the new report's own page, displaying exact per-check results (status, detail) grouped by category, filtered to only the selected categories/items, in the same visual style as the existing single-day check cards.

---

### User Story 2 - Generate a multi-day report (Priority: P2)

A user wants an overview of how a range of days performed — for example, the past week — rather than a single day's exact numbers.

**Why this priority**: Occasional but important use case explicitly requested; depends on the same configuration flow as User Story 1, differing only in the date range and the shape of the resulting report.

**Independent Test**: Can be fully tested by selecting a multi-day range in the modal, generating, and confirming the resulting page shows aggregated per-category summaries and a combined failure list rather than single-day exact numbers.

**Acceptance Scenarios**:

1. **Given** the modal is open, **When** the user selects a date range spanning more than one day and at least one category, **Then** generating produces a report page showing, per selected category: total checks, pass count, fail count, and pass rate across the range.
2. **Given** a generated multi-day report, **When** the user views it, **Then** it also shows a day-by-day strip across the range indicating, per day, whether every expected category ran, only some ran, or none ran.
3. **Given** a generated multi-day report, **When** the user views it, **Then** it also shows a single combined list of every individual failing check across the whole range, each with its page, category, exact date, and message.
4. **Given** a date range that includes a day with no recorded checks at all, **When** the report is generated, **Then** that day is shown as having no data (not as a failure) in both the day-by-day strip and the per-category totals.

---

### User Story 3 - Revisit or share a generated report (Priority: P3)

A user wants to send a colleague a link to a report they just generated, or come back to it later themselves, without anyone needing to regenerate it or sign in.

**Why this priority**: Extends the value of User Stories 1 and 2 by making a generated report durable and shareable, but a report must exist before it can be shared, so this depends on them.

**Independent Test**: Can be fully tested by opening a previously generated report's URL in a fresh browser session (no prior interaction with the modal) and confirming the same content renders, plus confirming a PDF export action is available.

**Acceptance Scenarios**:

1. **Given** a report was generated earlier and its URL is known, **When** that URL is opened directly, **Then** the same report content renders without requiring the modal to be re-run and without requiring sign-in.
2. **Given** the underlying historical check data used to build a report is later changed or removed, **When** that report's URL is opened again, **Then** the report still shows exactly what it showed at generation time.
3. **Given** a generated report page, **When** the user chooses to export it, **Then** a PDF document containing the report's content is produced.

---

### Edge Cases

- What happens when the selected environment and date range have no recorded checks at all for any category? The report generates successfully and clearly shows "no data" rather than erroring or showing blank sections.
- What happens if the user closes the browser tab or navigates away while the loading modal is showing? Generation is not resumable through the UI; the user must reconfigure and generate again (no report-in-progress recovery).
- How does the system handle a category whose sub-items only have data for part of a multi-day range? Items with no data in part of the range show zero counts for that portion rather than being omitted.
- What happens to the existing manual smoke-test-triggering capability once "Run Smoke Test" is removed? It is fully removed; the independent scheduled daily run is unaffected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove the "Run Smoke Test" button, its configuration modal, and its backend trigger capability entirely from the Morning Smoke Test page.
- **FR-002**: System MUST add a "Generate Report" button, with an appropriate icon, in the position previously occupied by "Run Smoke Test."
- **FR-003**: System MUST, on clicking "Generate Report," open a configuration modal containing an environment dropdown independent of the page's own environment filter, a date-range picker permitting any range including a single day with no dates disabled, and a nested checklist of the six check categories (Authentication Login, Authentication Ping, Page Loads, Atlas Widgets, Indexing Freshness, Queue Status).
- **FR-004**: System MUST, for categories that have individual sub-items (Page Loads, Atlas Widgets, Queue Status), let the user expand that category to see and individually select its specific pages/items, derived from what is actually recorded for the currently selected environment and date range rather than a fixed list.
- **FR-005**: System MUST visually indicate, per day in the date-range picker, one of three states: every expected category has recorded data that day, only some categories do, or none do.
- **FR-006**: System MUST disable the modal's "Generate" action until at least one category or sub-item is selected.
- **FR-007**: System MUST, on clicking "Generate," close the configuration modal and open a second modal containing only a loading indicator (no interactive controls) until generation completes or fails.
- **FR-008**: System MUST compute the report's content on the backend, scoped strictly to the selected environment, date range, and selected categories/sub-items.
- **FR-009**: System MUST, when the selected range is a single day, present exact per-check results (status and detail) grouped by category, in the same presentation already used for single-day check results elsewhere on this page, filtered to the selected categories/sub-items.
- **FR-010**: System MUST, when the selected range spans multiple days, present per selected category: total checks, pass count, fail count, and pass rate across the range; the day-by-day completeness indicator from FR-005 across the same range; and one combined list of every individual failing check in the range with its page, category, date, and message.
- **FR-011**: System MUST, on successful generation, persist the complete computed report content as an immutable snapshot, assigned a short, non-guessable identifier.
- **FR-012**: System MUST make every generated report viewable at its own dedicated URL, loadable by anyone with the link, with no sign-in required.
- **FR-013**: System MUST automatically take the user to the new report's page once generation completes.
- **FR-014**: System MUST NOT change a report's displayed content after generation, even if the historical check data it was built from is later modified or removed.
- **FR-015**: System MUST offer an action on the report page that produces a PDF export of that report's content.

### Key Entities

- **Generated Report**: A persisted, immutable snapshot representing one completed report-generation request. Represents the environment, date range, and selected categories/sub-items it was generated from, the fully computed result content (exact results for a single day, or summaries/day-by-day completeness/failure list for a range), the time it was generated, and its unique shareable identifier.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can configure and generate a same-day report, selecting only the categories they care about, within 1 minute of interaction time (excluding server-side generation wait).
- **SC-002**: A generated report's URL, opened by a different person at a later time, shows content identical to what was originally generated, 100% of the time, even if the underlying historical data has since changed.
- **SC-003**: For a generated multi-day report, a user can identify every day in the range with no recorded checks, partial checks, or complete checks at a glance, without opening any individual day's detail.
- **SC-004**: A user can locate the specific page, category, and date of every failing check within a generated multi-day report without needing to cross-reference the live Morning Smoke Test page.
- **SC-005**: After this feature ships, the manual smoke-test-triggering action is no longer reachable from the Morning Smoke Test page, while the existing scheduled daily run continues to operate unaffected.

## Assumptions

- The existing scheduled 8:30 AM automated smoke-test run is independent of the "Run Smoke Test" button and continues unaffected by its removal.
- "Services" and "pages" mentioned in the original request refer to the same six check categories already listed, not additional distinct categories.
- Export format is assumed to be PDF; if a different format (e.g. CSV) is actually wanted, this assumption should be revisited.
- No report-history browsing UI is in scope; a generated report is reachable only via the URL produced at generation time (the automatic post-generation redirect, or a link shared from it).
- No explicit cap is placed on how large a requested date range can be; very large ranges may simply take longer to generate.
- The loading indicator shown during generation is a temporary placeholder until a specific animation asset is supplied separately.
