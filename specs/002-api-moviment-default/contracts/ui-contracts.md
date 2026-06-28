# UI Contracts: CadastralMovimentDefaut Components

**Contract Version**: 3.0 | **Date**: 2026-06-27 | **Last Updated**: 2026-06-28

---

## AuditDiaryPanel

```ts
interface AuditDiaryPanelProps {
  entries: ApiBatchAuditEntry[];
  loading: boolean;
  error: boolean;
  collapsed: boolean;
  onToggle: () => void;
}
```

Renders at the top of the screen, above the occurrence table. Collapsed/expanded by
the analyst via `onToggle`; defaults to expanded. When `loading` is true, shows a
skeleton or spinner. When `error` is true, shows an error message (the table still
renders). Entries are displayed in the order returned by the API.

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
  onCheckAll: () => void;                 // called by header checkbox
  onOpen: (id: string) => void;
  onBatchApprove: (ids: string[]) => void;
  onBatchReject: (ids: string[], reason: string) => void;
  onBatchDisable: (ids: string[]) => void;
}
```

Renders columns in this order:
1. Checkbox column (header checkbox is the select-all control — supports checked,
   unchecked, and indeterminate states).
2. Fixed `movementType` column (first data column) — displays "New", "Edit", or "Remove".
3. Dynamic columns: one `<th>` per `schema` field, sorted ascending by `displayOrder`,
   using `displayLabel` as the header text.
4. Fixed "Conferência" column (penultimate).
5. Fixed "Status" column (last).

Batch action bar (approve / reject / disable buttons) is rendered above or below the
table and is disabled/hidden when `checked.size === 0`.

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
`movementType` cell (`r.movementType`) is always the first data cell; if absent,
renders blank. Fixed-column cells ("Conferência", "Status") are always rendered last
regardless of schema.

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
  onUpdate: (updated: ApiOccurrenceDetail) => void;  // after API action or note POST
  flash: (k: 'ok' | 'warn' | 'info', m: string) => void;
}
```

Layout (top to bottom):
1. Schema-driven edit form — one input per schema field in ascending `displayOrder`.
   Input control type from `resolveInputType(field.dataType)`. All fields editable.
2. Visible divider.
3. `NotesSection` — renders embedded `detail.notes`, newest-last; includes note input.

Drawer handles field editing (PATCH), approve, and disable internally.
Reject opens a child `RejectModal`.
After a successful note POST, `onUpdate` is called with the re-fetched detail
(which contains the refreshed `notes[]`).

---

## NotesSection

```ts
interface NotesSectionProps {
  occurrenceId: string;
  notes: ApiOccurrenceNote[];          // from ApiOccurrenceDetail.notes
  onNoteAdded: (updated: ApiOccurrenceDetail) => void;  // re-fetched detail after POST
  flash: (k: 'ok' | 'warn' | 'info', m: string) => void;
}
```

Renders the "Histórico · auditoria e diário" section below the form divider.
Displays each note (`text`, `authorId`, `createdAt`) in chronological order.
Includes a textarea and submit button. Submit button is disabled when textarea is
empty. On successful POST, calls `onNoteAdded` with the updated occurrence detail.

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
