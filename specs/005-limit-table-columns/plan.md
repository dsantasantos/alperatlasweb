# Implementation Plan: Limit Moviment Default Table Columns

**Branch**: `005-limit-table-columns` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-limit-table-columns/spec.md`

## Summary

Cap the Cadastral Moviment Default table to show at most 5 dynamic schema columns (first 5 by display order) between the fixed "Tipo" and "Conferência / Status" columns. Fields beyond the cap remain fully visible in the row detail modal. The entire change is a single-file edit in `CadastralMovimentDefaut.tsx` — derive `tableSchema = orderedSchema.slice(0, 5)` and use it for table rendering while keeping the full `schema` for the Drawer.

## Technical Context

**Language/Version**: TypeScript (React 18, Vite)

**Primary Dependencies**: React, Tailwind CSS (existing project stack)

**Storage**: N/A — no persistence change

**Testing**: Vitest + React Testing Library (existing test setup)

**Target Platform**: Web browser (same as existing app)

**Project Type**: Single-page web application (frontend only)

**Performance Goals**: No new async operations; change is a pure derived-array slice — negligible cost.

**Constraints**: Must not break existing grid layout for schemas with ≤ 5 fields (ceiling, not fixed count).

**Scale/Scope**: Single file, ~6 line-level changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Schema-Driven Generic Rendering | ✅ Pass | `tableSchema` is still derived from the schema's `displayOrder`; no field names hardcoded. |
| II. Design System Fidelity | ✅ Pass | No visual tokens, colors, or spacing changes. Grid layout formula preserved. |
| III. Single Canonical Surface | ✅ Pass | Column labels still come from `sf.displayLabel`; no source-specific labels introduced. |
| IV. Component Isolation & Typed Contracts | ✅ Pass | `Row` continues to receive typed `ApiSchemaField[]`; `Drawer` unchanged. |
| V. Test Discipline | ✅ Pass | New behavior (5-column cap) must be covered by a `Row` rendering test. |
| VI. Accessibility & UX | ✅ Pass | Fewer columns reduce cognitive load — consistent with Principle VI intent. |
| VII. AI-Readiness | ✅ Pass | No changes to decision affordances or confidence signals. |

**Post-Design Re-check**: All principles pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/005-limit-table-columns/
├── plan.md              # This file
├── research.md          # Phase 0 — change analysis
├── data-model.md        # Phase 1 — derived computed values
├── quickstart.md        # Phase 1 — dev setup
├── contracts/
│   └── ui-contracts.md  # Phase 1 — table and modal column contracts
└── tasks.md             # Phase 2 — /speckit-tasks output
```

### Source Code (affected files only)

```text
src/
└── pages/
    └── moviment/
        └── CadastralMovimentDefaut.tsx   ← only file changed
```

**Structure Decision**: Single-project frontend app. Only `CadastralMovimentDefaut.tsx` is modified; no new files added to `src/`.

## Implementation Steps

### Step 1 — Add constant and derive `tableSchema`

In `CadastralMovimentDefaut.tsx`, after line 791 (`const orderedSchema = ...`):

```typescript
const TABLE_COLUMN_LIMIT = 5;
const tableSchema = orderedSchema.slice(0, TABLE_COLUMN_LIMIT);
```

### Step 2 — Update `gridCols` to use `tableSchema`

Replace the `gridCols` computation (lines 794-796):

```typescript
// Before
const gridCols = orderedSchema.length > 0
  ? `... ${orderedSchema.map(() => 'minmax(100px,1fr)').join(' ')} ...`
  : '...';

// After
const gridCols = tableSchema.length > 0
  ? `... ${tableSchema.map(() => 'minmax(100px,1fr)').join(' ')} ...`
  : '...';
```

### Step 3 — Update table headers to use `tableSchema`

```tsx
// Before
{orderedSchema.map(sf => <th key={sf.key}>{sf.displayLabel}</th>)}

// After
{tableSchema.map(sf => <th key={sf.key}>{sf.displayLabel}</th>)}
```

### Step 4 — Pass `tableSchema` to `Row`

```tsx
// Before
<Row schema={schema} ... />

// After
<Row schema={tableSchema} ... />
```

### Step 5 — Fix empty-row `colSpan`

```tsx
// Before
<td colSpan={orderedSchema.length + 4} ...>

// After
<td colSpan={tableSchema.length + 4} ...>
```

### Step 6 — Verify `Drawer` still receives full `schema`

The `Drawer` invocation passes `schema={schema}` (full, uncapped). Confirm this is untouched after the edits above — no change needed.

## Test Coverage Required

Per Constitution Principle V, tests must assert the 5-column cap:

- Given `Row` receives a `schema` with 8 fields, render and assert exactly 5 dynamic `<td>` data cells.
- Given `Row` receives a `schema` with 3 fields, assert exactly 3 dynamic `<td>` data cells.
- Given `Row` receives a `schema` with 0 fields, assert 0 dynamic `<td>` data cells.
