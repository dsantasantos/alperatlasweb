# Implementation Plan: Alper Atlas Frontend — Generic Cockpit

**Branch**: `001-generic-cockpit` | **Date**: 2026-06-27 | **Spec**: `specs/001-generic-cockpit/spec.md`

**Input**: Feature specification from `/specs/001-generic-cockpit/spec.md`

## Summary

A generic cockpit UI that renders occurrences and their fields from a backend-supplied
operation schema, lets analysts triage, inspect, edit, approve/reject, and export, and
shows provenance and validation signals on demand. It knows no business domain: labels,
fields, and rules come entirely from schema. The visual identity is defined by the
existing navigable prototype and the documented design system, both binding.

The technical approach is a thin `schema/` adapter layer that maps `FieldDefinition`
objects to render decisions, keeping all components domain-blind. Contract types in
`src/types/` mirror the backend API and are maintained in lockstep.

## Technical Context

**Language/Version**: TypeScript 6.0 (strict mode; `noImplicitAny: true`; no `any` for
contract data).

**Primary Dependencies**: React 19, Vite 7, Tailwind CSS 3.4, @fontsource/inter.

**Storage**: N/A — no browser storage for application state. All state is in-memory,
hydrated from the API on mount.

**Testing**: Vitest + @testing-library/react + @testing-library/user-event (to be
added; see `quickstart.md`). Not yet in `package.json`.

**Target Platform**: Modern browser SPA (Chrome/Edge/Firefox latest).

**Project Type**: Web application (single-page app).

**Performance Goals**: NEEDS CLARIFICATION — no specific latency targets supplied.
Reasonable baseline: initial batch list renders in < 500ms on LAN.

**Constraints**: No `localStorage`/`sessionStorage` for app state (per constitution).
No `any` for contract data. Token values aligned to constitution palette.

**Scale/Scope**: NEEDS CLARIFICATION — number of concurrent analysts and typical batch
size not specified. Assumed: ≤ 100 occurrences per batch; single analyst per session.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Schema-Driven Generic Rendering | No hardcoded fields/labels in components | **PASS** | Grid/detail iterate `OperationSchema.fields`; `LABEL`/`CATALOG` in `seed.ts` are migrated out |
| II. Design System Fidelity | Tailwind constrained to documented tokens | **PASS** | Token hex values aligned to constitution in `tailwind.config.js` + `app.css` (action required — see research.md § 1) |
| III. Single Canonical Surface | Canonical labels only; provenance on demand | **PASS** | `FieldDefinition.label` is the only label surface; provenance shown in detail, never as grid structure |
| IV. Component Isolation & Typed Contracts | No `any` for contract data; small typed components | **PASS** | Types in `src/types/` mirror API; `@typescript-eslint/no-explicit-any` enforced |
| V. Test Discipline | Schema-driven rendering + validation-state behavior covered | **PASS** | `hasBlockingError`, triage filters, and `FieldRenderer` label rendering have mandatory test coverage |
| VI. Accessibility & UX | Triage-first; keyboard-navigable; a11y | **PASS** | Default view shows pending/error occurrences; conforming collapsed with count; keyboard nav per DS |
| VII. AI-Readiness | Decision affordances data-driven | **PASS** | Approve/reject/confirm affordances driven by `status` + validation state; ready for machine pre-decision |

Post-design re-check: **PASS** — no violations introduced by Phase 1 design decisions.

## Project Structure

### Documentation (this feature)

```text
specs/001-generic-cockpit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── api-endpoints.md # Phase 1 output
│   └── ui-contracts.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── schema.ts          # OperationSchema, FieldDefinition
│   ├── batch.ts           # Batch, DiaryEntry
│   ├── occurrence.ts      # Occurrence, OccurrenceStatus, Destination, FieldDelta
│   ├── field.ts           # FieldValue, Provenance
│   ├── validation.ts      # Validation, ValidationRule, RuleLayer
│   ├── timeline.ts        # TimelineEvent
│   ├── artifact.ts        # ExportArtifact
│   ├── session.ts         # Session
│   └── index.ts           # re-exports
├── api/
│   ├── client.ts          # Typed API client (fetch wrapper)
│   ├── schema.ts          # GET /schema/:operationType
│   ├── batches.ts         # GET/POST /batches
│   ├── occurrences.ts     # GET/PATCH/POST /occurrences + approve/reject
│   ├── export.ts          # POST /export, GET /artifacts
│   └── auth.ts            # POST /auth/login, /auth/logout
├── schema/
│   ├── mappers.ts         # FieldDefinition[] → render decisions (toColumns, etc.)
│   └── helpers.ts         # hasBlockingError, applyTriageFilters
├── design-system/
│   ├── tokens.ts          # Token name constants (references CSS vars)
│   └── index.ts
├── components/
│   ├── primitives/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Select.tsx
│   │   ├── Toggle.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── grid/
│   │   ├── OccurrenceGrid.tsx
│   │   ├── OccurrenceRow.tsx
│   │   └── index.ts
│   ├── detail/
│   │   ├── OccurrenceDetail.tsx
│   │   ├── FieldRenderer.tsx
│   │   ├── ValidationDimension.tsx
│   │   ├── ProvenanceChip.tsx
│   │   ├── TimelinePanel.tsx
│   │   └── index.ts
│   ├── triage/
│   │   ├── TriagePanel.tsx
│   │   └── index.ts
│   └── layout/
│       ├── AppShell.tsx   # Existing (reuse)
│       └── index.ts
├── features/
│   ├── conference/
│   │   ├── ConferencePage.tsx
│   │   ├── useConference.ts
│   │   └── index.ts
│   └── export/
│       ├── ExportPanel.tsx
│       └── index.ts
├── data/
│   └── seed.ts            # Existing seed data (used in dev; LABEL/CATALOG removed)
├── styles/
│   └── app.css            # Existing; token hex values aligned to constitution
└── App.tsx

tests/
├── setup.ts
├── components/
│   ├── grid/
│   │   └── OccurrenceGrid.test.tsx
│   ├── detail/
│   │   ├── FieldRenderer.test.tsx
│   │   └── ValidationDimension.test.tsx
│   └── triage/
│       └── TriagePanel.test.tsx
└── schema/
    └── helpers.test.ts
```

**Structure Decision**: Single SPA project with a feature-and-component split. A thin
`schema/` layer holds all render-mapping logic (keeping components domain-blind). The
`types/` directory is the single source of typed API contracts. `design-system/` is
the only styling entry point for token constants.

## Complexity Tracking

> No Constitution Check violations requiring justification.

No violations found. All principles pass without exception.
