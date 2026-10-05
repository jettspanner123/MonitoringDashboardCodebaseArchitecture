# Commit Message Guidelines

Every commit message in this repository follows one format:

```
<Verb>: <Title Case Description>
```

- **Verb** is a single past-tense word describing the kind of change, followed by a colon. Use one of:
  - `Added` — a new file, feature, or test was introduced.
  - `Updated` — existing behavior or content was changed or improved.
  - `Refactored` — code was restructured with no behavior change (renames, reorganization, splitting files).
  - `Fixed` — a bug was corrected.
- **Description** is written in Title Case (each major word capitalized), short and specific — typically 3 to 7 words. No trailing period.

## Examples from history

```
Added: 3DSwym Automation Smoke Test
Added: Tests For Atlast CopCo Widgets
Added: Adminstration Console Tests
Refactored: Codebase To Match Pascal Case
Updated: Global Authentioncation File Changed
Updated: Global Setup Error Handling With Boxen And Chalk
```

Keep one commit focused on one described change — if a change has two distinct concerns (e.g. a code change and a documentation addition), split them into separate commits rather than combining verbs.
