# Implementation Plan: XLSX Batch Upload

**Branch**: `006-xlsx-batch-upload` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-xlsx-batch-upload/spec.md`

## Summary

Add an "Importar planilha" button to `CadastralMovimentDefaut.tsx` between the "Diário do lote" and "Exportar XLSX" buttons. The button opens a modal (`XlsxUploadModal`) with 6 required fields — a file picker (`.xlsx`, ≤ 10 MB) and 5 text inputs — that submits to `POST /api/batches/xlsx` as `multipart/form-data`. On success the modal closes, the batch list reloads, and a toast confirms the import. The change touches 3 files: `client.ts` (new `postForm` method), `batches.ts` (new `uploadXlsx` API method), and `CadastralMovimentDefaut.tsx` (new modal component + button + wiring).

## Technical Context

**Language/Version**: TypeScript (React 18, Vite)

**Primary Dependencies**: React, Tailwind CSS (existing project stack)

**Storage**: N/A — no persistence change; frontend reloads from API after upload

**Testing**: Vitest + React Testing Library (existing test setup)

**Target Platform**: Web browser (same as existing app)

**Project Type**: Single-page web application (frontend only)

**Performance Goals**: No new async paths beyond the upload itself; list reload reuses existing `batchesApi.list()` call.

**Constraints**: File size capped at 10 MB client-side. No timeout on upload — browser/OS handles connection failure.

**Scale/Scope**: 3 files modified; 1 new sub-component added inline.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Schema-Driven Generic Rendering | ✅ Pass | Modal form fields are fixed by the API contract (`/api/batches/xlsx`), not by the operation schema — this is a data-ingestion form, not a schema-rendered cockpit view. No per-client branching. |
| II. Design System Fidelity | ✅ Pass | Modal uses the existing `Modal` component from `UI.tsx`. Button uses `btn-ghost` class (existing design token). No new colors, spacing, or ad-hoc components. |
| III. Single Canonical Surface | ✅ Pass | The upload form uses canonical field names from the API contract. No source-specific labels introduced. |
| IV. Component Isolation & Typed Contracts | ✅ Pass | `XlsxUploadModal` is a typed, isolated sub-component with explicit props interface. `uploadXlsx` in `batchesApi` has typed parameters. No `any`. |
| V. Test Discipline | ✅ Pass | `XlsxUploadModal` rendering and submission behavior (validation, success, error) must be covered by component tests. See Test Coverage Required below. |
| VI. Accessibility & UX | ✅ Pass | Modal is keyboard-navigable via existing `Modal` component. "Cancelar" and "Salvar" are standard buttons. Loading state disables submit to prevent double-submission. |
| VII. AI-Readiness | ✅ Pass | No changes to decision affordances or confidence signals. |

**Post-Design Re-check**: All principles pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/006-xlsx-batch-upload/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions and rationale
├── data-model.md        # Phase 1 — form types and API payload
├── quickstart.md        # Phase 1 — dev setup and test checklist
├── contracts/
│   └── ui-contracts.md  # Phase 1 — component interfaces, button placement, validation
└── tasks.md             # Phase 2 — /speckit-tasks output
```

### Source Code (affected files only)

```text
src/
├── api/
│   ├── client.ts                         ← add requestForm + httpClient.postForm
│   └── batches.ts                        ← add uploadXlsx method
└── pages/
    └── moviment/
        └── CadastralMovimentDefaut.tsx   ← add XlsxUploadModal + extend ModalKind + button + overlay
```

**Structure Decision**: Single-project frontend SPA. No new files added to `src/`. All changes are additive within existing files.

## Implementation Steps

### Step 1 — Add `postForm` to `httpClient` (`src/api/client.ts`)

After the existing `requestBlob` function, add:

```typescript
async function requestForm<T>(
  method: string,
  path: string,
  form: FormData,
): Promise<T> {
  if (isTokenExpired()) {
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(401, 'token expired');
  }
  // Do NOT set Content-Type — browser must set the multipart boundary
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(res.status, text);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
```

And add to `httpClient`:

```typescript
postForm: <T>(path: string, form: FormData) => requestForm<T>('POST', path, form),
```

---

### Step 2 — Add `uploadXlsx` to `batchesApi` (`src/api/batches.ts`)

Add import of `requestForm` (or use `httpClient.postForm`) — since `httpClient` is already imported, use it:

```typescript
uploadXlsx: (params: {
  file:               File;
  operationTypeKey:   string;
  movementType:       string;
  sourceType:         string;
  sourceId:           string;
  sourceChannel:      string;
}) => {
  const fd = new FormData();
  fd.append('file', params.file);
  fd.append('OperationTypeKey', params.operationTypeKey);
  fd.append('MovementType', params.movementType);
  fd.append('SourceType', params.sourceType);
  fd.append('SourceId', params.sourceId);
  fd.append('SourceChannel', params.sourceChannel);
  return httpClient.postForm<void>('/api/batches/xlsx', fd);
},
```

> **Note**: Verify FormData key casing (`OperationTypeKey` vs `operationTypeKey`) against the actual backend OpenAPI spec before shipping.

---

### Step 3 — Add `XlsxUploadModal` component (`CadastralMovimentDefaut.tsx`)

Add after the `BulkRejectModal` component block (before the named exports line ~509):

```typescript
const XLSX_MAX_BYTES = 10 * 1024 * 1024;

interface XlsxUploadModalProps { onSuccess: () => void; onClose: () => void }
function XlsxUploadModal({ onSuccess, onClose }: XlsxUploadModalProps) {
  const [file,               setFile]               = useState<File | null>(null);
  const [operationTypeKey,   setOperationTypeKey]   = useState('');
  const [movementType,       setMovementType]       = useState('');
  const [sourceType,         setSourceType]         = useState('');
  const [sourceId,           setSourceId]           = useState('');
  const [sourceChannel,      setSourceChannel]      = useState('');
  const [loading,            setLoading]            = useState(false);
  const [formError,          setFormError]          = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file)                                        return setFormError('Selecione um arquivo XLSX.');
    if (!file.name.toLowerCase().endsWith('.xlsx'))   return setFormError('O arquivo deve ter extensão .xlsx.');
    if (file.size > XLSX_MAX_BYTES)                   return setFormError('O arquivo não pode ultrapassar 10 MB.');
    if (!operationTypeKey.trim() || !movementType.trim() ||
        !sourceType.trim()       || !sourceId.trim()  ||
        !sourceChannel.trim())   return setFormError('Preencha todos os campos obrigatórios.');

    setFormError(null);
    setLoading(true);
    try {
      await batchesApi.uploadXlsx({ file, operationTypeKey, movementType, sourceType, sourceId, sourceChannel });
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.body || 'Erro no servidor.' : 'Erro inesperado.';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Importar planilha" icon="upload">
      <div className="modal-field">
        <label className="field-lbl">Arquivo XLSX *</label>
        <input type="file" accept=".xlsx" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <div className="modal-field">
        <label className="field-lbl">Tipo de operação *</label>
        <input value={operationTypeKey} onChange={e => setOperationTypeKey(e.target.value)} placeholder="Ex.: cadastral-movement" />
      </div>
      <div className="modal-field">
        <label className="field-lbl">Tipo de movimentação *</label>
        <input value={movementType} onChange={e => setMovementType(e.target.value)} placeholder="Ex.: New" />
      </div>
      <div className="modal-field">
        <label className="field-lbl">Tipo de fonte *</label>
        <input value={sourceType} onChange={e => setSourceType(e.target.value)} placeholder="Ex.: System" />
      </div>
      <div className="modal-field">
        <label className="field-lbl">ID da fonte *</label>
        <input value={sourceId} onChange={e => setSourceId(e.target.value)} placeholder="Ex.: crm-001" />
      </div>
      <div className="modal-field">
        <label className="field-lbl">Canal da fonte *</label>
        <input value={sourceChannel} onChange={e => setSourceChannel(e.target.value)} placeholder="Ex.: API" />
      </div>
      {formError && <p className="form-error">{formError}</p>}
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
        <button
          className={'btn ' + (loading ? 'btn-disabled' : 'btn-primary')}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Enviando…' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

### Step 4 — Extend `ModalKind` and add `handleXlsxUploadSuccess`

```typescript
// Change line ~537
type ModalKind = 'bulk-reject' | 'diary' | 'xlsx-upload' | null;
```

Add handler inside `CadastralMovimentDefaut()` (near other handlers, e.g., after `bulkDisable`):

```typescript
const handleXlsxUploadSuccess = async () => {
  setModal(null);
  try {
    const res = await batchesApi.list({ operationTypeKey: 'cadastral-movement', pageSize: 50 });
    setBatches(res.items);
    if (res.items.length > 0) setSelBatchId(res.items[0].batchId);
  } catch {
    // List will be stale; user can reload the page
  }
  flash('ok', 'Lote importado com sucesso');
};
```

---

### Step 5 — Add button to the actions bar

In the `<div className="m-actions">` block (lines 844–851), insert the new button between "Diário do lote" and "Exportar XLSX":

```tsx
<button className="btn btn-ghost" onClick={() => setModal('xlsx-upload')}>
  <I n="upload" s={16} /> Importar planilha
</button>
```

---

### Step 6 — Add overlay wiring

In the overlays section (after the `modal === 'bulk-reject'` block, before the `toast` line):

```tsx
{modal === 'xlsx-upload' && (
  <XlsxUploadModal
    onSuccess={handleXlsxUploadSuccess}
    onClose={() => setModal(null)}
  />
)}
```

---

### Step 7 — Add to named exports

```typescript
export { ..., XlsxUploadModal };
export type { ..., XlsxUploadModalProps };
```

---

## Test Coverage Required

Per Constitution Principle V, component tests must cover:

- **Validation — empty submit**: render `XlsxUploadModal`, click "Salvar" with no fields filled → `formError` "Selecione um arquivo XLSX." displayed; `batchesApi.uploadXlsx` never called.
- **Validation — wrong extension**: select a `.csv` file → `formError` "O arquivo deve ter extensão .xlsx."
- **Validation — oversized file**: select a file with `size > 10 * 1024 * 1024` → `formError` "O arquivo não pode ultrapassar 10 MB."
- **Validation — missing text fields**: provide valid file but leave text fields empty → `formError` "Preencha todos os campos obrigatórios."
- **Happy path**: fill all fields with a valid `.xlsx` file ≤ 10 MB → `batchesApi.uploadXlsx` called once with correct params → `onSuccess` called; `formError` is null.
- **API error**: `batchesApi.uploadXlsx` rejects with `ApiError` → `formError` shows error body; `onSuccess` NOT called; modal stays open.
- **Loading state**: while `uploadXlsx` is pending → "Salvar" button is disabled; label shows "Enviando…".
- **Cancel**: click "Cancelar" → `onClose` called; `uploadXlsx` NOT called.
