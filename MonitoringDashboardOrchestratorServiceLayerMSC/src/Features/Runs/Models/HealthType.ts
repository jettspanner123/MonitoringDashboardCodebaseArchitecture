// CONTEXT.md: a Run's derived overall indicator, computed from the Status of
// its PageChecks — Healthy (all Pass), Degraded (some Warning, none
// Fail/Error), or Failed (any Fail/Error).
type HealthType = 'Healthy' | 'Degraded' | 'Failed';

export default HealthType;
