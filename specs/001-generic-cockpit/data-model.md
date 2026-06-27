# Data Model: Alper Atlas Frontend — Generic Cockpit

**Branch**: `001-generic-cockpit` | **Date**: 2026-06-27

All types below are expressed as TypeScript interfaces. These mirror the backend API
contract and MUST NOT diverge from it (divergence is a defect per Principle IV).
Source file: `src/types/` (one file per domain group).

---

## 1. Schema Domain (`src/types/schema.ts`)

The schema drives generic rendering. The frontend iterates schema fields; it never
hardcodes labels, order, or validation rules.

```ts
// CONTRACT VERSION: 1.0

export type FieldDataType =
  | 'text'
  | 'cpf'
  | 'cnpj'
  | 'date'
  | 'date-month'   // competencia: YYYY-MM
  | 'enum'
  | 'numeric';

export type FieldDisplayHint =
  | 'default'
  | 'mono'         // monospaced font (codes, IDs, dates)
  | 'full-width';  // spans two grid columns

export interface FieldDefinition {
  key: string;                 // internal key, never shown to analyst
  label: string;               // canonical display label (schema-supplied)
  group: string;               // display group heading
  dataType: FieldDataType;
  displayHint: FieldDisplayHint;
  displayOrder: number;        // ascending; drives column/field order
  enumValues?: string[];       // populated when dataType === 'enum'
  required: boolean;
}

export interface OperationSchema {
  version: string;             // schema version from backend
  operationType: string;       // e.g., 'beneficiario-movimentacao'
  fields: FieldDefinition[];   // ordered by displayOrder ascending
}
```

---

## 2. Batch Domain (`src/types/batch.ts`)

A batch (lote) is the top-level grouping of occurrences for a given client/period.

```ts
// CONTRACT VERSION: 1.0

export interface DiaryEntry {
  id: string;
  origin: 'system' | 'human';
  author: string;
  when: string;             // ISO 8601
  text: string;
}

export interface Batch {
  id: string;
  clientName: string;
  period: string;           // YYYY-MM
  source: string;           // e.g., 'Planilha (e-mail)', 'API (SFTP)'
  pendingCount: number;
  errorCount: number;
  diary: DiaryEntry[];
}
```

---

## 3. Occurrence Domain (`src/types/occurrence.ts`)

An occurrence (movimentação) is a single change record within a batch.

```ts
// CONTRACT VERSION: 1.0

export type OccurrenceType = 'Inclusão' | 'Exclusão' | 'Alteração';

export type OccurrenceStatus =
  | 'pendente'
  | 'aprovado'
  | 'rejeitado'
  | 'exportado'
  | 'confirmado'
  | 'recusado'
  | 'desabilitado';

export interface Destination {
  name: string;
  kind: 'operadora' | 'seguradora';
}

export interface FieldDelta {
  fieldKey: string;
  from: string;
  to: string;
}

export interface Occurrence {
  id: string;
  batchId: string;
  type: OccurrenceType;
  status: OccurrenceStatus;
  destination: Destination;
  beneficiaryKey: string;      // internal identifier (never shown directly)
  fields: Record<string, FieldValue>;
  validations: Validation[];
  timeline: TimelineEvent[];
  coreEffect?: string;
  coreApplied?: boolean;
  delta?: FieldDelta;
  compensatesId?: string;      // links to the occurrence this one compensates
}
```

---

## 4. Field & Provenance Domain (`src/types/field.ts`)

Provenance (origem) is shown on demand in the detail view — never as primary structure.

```ts
// CONTRACT VERSION: 1.0

export type ProvenanceTransform =
  | 'Direta'      // direct copy from source column
  | 'Inferida'    // inferred / derived
  | 'Ambígua';    // multiple candidate sources

export interface Provenance {
  sourceColumn: string;        // '—' when derived without a source
  transform: ProvenanceTransform;
  sourceLine: number | null;
  candidates: string[] | null; // populated only when transform === 'Ambígua'
}

export interface FieldValue {
  value: string;
  provenance: Provenance;
}
```

---

## 5. Validation Domain (`src/types/validation.ts`)

```ts
// CONTRACT VERSION: 1.0

export type ValidationDimension = 'captura' | 'movimentacao';
export type ValidationSeverity  = 'erro' | 'aviso' | 'info';

export interface RuleLayer {
  level: string;
  value: string;
  state: 'vigente' | 'sobreposta';
}

export interface ValidationRule {
  name: string;
  layers: RuleLayer[];
  result: string;
}

export interface Validation {
  dimension: ValidationDimension;
  severity:  ValidationSeverity;
  message:   string;
  fieldKey?: string;
  coreEffect?: string;
  rule?: ValidationRule;
}
```

Key invariant: an occurrence with any `severity === 'erro'` validation MUST NOT allow
the approve affordance (Principle VII; enforced by `hasBlockingError` helper).

---

## 6. Timeline Domain (`src/types/timeline.ts`)

```ts
// CONTRACT VERSION: 1.0

export type TimelineOrigin  = 'system' | 'human';
export type TimelineEntryType = 'state' | 'field' | 'note' | 'core';

export interface TimelineEvent {
  id: string;
  origin: TimelineOrigin;
  type: TimelineEntryType;
  author: string;
  when: string;     // ISO 8601
  text: string;
  from?: string;    // populated when type === 'field'
  to?: string;
}
```

---

## 7. Export Artifact Domain (`src/types/artifact.ts`)

```ts
// CONTRACT VERSION: 1.0

export interface ExportArtifact {
  id: string;
  period: string;           // YYYY-MM
  layout: string;           // destination-specific layout identifier
  createdAt: string;        // ISO 8601
  filename: string;
  occurrenceCount: number;
}
```

---

## 8. Session Domain (`src/types/session.ts`)

```ts
// CONTRACT VERSION: 1.0

export interface Session {
  name: string;
  role: string;
}
```

---

## State Transitions

### Occurrence Status Flow

```
pendente ──approve──► aprovado ──export──► exportado ──confirm──► confirmado
         ──reject───► rejeitado
aprovado ──(no op)─── [cannot un-approve without reject flow]
```

Guard rules:
- `approve` action disabled when any validation has `severity === 'erro'`
- `reject` action requires a non-empty reason string
- `exportado` → `confirmado` is a destination-side confirmation action
- `desabilitado` is a terminal state set by the system (e.g., compensated occurrence)

---

## Schema-to-Render Mapping

The `schema/` layer maps each `FieldDefinition` to render decisions:

| FieldDefinition property | Render decision |
|--------------------------|-----------------|
| `label` | Column header / field label (canonical only) |
| `displayOrder` | Column position in grid; field order in detail |
| `displayHint === 'mono'` | Apply monospace font class |
| `displayHint === 'full-width'` | Span two grid columns in detail |
| `dataType === 'enum'` + `enumValues` | Render select control in edit mode |
| `required === true` | Show required indicator; validate on submit |
| `group` | Group heading in detail view |
