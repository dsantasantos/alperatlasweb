# Data Model: CadastralMovimentDefaut — API Types

**Branch**: `002-api-moviment-default` | **Date**: 2026-06-27 | **Last Updated**: 2026-06-28

All types live in `src/api/types.ts` and mirror the API Atlas v1 contract.

---

## 1. Schema Types

The primary schema comes from `GET /api/schemas/cadastral-movement` and is the
authoritative source for all column headers and form field rendering.

```ts
// Full schema field from GET /api/schemas/cadastral-movement.
// dataType drives the input control in the edit form (FR-005a).
interface ApiSchemaField {
  key: string;           // Field identifier, e.g. "cpf", "nome"
  displayLabel: string;  // Canonical label to show — NEVER hardcode
  displayOrder: number;  // Ascending order for columns/field groups
  dataType: string;      // "text" | "date" | "datetime" | "cpf" | "cnpj" | "numeric" | "enum"
  isRequired: boolean;
}

// Top-level response from GET /api/schemas/cadastral-movement.
interface ApiSchema {
  operationTypeKey: string;  // "cadastral-movement"
  displayName: string;
  validationRuleKeys: string[];
  fields: ApiSchemaField[];
}
```

**Input control mapping (FR-005a)**:

| `dataType` | Rendered input |
|------------|----------------|
| `"date"` | `<input type="date">` |
| `"datetime"` | `<input type="datetime-local">` |
| Any other | `<input type="text">` |

**Fixed columns** (not in schema, always rendered at fixed positions):

| Column | Position | Source |
|--------|----------|--------|
| movementType | First | `ApiOccurrenceListItem.movementType` ("New" \| "Edit" \| "Remove") |
| Conferência | Penultimate | `hasBlockingErrors` / conference validation state |
| Status | Last | `state` string mapped via `stateMeta()` |

---

## 2. Batch Types & Audit

### Batch audit entry (GET /api/batches/{id}/audit)

```ts
// One entry from GET /api/batches/{id}/audit.
// Rendered in the collapsible diary panel at the top of the screen.
interface ApiBatchAuditEntry {
  changedAt: string;    // ISO 8601
  changeType: string;   // e.g. "Created" | "Dispatched" | "Approved" | etc.
  actorId: string;
  description: string;
}
```

### Batch list and detail

```ts
// Item in GET /api/batches list response.
interface ApiBatchListItem {
  batchId: string;
  operationTypeKey: string;
  sourceType: string;
  sourceId: string;
  sourceChannel: string;
  state: string;          // Batch-level state, e.g. "Received" | "Dispatched"
  receivedAt: string;     // ISO 8601
  occurrenceCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

// Full batch from GET /api/batches/{id} — includes occurrences only.
// Note: any inline schema in this response is IGNORED; use ApiSchema from
// GET /api/schemas/cadastral-movement as the authoritative source.
interface ApiBatchDetail {
  batchId: string;
  operationTypeKey: string;
  sourceType: string;
  sourceId: string;
  sourceChannel: string;
  state: string;
  receivedAt: string;
  occurrences: {
    items: ApiOccurrenceListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
}

// Progress counters from GET /api/batches/{id}/summary.
interface ApiBatchSummary {
  batchId: string;
  pending: number;
  approved: number;
  rejected: number;
  disabled: number;
  error: number;
  warning: number;
}
```

---

## 3. Occurrence Types

```ts
// Field value as returned in list and detail responses.
interface ApiFieldProvenance {
  state: string;        // "Automatic" | "Manual"
  description: string;  // Human-readable source description
}

interface ApiOccurrenceField {
  key: string;
  value: string;
  originalValue: string | null;  // Present when field was edited
  lastEditedBy: string | null;
  lastEditedAt: string | null;
  provenance: ApiFieldProvenance;
}

// Occurrence as it appears in the batch list (summary level).
interface ApiOccurrenceListItem {
  occurrenceId: string;
  sourceRecordId: string;
  state: string;               // "Pending" | "Approved" | "Rejected" | "Disabled"
  movementType: string;        // "New" | "Edit" | "Remove" — rendered as first column
  hasBlockingErrors: boolean;  // Pre-computed: any Capture+Error validation
  fields: ApiOccurrenceField[];
  validationSummary: {
    errorCount: number;
    warningCount: number;
  };
}

// A note embedded in the occurrence detail.
// Submitted via POST /api/occurrences/{id}/notes; no separate listing endpoint.
interface ApiOccurrenceNote {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;  // ISO 8601
}

// Full occurrence from GET /api/occurrences/{id}.
interface ApiOccurrenceDetail {
  occurrenceId: string;
  batchId: string;
  sourceRecordId: string;
  state: string;
  rejectionReason: string | null;
  fields: ApiOccurrenceField[];
  validations: ApiValidation[];
  notes: ApiOccurrenceNote[];  // Embedded; may be empty array
}

// Individual validation from the detail response.
interface ApiValidation {
  ruleKey: string;
  dimension: string;  // "Capture" | "Movement"
  severity: string;   // "Error" | "Warning" | "Info"
  message: string;
  fieldKey: string;
}
```

---

## 4. State Transitions (Occurrence)

```
Pending ──approve──► Approved
        ──reject───► Rejected  (reason required)
        ──disable──► Disabled
```

Guards:
- `approve` is blocked when `hasBlockingErrors === true` (any Capture+Error validation)
- `reject` requires a non-empty `reason` string
- Once `Approved`, `Rejected`, or `Disabled`, the occurrence is read-only in the UI

---

## 5. Schema → Render Mapping

| `ApiSchemaField` property | Render use |
|--------------------------|------------|
| `displayLabel` | Table column header (`<th>`); field label in drawer |
| `displayOrder` | Ascending sort for columns and field groups |
| `dataType` | Input control in edit drawer: `date`/`datetime` → date picker; else text |
| `isRequired` | Not used for UI read-only gating (all fields editable); available for future validation hints |

**Column render order**:
1. `movementType` column (fixed, first) — value from `ApiOccurrenceListItem.movementType`
2. Dynamic columns from `ApiSchema.fields`, sorted ascending by `displayOrder`
3. "Conferência" column (fixed, penultimate)
4. "Status" column (fixed, last)
