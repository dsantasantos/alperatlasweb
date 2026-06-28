---
description: "Task list for CadastralMovimentDefaut — API-Connected Screen (v2 — dynamic schema)"
---

# Tasks: CadastralMovimentDefaut — API-Connected Screen

**Input**: Design documents from `specs/002-api-moviment-default/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅

**Status note**: The API layer and initial screen were built in a prior iteration. This
task list reflects the v2 update: schema now comes from `GET /api/schemas/cadastral-movement`
(not the batch detail), columns are fully dynamic with fixed "Conferência" and "Status"
last, and edit form inputs are type-driven by `dataType`. Tasks already completed and
still valid are marked `[x]`. Tasks that need updating or are new are marked `[ ]`.

**Tests**: Required by constitution Principle V for schema-driven rendering and
validation-state behavior. Included in US1 and US2 phases.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test tooling and `src/api/` directory — all previously completed.

- [x] T001 Create `src/api/` directory
- [x] T002 [P] Install Vitest + @testing-library/react in `package.json`
- [x] T003 [P] Configure Vitest in `vite.config.js` (`test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'], globals: true }`)
- [x] T004 [P] Create `tests/setup.ts` with `import '@testing-library/jest-dom'`
- [x] T005 [P] Add `"test": "vitest"` and `"coverage": "vitest run --coverage"` to `package.json` scripts
- [x] T006 [P] Create `tests/components/` and `tests/api/` directories

---

## Phase 2: Foundational (API Layer — v2 Updates)

**Purpose**: Typed API layer shared by all user story phases. Some files need v2 updates
to reflect the new schema source and type changes.

**⚠️ CRITICAL**: Updated types and schema module must be complete before any story work.

- [x] T007 Update `src/api/types.ts` for v2 contract:
  - Rename `ApiBatchSchemaField` → `ApiSchemaField`; rename `typeHint` → `dataType`
  - Remove or deprecate `ApiBatchSchema` (schema no longer embedded in batch detail)
  - Update `ApiBatchDetail` to remove the `schema` property (no longer used for rendering)
  - Ensure `ApiSchema` (top-level response) type is present: `{ operationTypeKey, displayName, validationRuleKeys, fields: ApiSchemaField[] }`
  - All other types (`ApiOccurrenceListItem`, `ApiOccurrenceDetail`, etc.) remain unchanged
- [x] T008 Implement in-memory token store + typed fetch wrapper in `src/api/client.ts`
- [x] T009 [P] Implement `loginWithCredentials` in `src/api/auth.ts`
- [x] T010 [P] Update `src/api/batches.ts`:
  - Remove `schema` field from `ApiBatchDetail` return type (matches T007 update)
  - All other batch functions (`list`, `summary`, `export`) remain unchanged
- [x] T011 [P] Implement `occurrencesApi` (detail, editField, approve, reject, disable) in `src/api/occurrences.ts`
- [x] T012 [P] Update `src/api/schemas.ts`:
  - `schemasApi.get(operationTypeKey)` return type must be `ApiSchema` (not `ApiSchemaFull`)
  - Confirm the URL used is `GET /api/schemas/{operationTypeKey}` (path param, not query param)
- [x] T013 [P] Implement `triageApi.list` in `src/api/triage.ts`
- [x] T014 Barrel re-export in `src/api/index.ts`
- [x] T015 Validate TypeScript: run `npx tsc --noEmit` — fix any type errors in `src/api/` after T007/T010/T012

**Checkpoint**: API layer compiles clean with v2 types; `ApiSchemaField` with `dataType`
is the single schema type used across the codebase.

---

## Phase 3: User Story 1 — Batch Rail + Dynamic Occurrence Table (Priority: P1) 🎯 MVP

**Goal**: Analyst opens the screen; schema is fetched from the dedicated endpoint on
mount and cached; batch rail populates; occurrence table shows dynamic columns (from
schema, in `displayOrder`) with "Conferência" and "Status" pinned as the last two columns.

**Independent Test**: Navigate to screen → `GET /api/schemas/cadastral-movement` fires
once → batch list loads → select a different batch → schema NOT re-fetched → table
columns match `displayLabel` from schema → "Conferência" and "Status" are last two columns.

### Tests for User Story 1 (Principle V — Required) ⚠️

> **Confirm tests fail before verifying against implementation.**

- [x] T016 [P] [US1] Update test: `makeLabel()` builds correct `Record<string,string>`
  from `ApiSchemaField[]` (was `ApiBatchSchemaField[]`) in `tests/api/helpers.test.ts`
- [x] T017 [P] [US1] Update test: `<Row>` renders field values in schema `displayOrder`
  from `ApiSchemaField[]` (not hardcoded strings) in `tests/components/Row.test.tsx`
- [x] T018 [P] [US1] Update test: table `<th>` content matches `displayLabel` from
  `ApiSchemaField[]` (not from batch detail schema) in `tests/components/CadastralMovimentDefaut.test.tsx`
- [x] T018a [P] [US1] New test: "Conferência" and "Status" `<th>` elements always present
  and always appear as the last two columns, regardless of schema content, in
  `tests/components/CadastralMovimentDefaut.test.tsx`

### Implementation for User Story 1

- [x] T019 [US1] Update `CadastralMovimentDefaut.tsx` — v2 schema fetch strategy:
  - On mount: call `schemasApi.get('cadastral-movement')` and store result in component
    state (`const [schema, setSchema] = useState<ApiSchemaField[]>([])`)
  - Parallelise schema fetch and batch list fetch (both fire on mount)
  - Remove any reference to `batchDetail.schema` for column/label derivation
  - Table columns: map `schema` (sorted by `displayOrder`) → dynamic `<th>` elements,
    then append fixed "Conferência" `<th>` and "Status" `<th>` as last two
  - Add schema-error state: if `schemasApi.get` fails, show error banner and skip table render
  - On batch selection: do NOT re-fetch schema (use cached state value)
- [x] T020 [US1] Register screen in `src/components/layout/AppShell.tsx` (already wired)
- [x] T021 [US1] Validate TypeScript: run `npx tsc --noEmit` — fix type errors in screen
  after v2 changes (especially `ApiSchemaField[]` vs old `ApiBatchSchemaField[]`)

**Checkpoint**: Schema fetched once on mount, cached, never re-fetched on batch change.
Table shows dynamic columns first, then "Conferência" and "Status" last.

---

## Phase 4: User Story 2 — Dynamic Edit Drawer + Field Edit (Priority: P2)

**Goal**: Analyst opens the drawer; all form fields are dynamically rendered from the
cached schema (`ApiSchemaField[]`), in `displayOrder`, with correct input types
(`resolveInputType(field.dataType)`). All fields are editable. Edit saves via PATCH and
updates validations in the drawer without a full reload.

**Independent Test**: Click a row → drawer opens → form fields match schema field list
in `displayOrder` → date fields show date picker → text fields show text input → edit
a field → PATCH fires → validations update without page reload.

### Tests for User Story 2 (Principle V — Required) ⚠️

- [x] T022 [P] [US2] Test: blocking error disables Approve button in `tests/components/Drawer.test.tsx`
- [x] T023 [P] [US2] Test: `<ValidationGroup>` renders "Sem apontamentos" when `items` is empty in `tests/components/ValidationGroup.test.tsx`
- [x] T024 [P] [US2] Update test: field labels use `displayLabel` from `ApiSchemaField[]`
  prop (not `ApiBatchSchemaField[]`) in `tests/components/Drawer.test.tsx`
- [x] T025 [P] [US2] Test: `mapSev('Error')` returns `'erro'`, `mapSev('Warning')` returns `'aviso'` in `tests/api/helpers.test.ts`
- [x] T025a [P] [US2] New test: `resolveInputType('date')` returns `'date'`,
  `resolveInputType('datetime')` returns `'datetime-local'`, `resolveInputType('text')`
  and `resolveInputType('cpf')` return `'text'` in `tests/api/helpers.test.ts`
- [x] T025b [P] [US2] New test: `<Drawer>` renders `<input type="date">` for a schema
  field with `dataType: 'date'` and `<input type="text">` for all other dataTypes in
  `tests/components/Drawer.test.tsx`

### Implementation for User Story 2

- [x] T026 [US2] Update `Drawer` component in `src/pages/moviment/CadastralMovimentDefaut.tsx`:
  - Change `schema` prop type from `ApiBatchSchemaField[]` to `ApiSchemaField[]`
  - Add `resolveInputType(dataType: string): 'text' | 'date' | 'datetime-local'` helper
    (`'date'` → `'date'`, `'datetime'` → `'datetime-local'`, any other → `'text'`)
  - Render edit inputs using `<input type={resolveInputType(field.dataType)} ...>`
  - All schema-driven fields render as editable inputs (no read-only logic)
  - Field order uses `displayOrder` from `ApiSchemaField[]` (unchanged from v1)
- [x] T027 [US2] Implement `ValidationGroup` for Capture and Movement dimensions in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T028 [US2] Implement `handleOccurrenceUpdate` to reflect PATCH response in table inline in `src/pages/moviment/CadastralMovimentDefaut.tsx`

**Checkpoint**: Drawer form is fully dynamic from cached schema; date fields show date
pickers; PATCH round-trips update the drawer without reload.

---

## Phase 5: User Story 3 — Approve, Reject, Disable (Priority: P2)

**Goal**: Analyst approves (single or bulk), rejects with a required reason, or disables
occurrences. Status updates reflect in the table without a full reload.

**Independent Test**: Single-approve a non-blocked occurrence → row status updates to
"Aprovado" from API response.

### Tests for User Story 3

- [ ] T029 [P] [US3] Approve button disabled when `hasBlockingErrors === true` — covered by T022; no duplicate test needed
- [x] T030 [P] [US3] Test: `<RejectModal>` confirm button disabled when `reason` is empty in `tests/components/RejectModal.test.tsx`

### Implementation for User Story 3

- [x] T031 [US3] Implement single approve/reject/disable in `Drawer` in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T032 [US3] Implement bulk approve/reject with batchbar in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T033 [US3] Implement `RejectModal` and `BulkRejectModal` in `src/pages/moviment/CadastralMovimentDefaut.tsx`

**Checkpoint**: All three decision affordances work; status updates in table reflect API responses.

---

## Phase 6: User Story 4 — Export XLSX (Priority: P3)

**Goal**: Analyst clicks "Exportar XLSX" and the browser downloads the XLSX file from
`GET /api/batches/{id}/export`. If no approved occurrences, shows a warning.

**Independent Test**: With at least one approved occurrence → click Export → XLSX file
downloads with the correct filename.

### Implementation for User Story 4

- [x] T034 [US4] Implement `doExport()` — calls `batchesApi.export(batchId)`, creates object URL, triggers `<a download>` in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T035 [US4] Handle 422 (no approved occurrences) and other API errors with `flash('warn', ...)` in `doExport()`

**Checkpoint**: Export downloads XLSX; 422 shows a user-friendly warning.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Auth integration, design tokens, lint, and final smoke-check.

- [ ] T036 [P] Wire real auth token: call `loginWithCredentials(clientId, secret)` from `src/api/auth.ts` in `src/pages/Login.tsx`, then `setAuthToken(token)` before routing to the new screen
- [x] T037 [P] Align design token hex values in `tailwind.config.js` and `src/styles/app.css` to constitution values (`--green: #06805B`, `--navy: #143D6B`, `--teal: #2C7A93`)
- [x] T038 [P] Run full TypeScript build `npx tsc --noEmit` across all new and updated files — resolve any remaining type errors from v2 changes
- [x] T039 [P] Run `npm run lint` — fix any ESLint violations (especially `@typescript-eslint/no-explicit-any`)
- [ ] T040 Run smoke-check from `quickstart.md` — verify all 13 steps pass against a running API instance (step count updated from 8 to 13 to cover schema caching, fixed columns, and date picker validation)
- [x] T041 Add `VITE_API_BASE_URL` to `.env.example` or comment in `quickstart.md` about required env vars

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Complete — no dependencies
- **Foundational (Phase 2)**: T007 must complete first (type changes cascade to T010, T012, T015)
- **US1 (Phase 3)**: Depends on Phase 2 complete — T019 depends on T007+T012
- **US2 (Phase 4)**: Depends on Phase 2 complete — T026 depends on T007
- **US3 (Phase 5)**: Depends on Phase 2 — independent of US1/US2 implementation
- **US4 (Phase 6)**: Depends on Phase 2 — independent
- **Polish (Phase N)**: Depends on all stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on T007, T012 ✅
- **US2 (P2)**: Depends on T007 ✅
- **US3 (P2)**: No new dependencies — existing implementation unchanged ✅
- **US4 (P3)**: No new dependencies — existing implementation unchanged ✅

### Within Each User Story

- T007 (types) must be done before T010, T012, T015, T019, T026
- Tests (T016–T018a, T024–T025b) should fail against the old implementation; pass after updates
- TypeScript validation (T015, T021, T038) must pass before each story is considered done

### Parallel Opportunities

- T008, T009, T011, T013 (foundational, no v2 changes) can run in parallel with T007
- T010, T012 can run in parallel once T007 is done
- T016, T017, T018, T018a (US1 tests) can all run in parallel
- T022, T023, T024, T025, T025a, T025b (US2 tests) can all run in parallel
- T036, T037, T038, T039 (Polish) can all run in parallel

---

## Parallel Example: Phase 2 v2 Updates

```bash
# Run in parallel after T007 completes:
Task T010: Update src/api/batches.ts (remove schema from ApiBatchDetail)
Task T012: Update src/api/schemas.ts (ApiSchema return type, path param URL)

# Then T015 once T010 and T012 are done:
Task T015: npx tsc --noEmit across src/api/
```

## Parallel Example: User Story 1 Tests

```bash
# All US1 tests can run in parallel:
Task T016: makeLabel() test with ApiSchemaField[] in tests/api/helpers.test.ts
Task T017: Row schema rendering test in tests/components/Row.test.tsx
Task T018: Table th label test in tests/components/CadastralMovimentDefaut.test.tsx
Task T018a: Fixed column presence test in tests/components/CadastralMovimentDefaut.test.tsx
```

---

## Implementation Strategy

### MVP Scope (US1 v2 Update — Minimum Viable Change)

1. T007 — Update `types.ts` (type rename + dataType)
2. T012 — Update `schemas.ts` (return type + URL)
3. T015 — TypeScript validation for API layer
4. T019 — Update screen (schema fetch on mount, column layout)
5. T021 — TypeScript validation for screen
6. **STOP and VALIDATE**: Open screen → confirm schema fires once on mount → confirm
   columns match schema → confirm "Conferência" and "Status" are last two

### Full v2 Incremental Delivery

1. Phase 2 updates (T007 → T010/T012 → T015) → Foundation v2 ready
2. US1 update (T016–T018a tests → T019 screen → T021 TS) → Demo dynamic columns
3. US2 update (T024–T025b tests → T026 drawer) → Demo date pickers + dynamic form
4. US3/US4 already complete — no changes needed
5. Polish (T036 auth → T038 TS → T039 lint → T040 smoke-check)

---

## Notes

- `[x]` tasks were completed in the prior iteration and remain valid for v2
- `[ ]` tasks are either new or require updating for the schema endpoint change
- `[P]` tasks = different files or independent tests, no blocking dependencies
- `[Story]` label maps each task to its user story for traceability
- The key v2 invariant: **schema is fetched from `GET /api/schemas/cadastral-movement`
  exactly once per screen mount; never from batch detail; never re-fetched on batch selection**
- Commit after each task or logical group
- Principle V tests (T016–T018a, T024–T025b) cover the two main schema-driven behaviors:
  dynamic column/field labels and correct input type rendering
