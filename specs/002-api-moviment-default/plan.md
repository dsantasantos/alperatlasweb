# Implementation Plan: CadastralMovimentDefaut — API-Connected Screen

**Branch**: `002-api-moviment-default` | **Date**: 2026-06-27 | **Last Updated**: 2026-06-27
**Spec**: `specs/002-api-moviment-default/spec.md`

**Input**: Feature specification from `/specs/002-api-moviment-default/spec.md`

## Summary

Create `CadastralMovimentDefaut.tsx` in `src/pages/moviment/` — a screen fed entirely
by real backend API endpoints with fully dynamic table columns and edit form fields.
On mount the screen fetches `GET /api/schemas/cadastral-movement` once and caches the
schema in component state; this schema drives every column header and every form field
label, order, and input type for the session lifetime. The fixed "Conferência" and
"Status" columns are always rendered as the last two columns, independent of the schema.
Simultaneously, a clean typed API layer (`src/api/`) organises all HTTP calls by
resource with no `any` for contract data. The existing seed-based `CadastralMoviment.tsx`
is preserved unchanged.

## Technical Context

**Language/Version**: TypeScript 6.0 (strict; `noImplicitAny: true`).

**Primary Dependencies**: React 19, Vite 7, Tailwind CSS 3.4.

**Storage**: N/A — no browser storage for application state. Token and all data are
held in memory only; lost on page refresh (intentional).

**Testing**: Vitest + @testing-library/react (to be added in a follow-up task). Principle
V tests for `hasBlockingErrors` guard, schema-driven label rendering, fixed column
presence, `resolveInputType` mapping, and `makeLabel` helper are required follow-up tasks.

**Target Platform**: Modern browser SPA (Chrome/Edge/Firefox latest).

**Project Type**: Web application feature (SPA page).

**Performance Goals**: Schema fetch + batch list render within 2 seconds on LAN. Schema
fetch and batch list fetch can be parallelised on mount.

**Constraints**: No `localStorage`/`sessionStorage` (per constitution). No `any` for
API contract types. Must not modify `CadastralMoviment.tsx`.

**Scale/Scope**: ≤ 200 occurrences per batch (API `pageSize=200` cap); single analyst
per session.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Schema-Driven Generic Rendering | No hardcoded field names/labels in components | **PASS** | Column `<th>` uses `displayLabel` from `ApiSchemaField`; drawer fields ordered by `displayOrder`; input type from `resolveInputType(field.dataType)`; fixed columns ("Conferência", "Status") are UI structural elements, not data field labels |
| II. Design System Fidelity | Tailwind constrained to documented tokens | **PASS** | Uses existing CSS utility classes (`tipo-inc`, `st-pend`, etc.); no ad-hoc colors or new class definitions |
| III. Single Canonical Surface | `displayLabel` from schema only; provenance on demand | **PASS** | Labels from `ApiSchemaField.displayLabel` via dedicated `GET /api/schemas/cadastral-movement`; provenance chip gated by `showOrig` toggle |
| IV. Component Isolation & Typed Contracts | No `any`; small typed components | **PASS** | All types in `src/api/types.ts` mirror the API contract; `ApiSchemaField` replaces the old inline schema type; sub-components have explicit prop interfaces |
| V. Test Discipline | Schema-rendering + validation-state behavior covered | **PENDING** | Tests not yet written; required: `hasBlockingErrors` guard, schema-driven label rendering, fixed column presence, `resolveInputType`, `makeLabel` |
| VI. Accessibility & UX | Triage-first; keyboard-navigable | **PASS** | Default view shows blocked/pending first; same keyboard pattern as original |
| VII. AI-Readiness | Affordances data-driven | **PASS** | Approve button disabled by `hasBlockingErrors`; state-driven footer in drawer |

**Post-design re-check**: PASS with one pending item (Principle V tests — tracked as follow-up task, not a principle violation).

## Project Structure

### Documentation (this feature)

```text
specs/002-api-moviment-default/
├── plan.md              # This file
├── research.md          # Updated — schema source strategy revised
├── data-model.md        # Updated — ApiSchemaField promoted, dataType added
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── api-usage.md     # Updated — schema endpoint added, mount sequence documented
│   └── ui-contracts.md  # Updated — resolveInputType added, schema prop types updated
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── types.ts          # All API response types (CONTRACT VERSION: 2.0)
│   │                     # Key change: ApiSchemaField (from schemas endpoint) replaces
│   │                     # ApiBatchSchemaField; dataType replaces typeHint
│   ├── client.ts         # In-memory token store + typed fetch wrapper
│   ├── auth.ts           # POST /token (OAuth2 client_credentials)
│   ├── batches.ts        # GET /api/batches, detail, summary, export, dispatch
│   ├── occurrences.ts    # GET detail, PATCH field, approve, reject, disable
│   ├── schemas.ts        # GET /api/schemas/cadastral-movement (primary schema source)
│   └── index.ts          # Barrel re-export
└── pages/
    └── moviment/
        ├── CadastralMoviment.tsx      # Existing (unchanged)
        └── CadastralMovimentDefaut.tsx  # New screen (this feature)

tests/
└── (to be created — Principle V follow-up)
    ├── CadastralMovimentDefaut.test.tsx  # schema-driven label rendering, fixed columns
    ├── resolveInputType.test.ts          # dataType → input control mapping
    └── helpers.test.ts                   # hasBlockingErrors, getField, makeLabel
```

**Structure Decision**: Single SPA project. New `src/api/` layer is cleanly separated
from `src/data/` (seed data for the old screen). No shared mutable state between the
two screens.

## Key Design Decisions

### D1 — Schema source: dedicated endpoint, not batch detail

`GET /api/schemas/cadastral-movement` is the authoritative schema source. Any inline
schema in `GET /api/batches/{id}` is ignored for rendering. This separates schema
lifecycle from batch data lifecycle and avoids per-batch-selection schema re-fetching.

### D2 — Column layout

1. Dynamic columns from `ApiSchema.fields`, sorted ascending by `displayOrder`
2. Fixed "Conferência" column (penultimate)
3. Fixed "Status" column (last)

### D3 — Edit form input types

`resolveInputType(dataType: string)` maps `"date"` → `type="date"`,
`"datetime"` → `type="datetime-local"`, everything else → `type="text"`.

### D4 — All schema fields are editable

No read-only field concept. Every field in the schema renders as an editable input.
State transitions (approve/reject/disable) gate the entire occurrence, not individual
fields.

### D5 — Schema cached on mount

Schema fetched once, cached in component state. No re-fetch on batch selection.
Page reload recovers from mid-session schema changes.

### D6 — Mount sequence

Schema fetch and batch list fetch are parallelised. Occurrence list and summary bar
wait for the selected batch id from the batch list response.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No principle violations. Principle V (tests) is pending, not violated — tests are a
follow-up task tracked explicitly, not a design exception.
