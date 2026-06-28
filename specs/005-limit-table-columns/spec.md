# Feature Specification: Limit Moviment Default Table Columns

**Feature Branch**: `005-limit-table-columns`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Ajustar a tabela de Cadastral Moviment Defaut para limitar exibição de coluna. Deve ser mantido como padrão Tipo como primeira coluna e as duas últimas Conferencia e status. Dos dados dinamicos da ocorrencias exibir em tabelas apenas 5 campos no maximo. Os outros campos so poderão ser vistos na modal."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Table Shows at Most 5 Dynamic Columns (Priority: P1)

An analyst opens the Cadastral Moviment Default cockpit. The table always shows "Tipo" as the first column, followed by at most 5 occurrence fields (ordered by display order from the schema), followed by "Conferência" and "Status" as the last two columns. If the schema has more than 5 dynamic fields, the remaining fields are not shown in the table — they are only visible when the analyst opens the detail modal for a row.

**Why this priority**: The core requirement of the feature. Without column capping, all other stories are unreachable.

**Independent Test**: Open the cockpit with a schema that has more than 5 dynamic fields. Verify the table renders exactly: Tipo | field1 | field2 | field3 | field4 | field5 | Conferência | Status (plus any auxiliary columns like checkbox/chevron). This alone is a working, demonstrable outcome.

**Acceptance Scenarios**:

1. **Given** a schema with 8 dynamic fields, **When** the analyst views the table, **Then** only 5 dynamic fields appear as columns between Tipo and Conferência.
2. **Given** a schema with 3 dynamic fields, **When** the analyst views the table, **Then** all 3 dynamic fields appear (no capping needed; fewer than the maximum of 5).
3. **Given** a schema with exactly 5 dynamic fields, **When** the analyst views the table, **Then** all 5 appear — no fields are hidden.

---

### User Story 2 - Hidden Fields Accessible via Detail Modal (Priority: P2)

When the schema has more than 5 dynamic fields and the analyst opens the detail modal for a row, all fields — including those hidden from the table — are shown in the modal view.

**Why this priority**: The modal is the only place to see hidden fields; if it were broken, hidden data would be inaccessible.

**Independent Test**: With a schema of 8+ fields, open any row's modal and verify all 8+ fields are shown inside the modal, regardless of the 5-column cap on the table.

**Acceptance Scenarios**:

1. **Given** a schema with 8 dynamic fields and the table showing 5, **When** the analyst opens a row's detail modal, **Then** all 8 fields are displayed in the modal.
2. **Given** a schema with 3 dynamic fields (all visible in the table), **When** the analyst opens the detail modal, **Then** all 3 fields still appear in the modal.

---

### User Story 3 - Column Order Preserved (Priority: P3)

The 5 dynamic fields shown in the table are the first 5 fields by schema display order — not arbitrary or random selections. The visual order respects the schema's `displayOrder` attribute.

**Why this priority**: Order matters for analyst workflow; showing the wrong 5 fields would be confusing.

**Independent Test**: With a schema where fields have defined display orders (1 through 8), verify the table shows fields with display orders 1-5 and the modal additionally shows 6-8.

**Acceptance Scenarios**:

1. **Given** a schema with fields ordered 1 to 8 by display order, **When** the analyst views the table, **Then** columns correspond to fields 1 through 5 by display order.
2. **Given** the analyst opens a row detail, **Then** the modal shows all 8 fields in display order.

---

### Edge Cases

- What happens when the schema has 0 dynamic fields? The table should still show Tipo | Conferência | Status with no dynamic columns between them.
- What happens when the schema changes mid-session (cache refresh)? The new column cap applies to the new schema; no stale columns remain visible.
- What happens when the modal is opened for a row where some hidden fields have no value? The field is shown in the modal with an empty/dash placeholder — not hidden.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The table MUST always display "Tipo" as the first non-auxiliary column and "Conferência" and "Status" as the last two non-auxiliary columns (auxiliary: checkbox, chevron).
- **FR-002**: The table MUST display at most 5 dynamic occurrence fields between the Tipo column and the Conferência column.
- **FR-003**: Dynamic fields shown in the table MUST be selected as the first 5 by ascending schema display order.
- **FR-004**: When the schema contains more than 5 dynamic fields, fields beyond the 5th MUST NOT appear as table columns.
- **FR-005**: The detail modal MUST display all dynamic fields from the schema, including those beyond the 5-column table limit, in display order.
- **FR-006**: The table grid layout (column widths) MUST adapt to the actual number of dynamic columns shown (up to 5), maintaining the existing responsive behavior.

### Key Entities

- **Schema**: List of dynamic field definitions with `displayOrder` attribute; drives both table columns and modal fields.
- **Table Column Set**: Fixed prefix (Tipo) + up to 5 dynamic fields by display order + fixed suffix (Conferência, Status).
- **Modal Field Set**: All dynamic fields from the schema, no limit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A schema with N > 5 dynamic fields results in exactly 5 dynamic columns in the table — verifiable by counting rendered column headers.
- **SC-002**: A schema with N ≤ 5 dynamic fields results in exactly N dynamic columns in the table — all fields visible without truncation.
- **SC-003**: The detail modal for any row shows 100% of the schema's dynamic fields regardless of the table column cap.
- **SC-004**: "Tipo" is always the first dynamic/data column and "Conferência" and "Status" are always the last two data columns — verified across schemas of any size.
- **SC-005**: Column ordering in the table matches ascending display order from the schema — field with the lowest display order appears first among the 5 visible columns.

## Assumptions

- The "Tipo" column is a fixed column already rendered separately from the schema's dynamic fields; it is not one of the 5 dynamic slots.
- "Conferência" and "Status" columns are also fixed, rendered separately; they are not counted toward the 5 dynamic slots.
- The schema's `displayOrder` attribute is the sole criterion for selecting which 5 fields appear in the table; no other configuration or user preference system is introduced.
- The modal (drawer) already renders all schema fields; this feature requires only that no limit is applied in the modal — no new modal UI is needed.
- Schemas with ≤ 5 dynamic fields require no visual change; the cap is a ceiling, not a fixed count.
- Mobile/responsive behavior follows existing patterns; no new breakpoints are introduced by this feature.
