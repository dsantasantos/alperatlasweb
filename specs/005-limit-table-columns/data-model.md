# Data Model: Limit Moviment Default Table Columns

No new entities, API types, or data structures are introduced by this feature.

## Existing Entities (unchanged)

- **`ApiSchemaField`** — `{ key, displayLabel, displayOrder, dataType, isRequired }` — unchanged
- **`ApiSchema`** — `{ fields: ApiSchemaField[] }` — unchanged

## Derived Computed Values (frontend only)

| Identifier | Derived From | Purpose |
|------------|-------------|---------|
| `orderedSchema` | `schema.slice().sort((a,b) => a.displayOrder - b.displayOrder)` | All schema fields in display order — used by Drawer |
| `tableSchema` | `orderedSchema.slice(0, TABLE_COLUMN_LIMIT)` | First N fields for table headers, grid layout, Row cells |
| `TABLE_COLUMN_LIMIT` | Constant `5` | Maximum dynamic columns shown in the table |

`tableSchema` is a pure derivation — a sliced view of `orderedSchema`. It does not affect any API call, state shape, or persistence.
