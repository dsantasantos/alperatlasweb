# UI Contracts: CadastralMovimentDefaut Components

**Contract Version**: 2.0 | **Date**: 2026-06-27 | **Last Updated**: 2026-06-27

---

## SummaryBar

```ts
interface SummaryBarProps {
  summary: ApiBatchSummary;
}
```

Renders progress bar (done/total %) and error/warning counts.
No action affordances. Read-only display.

---

## OccurrenceTable

```ts
interface OccurrenceTableProps {
  schema: ApiSchemaField[];               // from GET /api/schemas/cadastral-movement
  occurrences: ApiOccurrenceListItem[];
  checked: Set<string>;
  onCheck: (id: string) => void;
  onCheckAll: () => void;
  onOpen: (id: string) => void;
}
```

Renders columns in this order:
1. Dynamic columns: one `<th>` per `schema` field, sorted ascending by `displayOrder`,
   using `displayLabel` as the header text.
2. Fixed "Conferência" column (penultimate).
3. Fixed "Status" column (last).

---

## Row

```ts
interface RowProps {
  r: ApiOccurrenceListItem;
  schema: ApiSchemaField[];             // for label lookup and field ordering
  checked: boolean;
  onCheck: () => void;
  onOpen: () => void;
}
```

Field values accessed via `getField(r.fields, key)`, in `displayOrder`. Row severity
class derived from `r.hasBlockingErrors` and `r.validationSummary.warningCount`.
Fixed-column cells ("Conferência", "Status") are always rendered regardless of schema.

---

## ValidationGroup

```ts
interface ValidationGroupProps {
  title: string;
  hint: string;
  items: ApiValidation[];   // filtered by dimension before passing
}
```

Used twice in the Drawer: once for `dimension === 'Capture'`, once for `'Movement'`.

---

## Drawer

```ts
interface DrawerProps {
  detail: ApiOccurrenceDetail;
  schema: ApiSchemaField[];           // from GET /api/schemas/cadastral-movement
  onClose: () => void;
  onUpdate: (updated: ApiOccurrenceDetail) => void;  // after API action
  flash: (k: 'ok' | 'warn' | 'info', m: string) => void;
}
```

Edit form renders one input per schema field, in ascending `displayOrder`.
Input control type is determined by `resolveInputType(field.dataType)`.
All schema-driven fields are editable (no read-only fields concept).
Drawer handles field editing (PATCH), approve, and disable internally.
Reject opens a child `RejectModal`.

---

## RejectModal / BulkRejectModal

```ts
interface RejectModalProps {
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

interface BulkRejectModalProps {
  count: number;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}
```

Confirm button disabled until `reason.trim()` is non-empty.

---

## Pure Helper Functions

```ts
// Get a field value from an occurrence's fields array by key.
function getField(fields: ApiOccurrenceField[], key: string): string

// Build label map from schema fields (key → displayLabel).
function makeLabel(fields: ApiSchemaField[]): Record<string, string>

// Resolve the HTML input type for a schema field's dataType.
// "date" → "date", "datetime" → "datetime-local", all others → "text"
function resolveInputType(dataType: string): 'text' | 'date' | 'datetime-local'

// Map API severity string to severity class.
function mapSev(severity: string): 'erro' | 'aviso' | 'info'

// Resolve display label and CSS class for an API state string.
function stateMeta(state: string): { l: string; c: string }
```
