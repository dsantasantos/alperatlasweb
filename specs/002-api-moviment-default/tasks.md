---
description: "Task list for CadastralMovimentDefaut â€” API-Connected Screen (v3 â€” enhancements 2026-06-28)"
---

# Tasks: CadastralMovimentDefaut â€” API-Connected Screen (v3)

**Input**: Design documents from `specs/002-api-moviment-default/`

**Prerequisites**: plan.md âœ… Â· spec.md âœ… Â· research.md âœ… Â· data-model.md âœ… Â· contracts/ âœ…

**Tech stack**: TypeScript 6.0 strict Â· React 19 Â· Vite 7 Â· Tailwind CSS 3.4

**Scope of this version**: Four enhancements on top of the existing implementation â€”
(1) `movementType` as first table column, (2) collapsible batch audit diary panel,
(3) occurrence notes section in drawer, (4) batch approve / reject / disable via checkboxes.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable â€” different files, no incomplete dependencies
- **[Story]**: Maps to user story from spec.md (US1â€“US7)
- All tasks include exact file paths

---

## Phase 1: Setup â€” Type Contract Update (CONTRACT VERSION 3.0)

**Purpose**: Extend `src/api/types.ts` with new types before any feature work begins.
No user story implementation can start until T001 is complete.

**âš ï¸ CRITICAL**: T002â€“T007 depend on the types in T001.

- [x] T001 Update `src/api/types.ts` to CONTRACT VERSION 3.0: (a) add `movementType: string` field to `ApiOccurrenceListItem`; (b) add `notes: ApiOccurrenceNote[]` field to `ApiOccurrenceDetail`; (c) add new interface `ApiOccurrenceNote { id: string; text: string; authorId: string; createdAt: string; }`; (d) add new interface `ApiBatchAuditEntry { changedAt: string; changeType: string; actorId: string; description: string; }`

**Checkpoint**: Types compile â€” run `npx tsc --noEmit` and confirm zero errors before proceeding.

---

## Phase 2: Foundational â€” API Layer Extensions

**Purpose**: Add all new API functions to `src/api/batches.ts` and `src/api/occurrences.ts`.
These are pure additions â€” existing functions must not be modified.

**âš ï¸ CRITICAL**: All user story phases depend on these API functions.

- [x] T002 [P] Add `export async function getBatchAudit(batchId: string): Promise<ApiBatchAuditEntry[]>` to `src/api/batches.ts` â€” calls `GET /api/batches/${batchId}/audit` via `httpClient` and returns the response array
- [x] T003 [P] Add `export async function postOccurrenceNote(occurrenceId: string, text: string): Promise<void>` to `src/api/occurrences.ts` â€” calls `POST /api/occurrences/${occurrenceId}/notes` with JSON body `{ text }` via `httpClient`
- [x] T004 [P] Add `export async function batchApprove(occurrenceIds: string[]): Promise<unknown>` to `src/api/occurrences.ts` â€” calls `POST /api/occurrences/batch/approve` with JSON body `{ occurrenceIds }` via `httpClient`
- [x] T005 [P] Add `export async function batchReject(occurrenceIds: string[], reason: string): Promise<unknown>` to `src/api/occurrences.ts` â€” calls `POST /api/occurrences/batch/reject` with JSON body `{ occurrenceIds, reason }` via `httpClient`
- [x] T006 [P] Add `export async function batchDisable(occurrenceIds: string[]): Promise<unknown>` to `src/api/occurrences.ts` â€” calls `POST /api/occurrences/batch/disable` with JSON body `{ occurrenceIds }` via `httpClient`
- [x] T007 Update `src/api/index.ts` to re-export the five new functions: `getBatchAudit`, `postOccurrenceNote`, `batchApprove`, `batchReject`, `batchDisable`

**Checkpoint**: `npx tsc --noEmit` passes â€” all new API functions are typed and exported.

---

## Phase 3: US1 â€” movementType as First Table Column (Priority: P1) ðŸŽ¯ MVP

**Goal**: Every row in the occurrence table shows its movement type ("New", "Edit", or "Remove") as the first data column â€” before all schema-driven columns.

**Independent Test**: Load the screen â†’ confirm the first column header is "Tipo" â†’ confirm each row cell under it shows "New", "Edit", or "Remove" from `ApiOccurrenceListItem.movementType` â†’ confirm schema-driven columns still follow, "ConferÃªncia" and "Status" are still last.

### Implementation for US1

- [x] T008 [US1] In `src/pages/moviment/CadastralMovimentDefaut.tsx`, update the `OccurrenceTable` column header row: add a fixed `<th>` with text "Tipo" as the **first** `<th>` element, before the `schema.fields` mapping loop that generates dynamic headers
- [x] T009 [US1] In `src/pages/moviment/CadastralMovimentDefaut.tsx`, update the `Row` cell rendering: add `<td>{r.movementType ?? ''}</td>` as the **first** `<td>` data cell, before the schema-driven `fields.map(...)` cells â€” position must match the "Tipo" header added in T008

**Checkpoint**: US1 fully functional â€” movementType is first column, schema columns follow, fixed columns last. Smoke-check steps 5â€“7 from `specs/002-api-moviment-default/quickstart.md` pass.

---

## Phase 4: US5 â€” Batch Audit Diary Panel (Priority: P2)

**Goal**: A collapsible panel at the top of the screen shows the complete change history of the selected batch, fetched from `GET /api/batches/{id}/audit`.

**Independent Test**: Select a batch â†’ confirm `GET /api/batches/{id}/audit` fires â†’ confirm the panel renders `changedAt`, `changeType`, `actorId`, `description` for each entry â†’ click toggle â†’ panel collapses â†’ click toggle again â†’ panel expands â†’ switch batch â†’ panel re-fetches with new batch id.

### Implementation for US5

- [x] T010 [US5] In `src/pages/moviment/CadastralMovimentDefaut.tsx`, create `AuditDiaryPanel` sub-component with props `{ entries: ApiBatchAuditEntry[]; loading: boolean; error: boolean; collapsed: boolean; onToggle: () => void }` â€” renders: a header row with title "DiÃ¡rio do lote" and a collapse/expand toggle button; when `collapsed` is true renders nothing below the header; when `loading` shows a loading indicator; when `error` shows "Erro ao carregar diÃ¡rio"; when `entries.length === 0` shows "Sem registros"; otherwise renders each entry as a row showing `changedAt` (formatted), `changeType`, `actorId`, `description`
- [x] T011 [US5] In `CadastralMovimentDefaut.tsx`, add four state variables: `const [auditEntries, setAuditEntries] = useState<ApiBatchAuditEntry[]>([])`, `const [auditLoading, setAuditLoading] = useState(false)`, `const [auditError, setAuditError] = useState(false)`, `const [diaryCollapsed, setDiaryCollapsed] = useState(false)`
- [x] T012 [US5] In `CadastralMovimentDefaut.tsx`, extend the batch-selection handler (the function triggered when a batch is selected from the rail): fire `getBatchAudit(batchId)` in parallel alongside the existing `getBatchDetail` and `getBatchSummary` calls; on resolve set `setAuditEntries(data)` and `setAuditLoading(false)`; on reject set `setAuditError(true)` and `setAuditLoading(false)`; set `setAuditLoading(true)` and `setAuditError(false)` before the call
- [x] T013 [US5] In `CadastralMovimentDefaut.tsx`, mount `<AuditDiaryPanel>` in the JSX above the `SummaryBar` / occurrence table area, passing `entries={auditEntries}`, `loading={auditLoading}`, `error={auditError}`, `collapsed={diaryCollapsed}`, `onToggle={() => setDiaryCollapsed(c => !c)}`

**Checkpoint**: US5 fully functional â€” smoke-check steps 8â€“12 from `specs/002-api-moviment-default/quickstart.md` pass.

---

## Phase 5: US6 â€” Occurrence Notes in Drawer (Priority: P2)

**Goal**: The occurrence detail drawer shows a notes section (HistÃ³rico Â· auditoria e diÃ¡rio) below the schema-driven form fields. Analysts can read embedded notes and add new ones.

**Independent Test**: Open a row drawer â†’ confirm notes from `detail.notes` appear chronologically â†’ type a note and click submit â†’ confirm `POST /api/occurrences/{id}/notes` fires â†’ confirm notes list refreshes to include the new note without closing the drawer â†’ confirm submit is disabled when text field is empty.

### Implementation for US6

- [x] T014 [US6] In `src/pages/moviment/CadastralMovimentDefaut.tsx`, create `NotesSection` sub-component with props `{ occurrenceId: string; notes: ApiOccurrenceNote[]; onNoteAdded: (updated: ApiOccurrenceDetail) => void; flash: (k: 'ok' | 'warn' | 'info', m: string) => void }` â€” renders: section heading "HistÃ³rico Â· auditoria e diÃ¡rio"; list of notes sorted chronologically, each showing `createdAt` (formatted), `authorId`, and `text`; empty state "Sem anotaÃ§Ãµes" when `notes.length === 0`; a `<textarea>` bound to local `noteText` state; a "Adicionar anotaÃ§Ã£o" submit button disabled when `noteText.trim() === ''`; on submit: call `postOccurrenceNote(occurrenceId, noteText.trim())`, then call `getOccurrenceDetail(occurrenceId)` and pass result to `onNoteAdded`, then clear `noteText`; on any error call `flash('warn', 'Erro ao salvar anotaÃ§Ã£o')`
- [x] T015 [US6] In `CadastralMovimentDefaut.tsx`, update the `Drawer` component layout: after the last schema-driven form input (end of `schema.fields.map(...)` block), add `<hr className="my-4 border-gray-200" />` followed by `<NotesSection occurrenceId={detail.occurrenceId} notes={detail.notes ?? []} onNoteAdded={onUpdate} flash={flash} />`

**Checkpoint**: US6 fully functional â€” smoke-check steps 16â€“18 from `specs/002-api-moviment-default/quickstart.md` pass.

---

## Phase 6: US7 â€” Batch Approve / Reject / Disable (Priority: P2)

**Goal**: Analysts can select multiple occurrences via checkboxes (including a select-all header checkbox) and perform batch approve, reject (with reason), or disable in a single API call.

**Independent Test**: Select 2â€“3 rows â†’ confirm batch action buttons are enabled â†’ click header checkbox â†’ confirm all rows selected â†’ click header checkbox again â†’ confirm all deselected â†’ select 2 rows â†’ batch approve â†’ confirm single `POST /api/occurrences/batch/approve` fires with both IDs â†’ both rows update â†’ with 0 rows selected confirm buttons are disabled.

### Implementation for US7

- [x] T016 [US7] In `CadastralMovimentDefaut.tsx`, update `OccurrenceTable`: add a `<th>` as the first header column containing an `<input type="checkbox">` that uses a `ref` callback to set `.indeterminate = true` when `0 < checked.size < occurrences.length`, is `checked` when `checked.size === occurrences.length && occurrences.length > 0`, and calls `onCheckAll` on `onChange`
- [x] T017 [US7] In `CadastralMovimentDefaut.tsx`, add a batch action toolbar rendered above or below `OccurrenceTable` â€” three buttons: "Aprovar selecionados" (calls `onBatchApprove([...checked])`), "Rejeitar selecionados" (calls `onBatchReject`), "Desabilitar selecionados" (calls `onBatchDisable([...checked])`); all three buttons have `disabled={checked.size === 0}`; style consistently with existing action buttons in the screen
- [x] T018 [US7] In `CadastralMovimentDefaut.tsx`, create `BulkRejectModal` sub-component with props `{ count: number; onConfirm: (reason: string) => void; onClose: () => void }` â€” renders a modal dialog (reuse existing `Modal` from `src/components/shared/UI.tsx`) with heading "Rejeitar {count} ocorrÃªncia(s)?", a `<textarea>` bound to local `reason` state, Confirm button disabled when `reason.trim() === ''`, and Cancel button that calls `onClose`
- [x] T019 [US7] In `CadastralMovimentDefaut.tsx`, add three handler functions: `handleBatchApprove(ids: string[])` â€” calls `batchApprove(ids)`, on success updates each matched row's `state` to `'Approved'` in the occurrences list state, calls `flash('ok', `${ids.length} aprovadas`)`, clears `setChecked(new Set())`; `handleBatchReject(ids: string[], reason: string)` â€” calls `batchReject(ids, reason)`, updates matched rows' `state` to `'Rejected'`, flashes success, clears selection; `handleBatchDisable(ids: string[])` â€” calls `batchDisable(ids)`, updates matched rows' `state` to `'Disabled'`, flashes success, clears selection; all three show `flash('warn', 'Erro na operaÃ§Ã£o em lote')` on catch
- [x] T020 [US7] In `CadastralMovimentDefaut.tsx`, add `const [bulkRejectOpen, setBulkRejectOpen] = useState(false)` state; pass `onBatchApprove={handleBatchApprove}`, `onBatchReject={() => setBulkRejectOpen(true)}`, `onBatchDisable={handleBatchDisable}` as props to `OccurrenceTable`; render `{bulkRejectOpen && <BulkRejectModal count={checked.size} onConfirm={(r) => { handleBatchReject([...checked], r); setBulkRejectOpen(false); }} onClose={() => setBulkRejectOpen(false)} />}` in the screen JSX

**Checkpoint**: US7 fully functional â€” smoke-check steps 23â€“29 from `specs/002-api-moviment-default/quickstart.md` pass.

---

## Phase 7: US2, US3, US4 â€” Existing Implementation (Checkpoint)

These user stories are already implemented from the previous iteration. T015 (US6) extends the Drawer for US2 with the notes section. Verify they remain functional after the changes above.

**Independent Tests**:
- **US2** (drawer): Smoke-check steps 13â€“15, 19 from quickstart.md
- **US3** (single approve/reject/disable): Smoke-check steps 20â€“22 from quickstart.md
- **US4** (export): Smoke-check step 22 from quickstart.md

No new implementation tasks required for US2, US3, US4.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, type-safety audit, and smoke-check pass.

- [x] T021 Run `npx tsc --noEmit` from repository root and fix all TypeScript errors in `src/api/types.ts`, `src/api/batches.ts`, `src/api/occurrences.ts`, `src/pages/moviment/CadastralMovimentDefaut.tsx`
- [x] T022 [P] Verify SC-007 compliance: grep `src/pages/moviment/CadastralMovimentDefaut.tsx` for hardcoded field labels; allowed only: "Tipo", "ConferÃªncia", "Status", "DiÃ¡rio do lote", "HistÃ³rico Â· auditoria e diÃ¡rio", "Adicionar anotaÃ§Ã£o", "Aprovar selecionados", "Rejeitar selecionados", "Desabilitar selecionados"; fix any other hardcoded labels found
- [x] T023 [P] Run smoke-check steps 1â€“29 from `specs/002-api-moviment-default/quickstart.md` against a running dev server (`npm run dev`) and fix any failures in `src/pages/moviment/CadastralMovimentDefaut.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (T001) â”€â”€â–º Phase 2 (T002â€“T007) â”€â”€â–º Phase 3 (T008â€“T009) â”€â”€â–º Phase 8 (T021â€“T023)
                                        â”€â”€â–º Phase 4 (T010â€“T013) â”€â”€â–º
                                        â”€â”€â–º Phase 5 (T014â€“T015) â”€â”€â–º
                                        â”€â”€â–º Phase 6 (T016â€“T020) â”€â”€â–º
```

- **Phase 1** (T001): No dependencies â€” start immediately
- **Phase 2** (T002â€“T007): Depends on T001 (needs new types) â€” T002â€“T006 are parallel
- **Phases 3â€“6**: All depend on Phase 2 completion; can proceed in parallel with each other
- **Phase 7**: Checkpoint only â€” no new tasks
- **Phase 8** (T021â€“T023): Depends on all phases; T022 and T023 are parallel

### User Story Dependencies

| Story | Depends on | Can start after |
|-------|-----------|-----------------|
| US1 (T008â€“T009) | Phase 2 | T007 |
| US5 (T010â€“T013) | Phase 2, `getBatchAudit` | T002, T007 |
| US6 (T014â€“T015) | Phase 2, `postOccurrenceNote` | T003, T007 |
| US7 (T016â€“T020) | Phase 2, batch functions | T004â€“T007 |

### Within Each Phase

- Models/types before API functions
- API functions before component implementation
- Sub-components before parent integration
- State before handler before mount

---

## Parallel Opportunities

```
# Phase 2 â€” all can run simultaneously (different functions, same files â€” coordinate):
T002  getBatchAudit       â†’ src/api/batches.ts
T003  postOccurrenceNote  â†’ src/api/occurrences.ts
T004  batchApprove        â†’ src/api/occurrences.ts
T005  batchReject         â†’ src/api/occurrences.ts
T006  batchDisable        â†’ src/api/occurrences.ts
# Note: T003â€“T006 are in the same file â€” a single developer should do them sequentially

# Phase 3 â€” can run simultaneously (same file, different locations â€” coordinate):
T008  OccurrenceTable <th>
T009  Row <td>

# Phases 3â€“6 â€” can proceed in parallel across stories (same file â€” coordinate):
Phase 3 (US1)  â†’  T008, T009
Phase 4 (US5)  â†’  T010, T011, T012, T013
Phase 5 (US6)  â†’  T014, T015
Phase 6 (US7)  â†’  T016, T017, T018, T019, T020

# Phase 8:
T022  TypeScript audit
T023  Smoke-check run
```

---

## Implementation Strategy

### MVP First (US1 only â€” movementType column)

1. T001 â€” update types
2. T002â€“T007 â€” extend API layer
3. T008â€“T009 â€” add movementType column
4. **STOP**: Run smoke-check steps 5â€“7 from quickstart.md
5. Proceed to US5, US6, US7

### Recommended Delivery Order

1. T001 â†’ types (blocks everything)
2. T002â€“T007 â†’ API layer (T003â€“T006 in the same file, sequential)
3. T008â€“T009 â†’ US1 movementType (quick win, P1)
4. T010â€“T013 â†’ US5 audit diary
5. T014â€“T015 â†’ US6 notes
6. T016â€“T020 â†’ US7 batch ops
7. T021â€“T023 â†’ Polish

### Single-Developer Sequence

T001 â†’ T002 â†’ T003 â†’ T004 â†’ T005 â†’ T006 â†’ T007 â†’
T008 â†’ T009 â†’
T010 â†’ T011 â†’ T012 â†’ T013 â†’
T014 â†’ T015 â†’
T016 â†’ T017 â†’ T018 â†’ T019 â†’ T020 â†’
T021 â†’ T022 â†’ T023

---

## Notes

- `[P]` within Phase 2 means different functions â€” T003â€“T006 all go in `src/api/occurrences.ts`, so one developer should do them sequentially
- `[P]` in Phase 8 means T022 (grep/audit) and T023 (browser smoke-check) can run in parallel
- `CadastralMoviment.tsx` must NOT be modified at any point
- After T001, always run `npx tsc --noEmit` before moving to the next phase
- Each checkpoint in quickstart.md maps directly to the acceptance criteria in spec.md
- `detail.notes` may arrive as `undefined` from older API responses â€” use `detail.notes ?? []` defensively
