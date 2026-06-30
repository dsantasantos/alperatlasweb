# UI Contracts: XLSX Batch Upload

**Feature**: 006-xlsx-batch-upload
**Date**: 2026-06-29

## Component: XlsxUploadModal

```typescript
interface XlsxUploadModalProps {
  onSuccess: () => void;   // called after successful API response; parent handles list reload + toast
  onClose:   () => void;   // called on cancel / close without submitting
}

function XlsxUploadModal({ onSuccess, onClose }: XlsxUploadModalProps): JSX.Element
```

**Behaviour contract**:
- Rendered inside `<Modal title="Importar planilha" icon="upload" onClose={onClose}>`.
- Owns all form state locally; resets to `INITIAL_FORM` on unmount.
- Does NOT call `onSuccess` unless the API returns a success response.
- Does NOT close itself — parent controls visibility via `ModalKind`.
- On submit: runs client-side validation first. If validation fails, sets `formError` and aborts the request.
- While `loading === true`: "Salvar" button is `disabled`; shows spinner label "Enviando…".
- On API error: sets `formError` to the error message; modal stays open.

---

## Component: httpClient extension

```typescript
// Addition to src/api/client.ts
export const httpClient = {
  // ... existing methods ...
  postForm: <T>(path: string, form: FormData) => requestForm<T>('POST', path, form),
};
```

**Behaviour contract**:
- `requestForm` sends `fetch` with `method: 'POST'`, `headers: authHeaders()` (NO `Content-Type`), `body: form`.
- Handles `401` the same as `request<T>` (dispatches `auth:expired` event).
- Returns parsed JSON on success (or `undefined` for 204).
- Throws `ApiError` on non-2xx responses.

---

## API Method: batchesApi.uploadXlsx

```typescript
// Addition to src/api/batches.ts
uploadXlsx: (params: {
  file:               File;
  operationTypeKey:   string;
  movementType:       string;
  sourceType:         string;
  sourceId:           string;
  sourceChannel:      string;
}) => Promise<void>
```

**Behaviour contract**:
- Builds a `FormData` with the 6 required fields.
- Calls `httpClient.postForm<void>('/api/batches/xlsx', fd)`.
- Returns `Promise<void>` — no payload expected from the backend on success (or the payload is discarded).
- Throws `ApiError` on failure; caller handles the error.

---

## Button Placement Contract

Location: `CadastralMovimentDefaut.tsx` — `<div className="m-actions">` block.

```tsx
// Existing order (before this feature):
<button className="btn btn-ghost" onClick={() => setModal('diary')}>
  <I n="book" s={16} /> Diário do lote
</button>
<button className="btn btn-primary" onClick={doExport}>
  <I n="download" s={16} /> Exportar XLSX
</button>

// Required order (after this feature):
<button className="btn btn-ghost" onClick={() => setModal('diary')}>
  <I n="book" s={16} /> Diário do lote
</button>
<button className="btn btn-ghost" onClick={() => setModal('xlsx-upload')}>
  <I n="upload" s={16} /> Importar planilha
</button>
<button className="btn btn-primary" onClick={doExport}>
  <I n="download" s={16} /> Exportar XLSX
</button>
```

---

## ModalKind Extension Contract

```typescript
// Before
type ModalKind = 'bulk-reject' | 'diary' | null;

// After
type ModalKind = 'bulk-reject' | 'diary' | 'xlsx-upload' | null;
```

---

## Overlay Wiring Contract

```tsx
// Addition to the overlays section of CadastralMovimentDefaut:
{modal === 'xlsx-upload' && (
  <XlsxUploadModal
    onSuccess={handleXlsxUploadSuccess}
    onClose={() => setModal(null)}
  />
)}
```

Where `handleXlsxUploadSuccess` is:
```typescript
const handleXlsxUploadSuccess = async () => {
  setModal(null);
  const res = await batchesApi.list({ operationTypeKey: 'cadastral-movement', pageSize: 50 });
  setBatches(res.items);
  if (res.items.length > 0) setSelBatchId(res.items[0].batchId);
  flash('ok', 'Lote importado com sucesso');
};
```

---

## Modal Form Layout Contract

```tsx
<Modal title="Importar planilha" icon="upload" onClose={onClose}>
  {/* File input */}
  <label>Arquivo XLSX *</label>
  <input type="file" accept=".xlsx" onChange={...} />

  {/* 5 text fields */}
  <label>Tipo de operação *</label>
  <input type="text" value={form.operationTypeKey} onChange={...} />

  <label>Tipo de movimentação *</label>
  <input type="text" value={form.movementType} onChange={...} />

  <label>Tipo de fonte *</label>
  <input type="text" value={form.sourceType} onChange={...} />

  <label>ID da fonte *</label>
  <input type="text" value={form.sourceId} onChange={...} />

  <label>Canal da fonte *</label>
  <input type="text" value={form.sourceChannel} onChange={...} />

  {/* Error message */}
  {formError && <p className="form-error">{formError}</p>}

  {/* Footer */}
  <div className="modal-foot">
    <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
      Cancelar
    </button>
    <button
      className={'btn ' + (loading ? 'btn-disabled' : 'btn-primary')}
      onClick={handleSubmit}
      disabled={loading}
    >
      {loading ? 'Enviando…' : 'Salvar'}
    </button>
  </div>
</Modal>
```

---

## Client-Side Validation Rules (in submission order)

| Check | Error message shown |
|-------|-------------------|
| `form.file === null` | "Selecione um arquivo XLSX." |
| `!form.file.name.toLowerCase().endsWith('.xlsx')` | "O arquivo deve ter extensão .xlsx." |
| `form.file.size > XLSX_MAX_BYTES` | "O arquivo não pode ultrapassar 10 MB." |
| Any text field empty after trim | "Preencha todos os campos obrigatórios." |

---

## Test Exports Contract

```typescript
// Addition to named exports block (line 509 of CadastralMovimentDefaut.tsx)
export { ..., XlsxUploadModal };
export type { ..., XlsxUploadModalProps };
```
