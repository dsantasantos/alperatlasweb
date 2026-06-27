---
description: "Task list for CadastralMovimentDefaut — API-Connected Screen"
---

# Tasks: CadastralMovimentDefaut — API-Connected Screen

**Input**: Design documents from `specs/002-api-moviment-default/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅

**Note on implementation status**: The API layer (`src/api/`) and screen
(`CadastralMovimentDefaut.tsx`) were implemented during the `/speckit-specify` phase.
Tasks already completed are marked `[x]`. Remaining tasks (AppShell wiring, tests,
TypeScript validation, auth integration) are marked `[ ]`.

**Tests**: Explicitly required by constitution Principle V for schema-driven rendering
and validation-state behavior. Included in US1 and US2 phases.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install test tooling and create the `src/api/` directory.

- [x] T001 Create `src/api/` directory
- [x] T002 [P] Install Vitest + @testing-library/react in `package.json`
  (`npm install --save-dev vitest @testing-library/react @testing-library/user-event @vitest/coverage-v8 jsdom @testing-library/jest-dom`)
- [x] T003 [P] Configure Vitest in `vite.config.js` (add `test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'], globals: true }`)
- [x] T004 [P] Create `tests/setup.ts` with `import '@testing-library/jest-dom'`
- [x] T005 [P] Add `"test": "vitest"` and `"coverage": "vitest run --coverage"` to `package.json` scripts
- [x] T006 [P] Create `tests/components/` and `tests/api/` directories

---

## Phase 2: Foundational (API Layer — Blocking Prerequisites)

**Purpose**: Typed API layer shared by all user story phases.

**⚠️ CRITICAL**: All user story work depends on this layer being complete.

- [x] T007 Define all API contract types (no `any`) in `src/api/types.ts`
- [x] T008 Implement in-memory token store + typed fetch wrapper in `src/api/client.ts`
- [x] T009 [P] Implement `loginWithCredentials` in `src/api/auth.ts`
- [x] T010 [P] Implement `batchesApi` (list, detail, summary, export, dispatch) in `src/api/batches.ts`
- [x] T011 [P] Implement `occurrencesApi` (detail, editField, approve, reject, disable) in `src/api/occurrences.ts`
- [x] T012 [P] Implement `schemasApi.get` in `src/api/schemas.ts`
- [x] T013 [P] Implement `triageApi.list` in `src/api/triage.ts`
- [x] T014 Barrel re-export in `src/api/index.ts`
- [x] T015 Validate TypeScript: run `npx tsc --noEmit` — fix any type errors in `src/api/`

**Checkpoint**: API layer compiles clean and all contract types are in lockstep with
the backend — user story implementation can now begin.

---

## Phase 3: User Story 1 — Batch Rail + Occurrence Table (Priority: P1) 🎯 MVP

**Goal**: Analyst can open the screen, see batches from the API, select one, and
review the occurrence table with schema-derived column labels.

**Independent Test**: Navigate to the new screen → batch rail populates from API →
select a batch → table renders with `displayLabel` column headers from `schema.fields`.

### Tests for User Story 1 (Principle V — Required) ⚠️

> **Write tests FIRST, confirm they fail, then verify against implementation.**

- [x] T016 [P] [US1] Test: `makeLabel()` builds correct `Record<string,string>` from `ApiBatchSchemaField[]` in `tests/api/helpers.test.ts`
- [x] T017 [P] [US1] Test: `<Row>` renders field values from `ApiOccurrenceField[]` (not hardcoded strings) in `tests/components/Row.test.tsx`
- [x] T018 [P] [US1] Test: table `<th>` content matches `displayLabel` from schema (not hardcoded) in `tests/components/CadastralMovimentDefaut.test.tsx`

### Implementation for User Story 1

- [x] T019 [US1] Implement `CadastralMovimentDefaut.tsx` — batch list load on mount, occurrence table, triage filters in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T020 [US1] Register screen in `src/components/layout/AppShell.tsx`:
  - Add nav item `{ id: 'cadastral-moviment-default', label: 'Movimentação Cadastral (API)', icon: 'package' }` to the `Movimentação` nav group
  - Import `CadastralMovimentDefaut` and add `{activePage === 'cadastral-moviment-default' && <CadastralMovimentDefaut />}`
- [x] T021 [US1] Validate TypeScript: run `npx tsc --noEmit` — fix any type errors in the screen file

**Checkpoint**: US1 is fully functional and independently testable — batch list loads
from API, schema drives column headers, triage filters work.

---

## Phase 4: User Story 2 — Occurrence Detail Drawer + Field Edit (Priority: P2)

**Goal**: Analyst clicks a row, the drawer opens with schema-ordered fields and
provenance, edits a field, saves, and sees updated validations.

**Independent Test**: Click a row → drawer loads from `GET /api/occurrences/{id}` →
edit a field → save → drawer updates with recomputed validations.

### Tests for User Story 2 (Principle V — Required) ⚠️

- [x] T022 [P] [US2] Test: blocking error (`severity === 'Error'` + `dimension === 'Capture'`) disables Approve button in `tests/components/Drawer.test.tsx`
- [x] T023 [P] [US2] Test: `<ValidationGroup>` renders "Sem apontamentos" when `items` is empty in `tests/components/ValidationGroup.test.tsx`
- [x] T024 [P] [US2] Test: field labels use `displayLabel` from schema prop, not field key in `tests/components/Drawer.test.tsx`
- [x] T025 [P] [US2] Test: `mapSev('Error')` returns `'erro'`, `mapSev('Warning')` returns `'aviso'` in `tests/api/helpers.test.ts`

### Implementation for User Story 2

- [x] T026 [US2] Implement `Drawer` component with schema-driven field order, provenance toggle, and field edit in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T027 [US2] Implement `ValidationGroup` for Capture and Movement dimensions in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T028 [US2] Implement `handleOccurrenceUpdate` to reflect PATCH response in the table list inline in `src/pages/moviment/CadastralMovimentDefaut.tsx`

**Checkpoint**: US1 + US2 both work independently — drawer opens, field edits round-trip to API.

---

## Phase 5: User Story 3 — Approve, Reject, Disable (Priority: P2)

**Goal**: Analyst approves (single or bulk), rejects with a required reason, or
disables occurrences. Status updates reflect in the table without a full reload.

**Independent Test**: Single-approve a non-blocked occurrence → row status updates to
"Aprovado" from API response.

### Tests for User Story 3

- [ ] T029 [P] [US3] Test: Approve button is disabled when `hasBlockingErrors === true` (covered by T022 — no extra test needed)
- [x] T030 [P] [US3] Test: `<RejectModal>` confirm button is disabled when `reason` is empty in `tests/components/RejectModal.test.tsx`

### Implementation for User Story 3

- [x] T031 [US3] Implement single approve/reject/disable in `Drawer` (calls `occurrencesApi.approve/reject/disable`) in `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T032 [US3] Implement bulk approve (`bulkApprove`) and bulk reject (`bulkReject`) with batchbar in `src/pages/moviment/CadastralMovimentDefaut.tsx`
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

**Purpose**: Validation, auth integration, and design system alignment.

- [ ] T036 [P] Wire real auth token: call `loginWithCredentials(clientId, secret)` from `src/api/auth.ts` in `src/pages/Login.tsx` (or a new login form for the API flow), then `setAuthToken(token)` before routing to the new screen
- [x] T037 [P] Align design token hex values in `tailwind.config.js` and `src/styles/app.css` to constitution values (`--green: #06805B`, `--navy: #143D6B`, `--teal: #2C7A93`)
- [x] T038 [P] Run full TypeScript build `npx tsc --noEmit` across all new files — resolve any remaining type errors
- [x] T039 [P] Run `npm run lint` — fix any ESLint violations (especially `@typescript-eslint/no-explicit-any` rule)
- [ ] T040 Run smoke-check from `quickstart.md` — verify all 8 steps pass against a running API instance
- [x] T041 Add `VITE_API_BASE_URL` to `.env.example` (if it exists) or add a comment in `quickstart.md` about required env vars

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 only (already mostly complete)
- **US1 (Phase 3)**: Depends on Phase 2 — BLOCKS nothing (screen already exists)
- **US2 (Phase 4)**: Depends on Phase 2 — independent of US1 (same file, different components)
- **US3 (Phase 5)**: Depends on Phase 2 — independent of US1/US2
- **US4 (Phase 6)**: Depends on Phase 2 — independent
- **Polish (Phase N)**: Depends on all stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no deps on other stories ✅
- **US2 (P2)**: Can start after Foundational — no deps on US1 ✅
- **US3 (P2)**: Can start after Foundational — no deps on US1/US2 ✅
- **US4 (P3)**: Can start after Foundational — no deps on other stories ✅

### Within Each User Story

- Tests MUST be written and confirmed to fail before verifying against implementation
- AppShell wiring (T020) required before manual smoke-test of US1
- TypeScript validation (T015, T021) must pass before each story is considered done

### Parallel Opportunities

All Phase 1 setup tasks (T002–T006) can run in parallel.
All test tasks within a story (e.g., T016–T018) can run in parallel.
T036–T039 (Polish phase) can all run in parallel.

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all US1 tests in parallel:
Task: "makeLabel() test in tests/api/helpers.test.ts"          # T016
Task: "Row schema rendering test in tests/components/"          # T017
Task: "Table th label test in tests/components/"                # T018
```

---

## Implementation Strategy

### MVP Scope (US1 Only)

1. Complete Phase 1: Install Vitest (T002–T006)
2. Phase 2 already complete — API layer is done
3. Complete Phase 3: Write US1 tests (T016–T018) → wire AppShell (T020) → validate TS (T021)
4. **STOP and VALIDATE**: Open screen in browser, verify batch list loads, schema drives columns
5. Deploy/demo if ready

### Incremental Delivery

1. API layer done ✅ → Foundation ready
2. Add US1 (AppShell wiring + tests) → Test independently → Demo batch rail + table
3. Add US2 (drawer tests) → Test independently → Demo field editing
4. Add US3 (action tests) → Test independently → Demo approve/reject/disable
5. Add US4 (export) → Test independently → Demo XLSX download
6. Polish: auth integration + design token alignment + lint

---

## Notes

- `[x]` tasks were completed during the `/speckit-specify` implementation phase
- `[ ]` tasks represent remaining work — primarily test coverage, AppShell wiring, auth integration
- `[P]` tasks = different files or independent tests, no blocking dependencies
- `[Story]` label maps each task to the specific user story for traceability
- Commit after each task or logical group
- Principle V (test discipline) is the primary remaining gap — tests for T016–T018, T022–T025, T030 are required before marking US1/US2/US3 complete
