# Research: XLSX Batch Upload

**Feature**: 006-xlsx-batch-upload
**Date**: 2026-06-29

## Findings

### Decision 1 — multipart/form-data support in `httpClient`

**Decision**: Add a `postForm<T>` method to `httpClient` in `src/api/client.ts` that accepts a `FormData` object and issues a `fetch` POST without setting `Content-Type` (the browser sets it automatically with the correct multipart boundary).

**Rationale**: The existing `request<T>` function always sets `Content-Type: application/json` and JSON-serializes the body. `FormData` must not have `Content-Type` forced — the browser must set the multipart boundary. A dedicated `requestForm<T>` internal helper (parallel to the existing `requestBlob`) keeps the client clean and type-safe.

**Alternatives considered**:
- Using `axios` for multipart: rejected — no external HTTP library in the project; `fetch` is already used throughout.
- Overloading `httpClient.post`: rejected — would break type contracts (body typed as `unknown`, not `FormData`) and leak JSON serialization concern into the caller.

---

### Decision 2 — XlsxUploadModal placement in the codebase

**Decision**: Implement `XlsxUploadModal` as a named sub-component inside `CadastralMovimentDefaut.tsx`, following the same pattern as `DiaryModal` and `BulkRejectModal`. Export it for testing via the existing named-export block.

**Rationale**: All modal sub-components for this page live in `CadastralMovimentDefaut.tsx`. Splitting into a separate file would require prop-drilling `flash` and reload dependencies or a context, adding complexity for a single-use component. The existing pattern is established and consistent with the constitution (Component Isolation — small, composable components).

**Alternatives considered**:
- Separate file `src/components/modals/XlsxUploadModal.tsx`: rejected — over-engineered for a single-page use case; existing pattern is inline sub-components.

---

### Decision 3 — Form state management in the modal

**Decision**: Local `useState` inside `XlsxUploadModal` for each of the 6 fields (`file`, `operationTypeKey`, `movementType`, `sourceType`, `sourceId`, `sourceChannel`), plus `loading: boolean` and `formError: string | null`. No global state or context.

**Rationale**: The form is ephemeral and modal-scoped; no other component needs these values. Local state is the simplest and most isolated approach, consistent with how `BulkRejectModal` manages its `m` state.

**Alternatives considered**:
- React Hook Form / Formik: rejected — no form library is used in this project; introducing one for a single 6-field form exceeds the feature scope.

---

### Decision 4 — Client-side validation before submission

**Decision**: Validate synchronously before calling the API:
1. All 5 text fields non-empty (trimmed).
2. File field non-null.
3. File extension equals `.xlsx` (case-insensitive check on `file.name`).
4. File size ≤ 10 MB (10 × 1024 × 1024 bytes).

Show inline error message (`formError`) inside the modal if validation fails; do not send the request.

**Rationale**: Prevents unnecessary round-trips for obviously invalid input. File size and extension checks are cheap and immediate. Backend validation of XLSX content structure remains the backend's responsibility.

**Alternatives considered**:
- HTML `accept=".xlsx"` attribute only: insufficient — `accept` is a hint to the file picker, not an enforcement mechanism; scripts and drag-drop bypass it.

---

### Decision 5 — Batch list refresh after successful upload

**Decision**: After the API call succeeds, the `onSuccess` callback in the parent re-fetches `batchesApi.list({ operationTypeKey: 'cadastral-movement', pageSize: 50 })`, updates `batches` state, and sets `selBatchId` to the first item in the new list (which will be the most recently created batch, assuming the API returns newest-first).

**Rationale**: This reuses the same fetch + state update pattern already present in the `useEffect` on mount. A full re-fetch guarantees the batch list reflects the server state after import, including the new batch and its occurrence counts.

**Alternatives considered**:
- Optimistic update (add the batch to local state without re-fetching): rejected — the API response for `POST /api/batches/xlsx` does not return the full `ApiBatchListItem`, so the optimistic item would be incomplete.

---

### Decision 6 — `ModalKind` extension

**Decision**: Extend `type ModalKind = 'bulk-reject' | 'diary' | null` to `'bulk-reject' | 'diary' | 'xlsx-upload' | null`.

**Rationale**: Consistent with the existing modal dispatch pattern in the page component. Adds the new modal kind without any structural change.

---

### Decision 7 — Button placement and style

**Decision**: Insert the new button between the existing "Diário do lote" (`btn-ghost`) and "Exportar XLSX" (`btn-primary`) buttons, using the `btn-ghost` class.

**Rationale**: The button is a secondary action relative to the primary export. Using `btn-ghost` keeps visual hierarchy: ghost | ghost | primary (export). The position between diary and export matches the spec requirement exactly (lines 844–851 in `CadastralMovimentDefaut.tsx`).

---

## Files to Change

| File | Change Type | Description |
|------|------------|-------------|
| `src/api/client.ts` | Edit | Add `requestForm<T>` helper + `postForm` to `httpClient` |
| `src/api/batches.ts` | Edit | Add `uploadXlsx` method using `httpClient.postForm` |
| `src/pages/moviment/CadastralMovimentDefaut.tsx` | Edit | Add `XlsxUploadModal` component + extend `ModalKind` + add button + wire overlay |

No new files are created in `src/`.
