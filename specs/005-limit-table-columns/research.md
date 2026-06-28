# Research: Limit Moviment Default Table Columns

## Decision: Single-file change, no new abstractions

**Rationale**: The column rendering logic is concentrated in `CadastralMovimentDefaut.tsx`. Two computed values drive the table: `orderedSchema` (sorted schema fields, used for grid layout + `<th>` headers + `Row` schema prop) and `Row`'s internal `orderedFields` (re-sorts the same list for `<td>` cells). The `Drawer` receives the same `schema` prop and renders all fields independently.

Introducing a `TABLE_COLUMN_LIMIT = 5` constant and deriving `tableSchema = orderedSchema.slice(0, TABLE_COLUMN_LIMIT)` is sufficient. Replace `orderedSchema` with `tableSchema` everywhere it feeds the table (grid columns, `<th>` headers, `Row` schema prop, empty-row `colSpan`). Keep full `schema` for `Drawer`.

**Alternatives considered**: A configurable limit stored in the schema or fetched from the API — rejected; the spec states a fixed maximum of 5, no user configuration needed.

## Decision: Drawer requires no changes

**Rationale**: The `Drawer` component already receives the full `schema` prop and renders all fields. Since `tableSchema` is only passed to `Row` (not to `Drawer`), the modal naturally continues to show all fields. No modal UI changes are required.

## Decision: `Row` receives the capped schema

**Rationale**: `Row` sorts its `schema` prop by `displayOrder` internally via `useMemo`. Passing `tableSchema` (already the first 5 by display order) means `Row` will render at most 5 `<td>` cells. The `Row` component needs no internal changes.

## Key lines in `CadastralMovimentDefaut.tsx` affected

| Line(s) | Current | Change |
|---------|---------|--------|
| 791 | `const orderedSchema = schema.slice().sort(...)` | Add `const tableSchema = orderedSchema.slice(0, TABLE_COLUMN_LIMIT)` after |
| 794-796 | `orderedSchema.length > 0 ... orderedSchema.map(...)` | Replace `orderedSchema` with `tableSchema` in gridCols |
| 903-906 | `orderedSchema.map(sf => <th>...)` | Replace with `tableSchema.map(...)` |
| 921 | `schema={schema}` on `<Row>` | Replace with `schema={tableSchema}` |
| 930 | `colSpan={orderedSchema.length + 4}` | Replace with `colSpan={tableSchema.length + 4}` |
