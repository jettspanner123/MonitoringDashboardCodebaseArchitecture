// Mirrors the backend's HealthType (CONTEXT.md): a Run's derived overall
// indicator — Healthy (all Pass), Degraded (some Warning, none Fail/Error),
// or Failed (any Fail/Error).
export type HealthType = 'Healthy' | 'Degraded' | 'Failed';
