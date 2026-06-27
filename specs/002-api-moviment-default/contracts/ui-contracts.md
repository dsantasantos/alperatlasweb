# UI Contracts: CadastralMovimentDefaut Components

**Contract Version**: 1.0 | **Date**: 2026-06-27

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

## Row

```ts
interface RowProps {
  r: ApiOccurrenceListItem;
  label: Record<string, string>;   // schema-derived, never hardcoded
  checked: boolean;
  onCheck: () => void;
  onOpen: () => void;
}
```

Field values accessed via `getField(r.fields, key)`. Row severity class derived from
`r.hasBlockingErrors` and `r.validationSummary.warningCount`.

---

## ValidationGroup

```ts
interface ValidationGroupProps {
  title: string;
  hint: string;
  items: ApiValidation[];         // filtered by dimension before passing
}
```

Used twice in the Drawer: once for `dimension === 'Capture'`, once for `'Movement'`.

---

## Drawer

```ts
interface DrawerProps {
  detail: ApiOccurrenceDetail;
  schema: ApiBatchSchemaField[];   // for label lookup and field ordering
  onClose: () => void;
  onUpdate: (updated: ApiOccurrenceDetail) => void;  // after API action
  flash: (k: 'ok' | 'warn' | 'info', m: string) => void;
}
```

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
function makeLabel(fields: ApiBatchSchemaField[]): Record<string, string>

// Map API severity string to severity class.
function mapSev(severity: string): 'erro' | 'aviso' | 'info'

// Resolve display label and CSS class for an API state string.
function stateMeta(state: string): { l: string; c: string }
```
