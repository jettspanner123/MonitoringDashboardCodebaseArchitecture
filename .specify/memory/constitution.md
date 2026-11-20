<!--
Sync Impact Report
==================
Version change: [TEMPLATE] → 1.0.0 (initial ratification)
Modified principles: n/a (first real content; all placeholders replaced)
Added sections:
  - Core Principles: I. Class-Based Singletons, II. Zero Magic Strings
    (Centralized Constants & Route Factories), III. Strict TypeScript
    (Zero `any`), IV. Structured API Response Envelope, V. Reuse Before
    New Code
  - Database & Migration Discipline (Section 2)
  - GitNexus-Gated Development Workflow (Section 3)
  - Governance
Removed sections: none (template placeholders only)
Templates requiring follow-up: none — this command only touches the
  constitution file itself; dependent templates/commands read it at
  runtime and were not modified.
Deferred TODOs:
  - RATIFICATION_DATE set to the date of this first real ratification
    (2026-11-19), since no earlier adopted constitution existed.
-->

# ObservaCore Constitution

## Core Principles

### I. Class-Based Singletons
Every service, utility, factory, and helper — on both the frontend
(`MonitoringDashboardClientServiceLayerMSC`) and the backend
(`MonitoringDashboardOrchestratorServiceLayerMSC`) — MUST be a class
exposing a public static `current` instance (`public static current = new
ClassName()`), never a standalone exported function or a loose module-level
constant. This applies to `*Service.ts`, `*Utility.ts`, `*CON.ts`, and the
backend's `ApplicationRouteFactory`. React functional components and
Zustand store hooks are the only exemption, since they are not
service/utility code.

Rationale: this is the one convention every layer of this codebase — and
every sibling application in this family (AssetSphere, SignForge) —
already converges on independently. A single call style
(`ClassName.current.method()`) everywhere means no caller needs to know
whether something is a class, a hook, or a plain function before using it.

### II. Zero Magic Strings (Centralized Constants & Route Factories)
No inline string literal may stand in for a route, a storage key, a
status label, or any other repeated value. Frontend constants live in a
dedicated `*CON.ts` class (`public static readonly` properties, ALL_CAPS
keys and storage values). Backend routes live in `ApplicationRouteFactory`
(`Factories/ApplicationRouteFactory.ts`), referenced as
`ApplicationRouteFactory.current.<feature>.<ROUTE>` — never hardcoded
inside a controller.

Rationale: a route or label typed twice will eventually drift once; a
route or label referenced from one constant class cannot.

### III. Strict TypeScript (Zero `any`)
`any` is forbidden everywhere in both the frontend and backend. Use exact
interfaces, discriminated unions, generics, or `unknown` with explicit
narrowing instead. Every React functional component MUST declare an
exported `[ComponentName]Props` interface and an explicit
`React.JSX.Element` (or `React.JSX.Element | null`) return type.

Rationale: a dashboard whose entire job is reporting the true state of
other systems cannot itself be built on an escape hatch that silently
discards type information.

### IV. Structured API Response Envelope
Every backend endpoint responds through `ApiResponseClass.succeeded(...)`
or `ApiResponseClass.failed(...)`, never a bare object or raw error.
Every frontend service call consumes the matching `ApiResponseType<T>`
shape and MUST check `.success` before trusting `.data` — never assume a
2xx status implies a populated payload.

Rationale: a consistent envelope is what lets every card on this
dashboard render a clean "no additional details" / error state instead of
a crash, no matter which backend feature produced the response.

### V. Reuse Before New Code
Before writing any new UI code, check whether an existing
`*SharedComponent.tsx` already covers the need and reuse or lightly adapt
it; before writing any new backend logic, check the equivalent pattern
already shipped elsewhere in this codebase (or, where genuinely absent
here, in the sibling AssetSphere/SignForge codebases) rather than
inventing a new one. When nothing fits and new code is genuinely
required, it MUST itself be a proper standalone component or class, never
loose JSX or logic duplicated inline inside a screen controller.

Rationale: this dashboard's entire frontend visual language (cards,
buttons, modals) stayed consistent across dozens of features specifically
because every new screen reached for an existing shared component first.

## Database & Migration Discipline

Prisma schema changes are applied by hand-written SQL files in
`MonitoringDashboardOrchestratorServiceLayerMSC/prisma/manual-sql/*.sql`,
run via `bunx tsx scripts/RunManualSql.ts <path>` — never via
`prisma migrate`. This repository's database is shared with
`MorningSmokeTestAutomation`'s own migration history, so an automatic
Prisma migration here would collide with a history Prisma does not fully
control. Each manual-sql file is numbered sequentially and MUST explain,
in a leading comment, what it adds and why it is hand-written rather than
generated.

## GitNexus-Gated Development Workflow

This repository is indexed by GitNexus. Before editing any existing
function, class, or method, `impact()` MUST be run first to establish
blast radius; a HIGH/CRITICAL risk result MUST be surfaced to the user,
never silently worked around, and an `UNKNOWN` risk MUST be treated as
unresolved (confirmed by a text search) rather than as safe. Before every
commit, `detect_changes({scope: "all"})` MUST be run and its result
reviewed; a `partial: true` or `truncated: true` result is not a clean
check and must be re-run. Symbols are renamed only via GitNexus's `rename`
tool, never via find-and-replace.

## Governance

This constitution supersedes any informal or undocumented practice
encountered during development. Amendments are made by editing this file
directly: a changed or added principle requires a MINOR version bump, a
backward-incompatible removal or redefinition requires a MAJOR bump, and
a wording or clarification-only edit requires a PATCH bump. Every
amendment updates `Last Amended` to the date of the change and leaves
`Ratified` untouched. Each per-project `CODING-RULES.md`
(`MonitoringDashboardClientServiceLayerMSC/CODING-RULES.md` for the
frontend; no backend-specific file exists yet, so the backend principles
above are the authoritative source until one is written) remains the
detailed day-to-day reference; this document is the set of rules from
those files — and from the equivalent sibling-project files found via
GitNexus across AssetSphere, SignForge, PLM, RAG, and IdeonHub — judged
non-negotiable enough to govern every feature built here, not merely
recommended.

**Version**: 1.0.0 | **Ratified**: 2026-11-19 | **Last Amended**: 2026-11-19
