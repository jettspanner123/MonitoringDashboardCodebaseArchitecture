# Morning Smoke Test Monitoring

This context covers the daily morning smoke test run against Atlas Copco's 3DEXPERIENCE/3DSpace PLM platform, and the results a person reviews to confirm everything worked.

## Language

### Entities

**Run**:
One full execution of the smoke test automation, occurring once per day (currently 8:30 AM). Carries a derived Health.
_Avoid_: Session, Job, Execution

**Page**:
A standing, configured target that is checked on every Run (e.g. "3DSpace search").
_Avoid_: Target, Endpoint, URL

**PageCheck**:
The result of checking one Page within a specific Run.
_Avoid_: Step, Test

**PopupCheck**:
A configured sub-check nested under a Page, verifying something reachable from that Page (e.g. opening a menu item's tab and asserting an element appears).
_Avoid_: Sub-step, Nested check

**PopupCheckResult**:
The outcome of a PopupCheck within a specific PageCheck.
_Avoid_: Sub-result

### Result vocabulary

**Outcome**:
The result of executing a PageCheck or PopupCheck. Always has a Status; may carry check-specific Details.
_Avoid_: Result (ambiguous between the Outcome and the PageCheck it belongs to)

**Status**:
One of Pass, Fail, Warning, or Error — describes a single Outcome.
_Avoid_: Health (reserved for a Run's aggregate indicator)

**Details**:
Additional check-specific information attached to an Outcome, beyond its Status — for example a queue depth. Shape varies by Page; not every Outcome has Details.
_Avoid_: Payload, Data

**Health**:
A Run's derived overall indicator, computed from the Status of its PageChecks: Healthy (all Pass), Degraded (some Warning, none Fail/Error), or Failed (any Fail/Error).
_Avoid_: Run Status, Status (reserved for a single Outcome)
