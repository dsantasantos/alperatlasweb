# UI Contracts: Limit Moviment Default Table Columns

## Table Column Contract

The table MUST render columns in this fixed order:

```
[checkbox] | Tipo | <dynamic fields 1..N, N ≤ 5> | Conferência | Status | [chevron]
```

- `N = min(schema.fields.length, 5)`
- Dynamic fields are selected by ascending `displayOrder`; the first `N` by that order appear

### CSS Grid Layout

```
minmax(38px,.28fr)   — checkbox
minmax(88px,.72fr)   — Tipo (fixed)
[N × minmax(100px,1fr)]  — dynamic fields (N = tableSchema.length, ≤ 5)
minmax(110px,.9fr)   — Conferência (fixed)
minmax(100px,.8fr)   — Status (fixed)
minmax(32px,.25fr)   — chevron
```

Fallback (N = 0): replaces the `N × minmax(100px,1fr)` block with a single `minmax(120px,1fr)`.

## Modal (Drawer) Field Contract

The Drawer MUST render ALL schema fields in ascending `displayOrder`, regardless of the table column cap. No limit applies inside the modal.

## Row Component Interface

```typescript
interface RowProps {
  r: ApiOccurrenceListItem;
  schema: ApiSchemaField[];  // MUST receive tableSchema (≤ 5 fields), not full schema
  checked: boolean;
  onCheck: () => void;
  onOpen: () => void;
  gridCols?: string;
}
```

## Drawer Component Interface (unchanged)

```typescript
interface DrawerProps {
  detail: ApiOccurrenceDetail;
  schema: ApiSchemaField[];  // MUST receive full schema (all fields, no cap)
  onClose: () => void;
  onUpdate: (updated: ApiOccurrenceDetail) => void;
  flash: (k: 'ok' | 'warn' | 'info', m: string) => void;
}
```
