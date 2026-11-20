// Per-day state for the report modal's date picker and a range report's own
// day-by-day strip (same rule, reused in both places - see
// specs/001-generate-report/data-model.md): "complete" - every category
// expected to run that day has at least one recorded check; "partial" - only
// some do; "empty" - none do.
type DayCompletenessStateType = 'complete' | 'partial' | 'empty';

export default DayCompletenessStateType;
