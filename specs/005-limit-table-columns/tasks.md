# Tasks: Limit Moviment Default Table Columns

**Input**: Design documents from `specs/005-limit-table-columns/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-contracts.md ✅

**Tests**: Included — required by Constitution Principle V (schema-driven rendering behavior must be covered).

**Organization**: Tasks are grouped by user story. This is a single-file change in `src/pages/moviment/CadastralMovimentDefaut.tsx`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new infrastructure needed — project is already set up with Vitest + React Testing Library.

*Phase 1 complete — no tasks required.*

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Introduce the `TABLE_COLUMN_LIMIT` constant and `tableSchema` derived value that all three user stories depend on.

**⚠️ CRITICAL**: All user story tasks below depend on this phase being complete first.

- [x] T001 Add `const TABLE_COLUMN_LIMIT = 5` constant and derive `const tableSchema = orderedSchema.slice(0, TABLE_COLUMN_LIMIT)` immediately after line 791 in `src/pages/moviment/CadastralMovimentDefaut.tsx`

**Checkpoint**: `tableSchema` is available in scope — user story implementation can now proceed.

---

## Phase 3: User Story 1 — Table Shows at Most 5 Dynamic Columns (Priority: P1) 🎯 MVP

**Goal**: Replace all uses of `orderedSchema` in the table rendering with `tableSchema` so the table shows at most 5 dynamic columns, with "Tipo" first and "Conferência / Status" last.

**Independent Test**: Run the app, open the Moviment Default cockpit — count the column headers between "Tipo" and "Conferência". Must be ≤ 5. Schemas with ≤ 5 fields show all fields unchanged.

### Implementation for User Story 1

- [x] T002 [US1] Replace `orderedSchema.length > 0` with `tableSchema.length > 0` and replace both `orderedSchema.map(() => 'minmax(100px,1fr)')` with `tableSchema.map(...)` in the `gridCols` computation around line 794 in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T003 [US1] Replace `orderedSchema.map(sf => <th key={sf.key}>{sf.displayLabel}</th>)` with `tableSchema.map(...)` in the `<thead>` block around line 904 in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T004 [US1] Replace `schema={schema}` with `schema={tableSchema}` on the `<Row>` component inside `<tbody>` around line 921 in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T005 [US1] Replace `colSpan={orderedSchema.length + 4}` with `colSpan={tableSchema.length + 4}` on the empty-state `<td>` around line 930 in `src/pages/moviment/CadastralMovimentDefaut.tsx`

### Tests for User Story 1

- [x] T006 [P] [US1] Add test to `tests/components/Row.test.tsx`: given a schema with 8 fields, render `Row` and assert exactly 5 dynamic `<td>` cells appear (excluding checkbox and chevron cells)
- [x] T007 [P] [US1] Add test to `tests/components/Row.test.tsx`: given a schema with 3 fields, render `Row` and assert exactly 3 dynamic `<td>` cells appear
- [x] T008 [P] [US1] Add test to `tests/components/Row.test.tsx`: given a schema with 0 fields, render `Row` and assert 0 dynamic `<td>` cells appear

**Checkpoint**: Table column count is capped at 5 dynamic columns. Stories with ≤ 5 schema fields are visually unchanged.

---

## Phase 4: User Story 2 — Hidden Fields Accessible via Detail Modal (Priority: P2)

**Goal**: Confirm the Drawer (detail modal) continues to receive the full uncapped `schema` and renders all fields, including those beyond the table column cap.

**Independent Test**: With a schema that has 8+ fields, open any row's modal — verify all 8+ fields appear in the modal's "Campos canônicos" section.

### Implementation for User Story 2

- [x] T009 [US2] Verify that the `<Drawer>` invocation (around line 969 in `src/pages/moviment/CadastralMovimentDefaut.tsx`) still passes `schema={schema}` (the full uncapped array, not `tableSchema`). If the prop was accidentally changed during Phase 3, revert it to `schema={schema}`.

### Tests for User Story 2

- [x] T010 [P] [US2] Add test to `tests/components/Drawer.test.tsx`: given a schema with 8 fields, render `Drawer` and assert all 8 field labels appear in the output (no cap applied)

**Checkpoint**: Modal shows 100% of schema fields. Opening a row with a capped table still shows all data in the modal.

---

## Phase 5: User Story 3 — Column Order Preserved (Priority: P3)

**Goal**: The 5 visible dynamic columns in the table are the first 5 by ascending `displayOrder` — not arbitrary. This is inherently satisfied by `tableSchema = orderedSchema.slice(0, 5)` where `orderedSchema` is sorted by `displayOrder`.

**Independent Test**: With a schema where fields have display orders 1–8, verify the 5 visible column headers match the 5 fields with the lowest display order values.

### Implementation for User Story 3

*No code changes required beyond Phase 2 (T001).* The ordering guarantee comes from `orderedSchema` already being sorted by `displayOrder` before slicing. Confirm no reordering occurs between T001 and the table header rendering (T003).

### Tests for User Story 3

- [x] T011 [P] [US3] Add test to `tests/components/Row.test.tsx`: given a schema with 8 fields where `displayOrder` values are 1–8, render `Row` with `schema.slice(0, 5)` (simulating `tableSchema`) and assert the 5 rendered cells correspond to display orders 1–5, not 4–8 or random

**Checkpoint**: All 3 user stories are complete and independently verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T012 [P] Run `npm run build` in the project root and confirm zero TypeScript errors
- [x] T013 [P] Run `npm test` in the project root and confirm all tests pass (new + existing)
- [x] T014 Run the app (`npm run dev`) and manually verify the Moviment Default table per `specs/005-limit-table-columns/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Depends on T001 (tableSchema must exist)
- **US2 (Phase 4)**: Depends on T001; can run in parallel with Phase 3
- **US3 (Phase 5)**: No implementation work; test can run in parallel with Phase 3/4
- **Polish (Phase 6)**: Depends on all implementation tasks being complete

### User Story Dependencies

- **US1**: Depends on T001 only
- **US2**: Depends on T001 only; independent of US1 implementation
- **US3**: No implementation dependency; test runs independently

### Within Each Phase

- T002, T003, T004, T005 are all edits to the same file — run sequentially to avoid conflicts
- T006, T007, T008 are all edits to the same test file — run sequentially
- T009 is a verification step — confirm before running T010
- T011 can be written at any point after T001 is complete

---

## Parallel Opportunities

### After T001 is complete

```
# Implementation tasks (same file — sequential)
T002 → T003 → T004 → T005

# Test tasks for US1 (same file — sequential within, but can start in parallel with implementation)
T006 → T007 → T008

# US2 verification + test (parallel with US1 test tasks)
T009 → T010

# US3 test (parallel with all above)
T011
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: T001 (add `TABLE_COLUMN_LIMIT` + `tableSchema`)
2. Complete Phase 3: T002 → T003 → T004 → T005 (wire `tableSchema` into table)
3. **STOP and VALIDATE**: Run the app, count table columns — must be ≤ 5
4. Add Phase 3 tests: T006 → T007 → T008

### Incremental Delivery

1. Phase 2 → Phase 3 (US1: capped table) → validate visually
2. Phase 4 (US2: modal unaffected) → validate in browser
3. Phase 5 (US3: ordering test) → `npm test` passes
4. Phase 6 (polish: build + full test run)

### Single-Developer Strategy

All tasks are in the same repository. Recommended order:

```
T001 → T002 → T003 → T004 → T005 → T009 → T006 → T007 → T008 → T010 → T011 → T012 → T013 → T014
```

---

## Notes

- All implementation tasks edit a single file: `src/pages/moviment/CadastralMovimentDefaut.tsx`
- All test tasks edit existing test files in `tests/components/`
- No new files, no API changes, no data model changes
- `orderedSchema` is still computed (needed for Drawer ordering) — only its use in table rendering changes
- `tableSchema` is a constant ceiling: schemas with ≤ 5 fields render exactly as before
