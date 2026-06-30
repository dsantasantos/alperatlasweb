# Tasks: XLSX Batch Upload

**Input**: Design documents from `specs/006-xlsx-batch-upload/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ui-contracts.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Confirm prerequisites before any code changes

- [x] T001 Verify icon name `"upload"` exists in `src/components/shared/Icons.tsx` (required for the "Importar planilha" button and modal title)

---

## Phase 2: Foundational (API Layer — Blocking Prerequisites)

**Purpose**: Extend the HTTP client and batch API to support `multipart/form-data` uploads. No user story can submit a form until this phase is complete.

**⚠️ CRITICAL**: US2 and US3 depend on this phase. US1 (modal display only) may proceed in parallel after T001.

- [x] T002 Add `requestForm<T>` internal async function to `src/api/client.ts` — mirrors `requestBlob` pattern, sends `fetch` POST with `authHeaders()` only (no `Content-Type`), handles 401 / non-2xx / 204 exactly like `request<T>`
- [x] T003 Add `postForm: <T>(path: string, form: FormData) => requestForm<T>('POST', path, form)` to the `httpClient` export object in `src/api/client.ts` (depends on T002)
- [x] T004 [P] Add `uploadXlsx` method to `batchesApi` in `src/api/batches.ts` — builds `FormData` with keys `file`, `OperationTypeKey`, `MovementType`, `SourceType`, `SourceId`, `SourceChannel` and calls `httpClient.postForm<void>('/api/batches/xlsx', fd)` (depends on T003; different file — can run in parallel with US1 tasks T005–T009)

**Checkpoint**: API layer ready — form submission and US1 modal work can now proceed

---

## Phase 3: User Story 1 — Abrir Modal de Upload de Lote (Priority: P1) 🎯 MVP

**Goal**: The "Importar planilha" button appears in the correct position on the action bar and opens the upload modal with all 6 required fields visible.

**Independent Test**: Navigate to `CadastralMovimentDefault`, select any batch, confirm the button appears between "Diário do lote" and "Exportar XLSX". Click it — modal opens showing: Arquivo XLSX, Tipo de operação, Tipo de movimentação, Tipo de fonte, ID da fonte, Canal da fonte. Click "Cancelar" — modal closes. No API call needed.

### Implementation for User Story 1

- [x] T005 [P] [US1] Extend `type ModalKind` in `src/pages/moviment/CadastralMovimentDefaut.tsx` from `'bulk-reject' | 'diary' | null` to `'bulk-reject' | 'diary' | 'xlsx-upload' | null` (line ~537)
- [x] T006 [US1] Add `XlsxUploadModalProps` interface and `XlsxUploadModal` component skeleton in `src/pages/moviment/CadastralMovimentDefaut.tsx` — after `BulkRejectModal` block (~line 506); component renders `<Modal title="Importar planilha" icon="upload" onClose={onClose}>` with 6 labeled fields (file input + 5 text inputs), `{formError && <p className="form-error">{formError}</p>}`, and modal footer with "Cancelar" and "Salvar" buttons; submit handler is a stub (`async () => {}`) at this stage (depends on T005)
- [x] T007 [US1] Add "Importar planilha" `btn-ghost` button inside `<div className="m-actions">` in `src/pages/moviment/CadastralMovimentDefaut.tsx` — between the "Diário do lote" button and the "Exportar XLSX" button (lines ~844–851); `onClick={() => setModal('xlsx-upload')}` (depends on T005)
- [x] T008 [US1] Add `{modal === 'xlsx-upload' && <XlsxUploadModal onSuccess={() => {}} onClose={() => setModal(null)} />}` overlay block in `src/pages/moviment/CadastralMovimentDefaut.tsx` — after the `modal === 'bulk-reject'` block (~line 993) (depends on T006, T007)
- [x] T009 [P] [US1] Add `XlsxUploadModal` and `XlsxUploadModalProps` to the named exports block in `src/pages/moviment/CadastralMovimentDefaut.tsx` (~line 509) (depends on T006)

**Checkpoint**: User Story 1 fully functional — button visible, modal opens with all fields, cancel works. No form submission yet.

---

## Phase 4: User Story 2 — Preencher e Submeter o Formulário de Upload (Priority: P1)

**Goal**: Filling all 6 fields and clicking "Salvar" sends `POST /api/batches/xlsx` as multipart/form-data. On success the modal closes, the batch list reloads with the new batch selected, and a toast "Lote importado com sucesso" appears.

**Independent Test**: Fill all 6 fields with a valid `.xlsx` file (≤ 10 MB), click "Salvar" — observe loading indicator, API call fires (inspect network), modal closes on success response, new batch appears in the left rail, toast appears. Depends on Foundational phase (T002–T004) and US1 (T005–T009).

### Implementation for User Story 2

- [x] T010 [US2] Add `handleXlsxUploadSuccess` async function inside `CadastralMovimentDefaut()` in `src/pages/moviment/CadastralMovimentDefaut.tsx` — calls `setModal(null)`, then `batchesApi.list({ operationTypeKey: 'cadastral-movement', pageSize: 50 })`, updates `setBatches(res.items)`, sets `setSelBatchId(res.items[0].batchId)` if items exist, finally calls `flash('ok', 'Lote importado com sucesso')` (depends on T004, T008)
- [x] T011 [US2] Implement `handleSubmit` in `XlsxUploadModal` in `src/pages/moviment/CadastralMovimentDefaut.tsx` — sets `loading(true)`, calls `batchesApi.uploadXlsx({ file, operationTypeKey, movementType, sourceType, sourceId, sourceChannel })`, on success calls `onSuccess()`, on `ApiError` sets `formError(err.body || 'Erro no servidor.')`, on unknown error sets `formError('Erro inesperado.')`, always sets `loading(false)` in `finally` block (depends on T004, T006)
- [x] T012 [US2] Wire `onSuccess={handleXlsxUploadSuccess}` in the `xlsx-upload` overlay block in `src/pages/moviment/CadastralMovimentDefaut.tsx` — replace the stub `() => {}` added in T008 (depends on T010, T011)

**Checkpoint**: User Stories 1 AND 2 fully functional — complete happy path works end to end.

---

## Phase 5: User Story 3 — Validação de Campos Obrigatórios e Feedback de Erro (Priority: P2)

**Goal**: Submitting with missing or invalid input shows specific error messages inside the modal without sending any API request. Server errors keep the modal open with the error message.

**Independent Test**: (a) Click "Salvar" with no file → error "Selecione um arquivo XLSX." appears, no network request. (b) Select `.csv` file → error about extension. (c) Select file > 10 MB → error about size. (d) Provide file but leave text fields empty → error "Preencha todos os campos obrigatórios." (e) Simulate 400 server response → modal stays open with server error message.

### Implementation for User Story 3

- [x] T013 [US3] Add client-side validation block at the top of `handleSubmit` in `XlsxUploadModal` in `src/pages/moviment/CadastralMovimentDefaut.tsx` — in order: (1) `if (!file) return setFormError('Selecione um arquivo XLSX.')`, (2) `if (!file.name.toLowerCase().endsWith('.xlsx')) return setFormError('O arquivo deve ter extensão .xlsx.')`, (3) `if (file.size > XLSX_MAX_BYTES) return setFormError('O arquivo não pode ultrapassar 10 MB.')`, (4) check all 5 text fields trimmed non-empty `return setFormError('Preencha todos os campos obrigatórios.')` (depends on T011)
- [x] T014 [P] [US3] Define `const XLSX_MAX_BYTES = 10 * 1024 * 1024` as a module-level constant (above the component, near `ModalKind`) in `src/pages/moviment/CadastralMovimentDefaut.tsx` (depends on T013; [P] — just a constant declaration)
- [x] T015 [US3] Verify `{formError && <p className="form-error">{formError}</p>}` is present in the `XlsxUploadModal` render (added in T006 skeleton); confirm `form-error` CSS class exists in `src/styles/app.css` — add minimal styling if missing (depends on T013)

**Checkpoint**: All 3 user stories fully functional — validation, submission, and error handling all work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening and verification across all user stories

- [x] T016 [P] Disable "Salvar" button and show "Enviando…" label while `loading === true` in `XlsxUploadModal` in `src/pages/moviment/CadastralMovimentDefaut.tsx` — verify both the `className` and `disabled` prop on the button reflect loading state (depends on T011); also disable "Cancelar" while loading
- [x] T017 Run manual test checklist from `specs/006-xlsx-batch-upload/quickstart.md` (12 scenarios) — verify all pass in the browser; note any styling gaps in `src/styles/app.css` (e.g., `modal-field`, `field-lbl` classes) and add if missing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks US2 and US3**
- **US1 (Phase 3)**: Can start after T001; T004 and T005–T009 can run in parallel (different files)
- **US2 (Phase 4)**: Depends on Phase 2 (T002–T004) and Phase 3 (T005–T009) completion
- **US3 (Phase 5)**: Depends on Phase 4 (T010–T012) completion
- **Polish (Phase 6)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after T001 — no API dependency for modal display
- **US2 (P1)**: Depends on Foundational (T002–T004) + US1 (T005–T009)
- **US3 (P2)**: Depends on US2 (T010–T012) — extends the same `handleSubmit`

### Within Each User Story

- US1: T005 → T006 → T007, T009 (parallel) → T008
- US2: T010 + T011 (parallel, different concerns) → T012
- US3: T013 → T014 (parallel), T015

### Parallel Opportunities

After T003 completes, these can run simultaneously:
- T004 (`src/api/batches.ts`) in parallel with T005–T009 (`CadastralMovimentDefaut.tsx`)

Within US1, after T005:
- T006 and T007 can run in parallel (same file, non-conflicting edits at different locations)
- T009 can run in parallel with T007 (different lines)

Within US2:
- T010 and T011 can run in parallel (both in same file but T010 adds a new function and T011 modifies the modal component — non-conflicting)

---

## Parallel Example: After T003 Completes

```
# Stream A — API method (different file):
T004: Add uploadXlsx to src/api/batches.ts

# Stream B — UI skeleton (same file, different locations):
T005: Extend ModalKind in CadastralMovimentDefaut.tsx
T006: Add XlsxUploadModal component skeleton
T007: Add "Importar planilha" button to m-actions
T009: Add named exports
→ T008: Wire overlay (depends on T006, T007)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: T001
2. Complete Phase 2: T002 → T003 → T004
3. Complete Phase 3 (US1): T005 → T006 → T007, T009 → T008
4. Complete Phase 4 (US2): T010 + T011 → T012
5. **STOP and VALIDATE**: Full happy path works in browser
6. Proceed to Phase 5 (US3) for validation hardening

### Incremental Delivery

1. T001–T004 → API layer ready
2. T005–T009 → Button + modal visible and openable (US1 done)
3. T010–T012 → Full upload flow works (US2 done, MVP shippable)
4. T013–T015 → Validation hardened (US3 done)
5. T016–T017 → Polish and test checklist

---

## Notes

- [P] tasks = different files or non-conflicting locations; safe to parallelize
- `XLSX_MAX_BYTES` constant must be at module level (outside component) — T014
- FormData key casing (`OperationTypeKey` vs `operationTypeKey`) must be verified against backend OpenAPI spec before T004 ships
- The `form-error` CSS class may need to be added to `src/styles/app.css` if not already present (check in T015)
- The icon `"upload"` must be confirmed in `Icons.tsx` in T001; if missing, choose nearest equivalent (e.g., `"arrowUp"`)
