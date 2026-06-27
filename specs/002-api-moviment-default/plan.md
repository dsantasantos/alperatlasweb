# Implementation Plan: CadastralMovimentDefaut — API-Connected Screen

**Branch**: `002-api-moviment-default` | **Date**: 2026-06-27 | **Spec**: `specs/002-api-moviment-default/spec.md`

**Input**: Feature specification from `/specs/002-api-moviment-default/spec.md`

## Summary

Create `CadastralMovimentDefaut.tsx` in `src/pages/moviment/` — a screen structurally
identical to `CadastralMoviment.tsx` but fed entirely by real backend API endpoints.
Simultaneously, build a clean, typed API layer (`src/api/`) that organizes all HTTP
calls by resource, with no `any` for contract data. The existing seed-based screen is
preserved unchanged. Schema-driven rendering (column labels, field order) comes from
the `schema` object embedded in `GET /api/batches/{id}` — no hardcoded field names or
labels anywhere in the new screen.

## Technical Context

**Language/Version**: TypeScript 6.0 (strict; `noImplicitAny: true`).

**Primary Dependencies**: React 19, Vite 7, Tailwind CSS 3.4.

**Storage**: N/A — no browser storage for application state. Token and batch/occurrence
data are held in memory only.

**Testing**: Vitest + @testing-library/react (to be added in a follow-up task — not
yet in `package.json`). Principle V tests for `hasBlockingErrors` guard and schema-
driven label rendering are pending.

**Target Platform**: Modern browser SPA (Chrome/Edge/Firefox latest).

**Project Type**: Web application feature (SPA page).

**Performance Goals**: Batch list loads within 2 seconds on LAN. Occurrence detail
opens without full-page reload (drawer + async fetch).

**Constraints**: No `localStorage`/`sessionStorage` (per constitution). No `any` for
API contract types. Must not modify `CadastralMoviment.tsx`.

**Scale/Scope**: ≤ 200 occurrences per batch (API `pageSize=200` cap); single analyst
per session.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Schema-Driven Generic Rendering | No hardcoded field names/labels in components | **PASS** | Column `<th>` uses `label[key]` from `ApiBatchSchema.fields`; drawer fields ordered by `displayOrder` |
| II. Design System Fidelity | Tailwind constrained to documented tokens | **PASS** | Uses existing CSS utility classes (`tipo-inc`, `st-pend`, etc.); no ad-hoc colors or new class definitions |
| III. Single Canonical Surface | `displayLabel` from schema only; provenance on demand | **PASS** | Labels from `ApiBatchSchemaField.displayLabel`; provenance chip gated by `showOrig` toggle |
| IV. Component Isolation & Typed Contracts | No `any`; small typed components | **PASS** | All types in `src/api/types.ts` mirror the API contract; sub-components have explicit prop interfaces |
| V. Test Discipline | Schema-rendering + validation-state behavior covered | **PENDING** | Tests not yet written; `hasBlockingErrors` guard and label rendering tests are a required follow-up task |
| VI. Accessibility & UX | Triage-first; keyboard-navigable | **PASS** | Default view shows blocked/pending first; same keyboard pattern as original |
| VII. AI-Readiness | Affordances data-driven | **PASS** | Approve button disabled by `hasBlockingErrors`; state-driven footer in drawer |

**Post-design re-check**: PASS with one pending item (Principle V tests).

## Project Structure

### Documentation (this feature)

```text
specs/002-api-moviment-default/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── api-usage.md     # Phase 1 output — API call contracts
│   └── ui-contracts.md  # Phase 1 output — component prop interfaces
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── types.ts          # All API response types (CONTRACT VERSION: 1.0)
│   ├── client.ts         # In-memory token store + typed fetch wrapper
│   ├── auth.ts           # POST /token (OAuth2 client_credentials)
│   ├── batches.ts        # GET /api/batches, detail, summary, export, dispatch
│   ├── occurrences.ts    # GET detail, PATCH field, approve, reject, disable
│   ├── schemas.ts        # GET /api/schemas/{operationTypeKey}
│   ├── triage.ts         # GET /api/triage
│   └── index.ts          # Barrel re-export
└── pages/
    └── moviment/
        ├── CadastralMoviment.tsx      # Existing (unchanged)
        └── CadastralMovimentDefaut.tsx  # New screen (this feature)

tests/
└── (to be created — Principle V follow-up)
    ├── CadastralMovimentDefaut.test.tsx  # schema-driven label rendering
    └── helpers.test.ts                   # hasBlockingErrors, getField
```

**Structure Decision**: Single SPA project. New `src/api/` layer is cleanly separated
from `src/data/` (seed data for the old screen). No shared mutable state between the
two screens.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No principle violations. Principle V (tests) is pending, not violated — tests are a
follow-up task tracked explicitly, not a design exception.
