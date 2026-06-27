# Data Model: CadastralMovimentDefaut — API Types

**Branch**: `002-api-moviment-default` | **Date**: 2026-06-27

All types live in `src/api/types.ts` and mirror the API Atlas v1 contract.

---

## 1. Schema Types

```ts
// Key used to build the schema-driven label map and order fields.
interface ApiBatchSchemaField {
  key: string;          // Field identifier, e.g. "cpf", "nome"
  displayLabel: string; // Canonical label to show — NEVER hardcode
  displayOrder: number; // Ascending order for columns/field groups
}

// Embedded in ApiBatchDetail; drives all rendering.
interface ApiBatchSchema {
  displayName: string;
  fields: ApiBatchSchemaField[];
}

// Full schema from GET /api/schemas/{key} — includes validation metadata.
interface ApiSchemaField extends ApiBatchSchemaField {
  isRequired: boolean;
  typeHint: string; // "text" | "cpf" | "cnpj" | "date" | "enum" | "numeric"
}

interface ApiSchemaFull {
  operationTypeKey: string;
  displayName: string;
  validationRuleKeys: string[];
  fields: ApiSchemaField[];
}
```

---

## 2. Batch Types

```ts
// Item in GET /api/batches list response.
interface ApiBatchListItem {
  batchId: string;
  operationTypeKey: string;
  sourceType: string;
  sourceId: string;
  sourceChannel: string;
  state: string;        // Batch-level state, e.g. "Received" | "Dispatched"
  receivedAt: string;   // ISO 8601
  occurrenceCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

// Full batch from GET /api/batches/{id} — includes schema and occurrences.
interface ApiBatchDetail {
  batchId: string;
  operationTypeKey: string;
  sourceType: string;
  sourceId: string;
  sourceChannel: string;
  state: string;
  receivedAt: string;
  schema: ApiBatchSchema;          // Schema for generic rendering
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
  hasBlockingErrors: boolean;  // Pre-computed: any Capture+Error validation
  fields: ApiOccurrenceField[];
  validationSummary: {
    errorCount: number;
    warningCount: number;
  };
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

| `ApiBatchSchemaField` property | Render use |
|-------------------------------|------------|
| `displayLabel` | Table column header; field label in drawer |
| `displayOrder` | Sort order for columns and field groups |
| (key inference) `cpf`, `cnpj`, `matricula` | Mono font hint (by key pattern) |

Note: Full type hints (`typeHint` from `ApiSchemaFull`) are available if a separate
schema fetch is added via `schemasApi.get(operationTypeKey)`.
