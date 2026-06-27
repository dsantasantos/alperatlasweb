# UI Contracts: Component Props & Behavior

**Contract Version**: 1.0 | **Date**: 2026-06-27

These contracts define the typed interface between parent orchestration and child
components. All components are domain-blind: they receive schema-derived data, never
hardcoded field names or labels.

---

## OccurrenceGrid

Renders the triage list of occurrences as a schema-driven table.

```ts
interface OccurrenceGridProps {
  schema: OperationSchema;          // drives columns
  occurrences: Occurrence[];
  onSelect: (id: string) => void;
  selectedId?: string;
}
```

**Behavior**:
- Columns derived from `schema.fields` sorted by `displayOrder`.
- Row severity badge derived from the highest-severity `Validation` on the occurrence.
- Conforming occurrences (no `erro` or `aviso`) are collapsed by the triage wrapper
  (not hidden by this component; controlled via the `occurrences` prop).

---

## OccurrenceDetail

Renders the full detail panel for a selected occurrence.

```ts
interface OccurrenceDetailProps {
  schema: OperationSchema;
  occurrence: Occurrence;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onFieldChange: (fieldKey: string, value: string) => void;
  showProvenance: boolean;
  onToggleProvenance: () => void;
}
```

**Behavior**:
- Fields rendered in `displayOrder` order, grouped by `schema.fields[*].group`.
- `onApprove` affordance is **disabled** when `hasBlockingError(occurrence) === true`.
- `onReject` affordance opens a reason-input modal before calling the callback.
- Provenance toggle controls the `showProvenance` prop; must be keyboard-accessible.

---

## TriagePanel

Controls triage filters; does not render occurrences itself.

```ts
interface TriagePanelProps {
  occurrences: Occurrence[];
  filters: TriageFilters;
  onChange: (filters: TriageFilters) => void;
}

interface TriageFilters {
  showOnlyPending: boolean;
  hideConforming: boolean;
  destinationId?: string;
}
```

**Behavior**:
- `hideConforming` collapses occurrences with no `erro`/`aviso` validations and shows
  a count badge ("N conformes ocultadas").
- `showOnlyPending` filters to `status === 'pendente'` only.

---

## FieldRenderer

Renders a single schema-defined field (label from schema, never hardcoded).

```ts
interface FieldRendererProps {
  definition: FieldDefinition;    // label, dataType, displayHint from schema
  value: FieldValue;              // value + provenance
  onChange: (v: string) => void;
  showProvenance: boolean;
  readOnly?: boolean;
}
```

**Behavior**:
- Label is always `definition.label` — never a hardcoded string.
- `displayHint === 'mono'` → apply mono font.
- `displayHint === 'full-width'` → span two grid columns.
- `provenance.transform === 'Ambígua'` → show ambiguous-provenance warning badge.
- `showProvenance && provenance.sourceColumn !== '—'` → render provenance chip.

---

## ValidationDimension

Renders a grouped set of validations for one dimension.

```ts
interface ValidationDimensionProps {
  title: string;
  hint: string;
  items: Validation[];
}
```

**Behavior**:
- Empty `items` → render "Sem apontamentos" with shield icon.
- `severity === 'erro'` → red badge; `'aviso'` → amber; `'info'` → blue.
- Rule cascade rendered when `validation.rule` is present.

---

## Pure Helper Functions

```ts
// Returns true if any validation blocks approval.
function hasBlockingError(occurrence: Occurrence): boolean {
  return occurrence.validations.some(v => v.severity === 'erro');
}

// Maps FieldDefinition[] to render-ordered columns.
function toColumns(fields: FieldDefinition[]): FieldDefinition[] {
  return [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
}

// Filters occurrences by triage rules.
function applyTriageFilters(
  occurrences: Occurrence[],
  filters: TriageFilters
): { visible: Occurrence[]; hiddenCount: number } { ... }
```
