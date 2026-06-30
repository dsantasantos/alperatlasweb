# Data Model: XLSX Batch Upload

**Feature**: 006-xlsx-batch-upload
**Date**: 2026-06-29

## Frontend Types

### XlsxUploadForm (local form state — not persisted)

```typescript
interface XlsxUploadForm {
  file:               File | null;
  operationTypeKey:   string;
  movementType:       string;
  sourceType:         string;
  sourceId:           string;
  sourceChannel:      string;
}
```

| Field | Type | Validation |
|-------|------|-----------|
| `file` | `File \| null` | Required; extension must be `.xlsx`; size ≤ 10 MB |
| `operationTypeKey` | `string` | Required; non-empty after trim |
| `movementType` | `string` | Required; non-empty after trim |
| `sourceType` | `string` | Required; non-empty after trim |
| `sourceId` | `string` | Required; non-empty after trim |
| `sourceChannel` | `string` | Required; non-empty after trim |

### XlsxUploadModalState (local modal component state)

```typescript
interface XlsxUploadModalState {
  form:       XlsxUploadForm;
  loading:    boolean;
  formError:  string | null;
}

const INITIAL_FORM: XlsxUploadForm = {
  file: null,
  operationTypeKey: '',
  movementType: '',
  sourceType: '',
  sourceId: '',
  sourceChannel: '',
};
```

## Multipart Form Payload (sent to API)

The form is serialized to `FormData` before submission. Field names must match the API contract exactly:

| FormData key | Source field | Type sent |
|--------------|-------------|-----------|
| `file` | `form.file` | `File` (binary) |
| `OperationTypeKey` | `form.operationTypeKey` | `string` |
| `MovementType` | `form.movementType` | `string` |
| `SourceType` | `form.sourceType` | `string` |
| `SourceId` | `form.sourceId` | `string` |
| `SourceChannel` | `form.sourceChannel` | `string` |

> **Note**: Field name casing (`OperationTypeKey` vs `operationTypeKey`) must match the backend endpoint contract exactly. Verify against the OpenAPI spec for `POST /api/batches/xlsx` before implementation.

## Validation Constants

```typescript
const XLSX_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const XLSX_ACCEPT    = '.xlsx';
```

## Existing Types Reused (no changes)

- `ApiBatchListItem` — the refreshed batch list after successful upload reuses this type from `src/api/types.ts`
- `ApiBatchListResponse` — returned by `batchesApi.list()` after success
