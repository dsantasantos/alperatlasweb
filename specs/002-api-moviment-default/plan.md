# Implementation Plan: CadastralMovimentDefaut — API-Connected Screen

**Branch**: `002-api-moviment-default` | **Date**: 2026-06-27 | **Last Updated**: 2026-06-28
**Spec**: `specs/002-api-moviment-default/spec.md`

**Input**: Feature specification from `/specs/002-api-moviment-default/spec.md`

## Summary

Create `CadastralMovimentDefaut.tsx` in `src/pages/moviment/` — a screen fed entirely
by real backend API endpoints with fully dynamic table columns and edit form fields.
On mount the screen fetches `GET /api/schemas/cadastral-movement` once and caches the
schema in component state; this schema drives every column header and every form field
label, order, and input type for the session lifetime. The fixed `movementType` column
is always first; the fixed "Conferência" and "Status" columns are always last.

Four enhancements (2026-06-28): (1) `movementType` (New/Edit/Remove) is the first
table column, sourced from the occurrence list. (2) A collapsible batch audit diary
panel at the top of the screen consumes `GET /api/batches/{id}/audit`. (3) The
occurrence detail drawer includes a notes section below the form fields (separated by
a divider) that renders embedded notes from `ApiOccurrenceDetail.notes` and accepts
new notes via `POST /api/occurrences/{id}/notes`. (4) Batch approve, reject (with
reason), and disable are available via table checkboxes, including a select-all header
checkbox; the API is the authority on validity for batch approve.

A clean typed API layer (`src/api/`) organises all HTTP calls by resource with no
`any` for contract data. The existing seed-based `CadastralMoviment.tsx` is preserved
unchanged.

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
| I. Schema-Driven Generic Rendering | No hardcoded field names/labels in components | **PASS** | Column `<th>` uses `displayLabel` from `ApiSchemaField`; drawer fields ordered by `displayOrder`; input type from `resolveInputType(field.dataType)`; fixed columns (`movementType`, "Conferência", "Status") are UI structural elements, not data field labels |
| II. Design System Fidelity | Tailwind constrained to documented tokens | **PASS** | Uses existing CSS utility classes (`tipo-inc`, `st-pend`, etc.); `AuditDiaryPanel` and `NotesSection` must follow the same token conventions — no ad-hoc colors |
| III. Single Canonical Surface | `displayLabel` from schema only; provenance on demand | **PASS** | Labels from `ApiSchemaField.displayLabel`; `movementType` values ("New"/"Edit"/"Remove") are API-sourced, not hardcoded strings |
| IV. Component Isolation & Typed Contracts | No `any`; small typed components | **PASS** | `ApiBatchAuditEntry`, `ApiOccurrenceNote` added to `types.ts`; `AuditDiaryPanel` and `NotesSection` have explicit typed prop interfaces; batch endpoint payloads typed |
| V. Test Discipline | Schema-rendering + validation-state behavior covered | **PENDING** | Tests not yet written; required: `hasBlockingErrors` guard, schema-driven label rendering, fixed column presence (incl. `movementType`), `resolveInputType`, `makeLabel`, select-all header state, batch action dispatch |
| VI. Accessibility & UX | Triage-first; keyboard-navigable | **PASS** | Diary panel is collapsible (reduces cognitive load); batch action bar visible only when rows selected; select-all checkbox has proper indeterminate state |
| VII. AI-Readiness | Affordances data-driven | **PASS** | Batch approve sends all IDs; API is validity authority — decision signals (blocking errors) already present in data, ready for AI pre-decision layering |

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
│   ├── types.ts          # All API response types (CONTRACT VERSION: 3.0)
│   │                     # Additions: ApiBatchAuditEntry, ApiOccurrenceNote,
│   │                     # movementType on ApiOccurrenceListItem,
│   │                     # notes[] on ApiOccurrenceDetail
│   ├── client.ts         # In-memory token store + typed fetch wrapper
│   ├── auth.ts           # POST /token (OAuth2 client_credentials)
│   ├── batches.ts        # GET /api/batches, detail, summary, export, audit
│   ├── occurrences.ts    # GET detail, PATCH field, approve, reject, disable,
│   │                     # POST notes, batch/approve, batch/reject, batch/disable
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

1. Fixed `movementType` column (first) — displays "New", "Edit", or "Remove"
2. Dynamic columns from `ApiSchema.fields`, sorted ascending by `displayOrder`
3. Fixed "Conferência" column (penultimate)
4. Fixed "Status" column (last)

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

Schema fetch and batch list fetch are parallelised. Occurrence list, summary bar,
and audit diary fetch wait for the selected batch id from the batch list response.

### D7 — Batch audit diary panel

The diary panel at the top of the screen is collapsible (expanded by default). It
fetches `GET /api/batches/{id}/audit` on each batch selection change. Collapsed/
expanded UI state lives in component state — not persisted across sessions. An error
in the diary fetch renders an error state in the panel only; the rest of the screen
continues to function.

### D8 — Notes section in the drawer

The "Histórico · auditoria e diário" section is placed below the schema-driven form
fields, separated by a visible divider. Notes (`id`, `text`, `authorId`, `createdAt`)
are embedded in `ApiOccurrenceDetail.notes` — no separate listing call. After a
successful `POST /api/occurrences/{id}/notes`, the drawer re-fetches the full
occurrence detail to refresh the notes list. Empty note submission is blocked
client-side.

### D9 — Batch operations: API as validity authority

The UI sends all selected `occurrenceIds` to the batch endpoints without pre-filtering
for blocking errors. The API determines which IDs succeed. On a partial-failure
response the UI updates successfully processed rows and surfaces a summary toast
("N aprovados, M falharam"). The select-all header checkbox supports three states:
unchecked (none selected), indeterminate (some selected), checked (all selected).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No principle violations. Principle V (tests) is pending, not violated — tests are a
follow-up task tracked explicitly, not a design exception.
