# Feature Specification: CadastralMovimentDefaut — API-Connected Screen

**Feature Branch**: `002-api-moviment-default`

**Created**: 2026-06-27

**Last Updated**: 2026-06-27

**Status**: Updated

**Input**: Create a CadastralMovimentDefaut.tsx screen identical in structure to
CadastralMoviment.tsx, in the same folder, but fed by real backend API endpoints.
API calls must be organized in dedicated files per the constitution. The existing
CadastralMoviment.tsx must remain untouched.

**Update (2026-06-27)**: The table columns and all form fields in the edit drawer must
be fully dynamic. The schema that drives them comes from `GET /api/schemas/cadastral-movement`.
The "Conferência" and "Status" columns are pinned and appear in every table regardless
of the schema response.

## User Scenarios & Testing

### User Story 1 — Analyst Reviews Batch Occurrences (Priority: P1)

The analyst opens the app and sees the list of batches on the left rail. They select a
batch and see its occurrences in a sortable table. The table columns — except for the
fixed "Conferência" and "Status" columns — are derived at runtime from the schema
returned by the schemas endpoint for the `cadastral-movement` operation type.
Occurrences with errors appear first.

**Why this priority**: This is the primary workflow. Nothing else works without it.

**Independent Test**: Can be fully tested by selecting a batch from the rail and
confirming occurrences load from the API with schema-driven column labels matching the
`GET /api/schemas/cadastral-movement` response, with "Conferência" and "Status" always present.

**Acceptance Scenarios**:

1. **Given** the user is on the CadastralMovimentDefaut screen, **When** the page
   loads, **Then** the batch list is populated from `GET /api/batches` and the first
   batch is selected automatically.
2. **Given** the schemas endpoint responds for `cadastral-movement`, **When** the table
   renders, **Then** each column header (except "Conferência" and "Status") corresponds
   to a field definition returned by `GET /api/schemas/cadastral-movement` — no column
   header is hardcoded.
3. **Given** occurrences are loaded, **When** they render, **Then** occurrences with
   blocking errors appear first (sorted by `hasBlockingErrors`).
4. **Given** the schemas endpoint response changes (e.g., a field is added or removed),
   **When** the table renders, **Then** the columns reflect the updated schema without
   any code change.

---

### User Story 2 — Analyst Inspects and Edits an Occurrence (Priority: P2)

The analyst clicks an occurrence row to open the detail drawer. They see all fields
with labels from the schema returned by `GET /api/schemas/cadastral-movement`, provenance on demand, and
validation messages. Every field in the form — label, order, and type — is driven by
the schema. They can edit a field and save — validations recompute automatically.

**Why this priority**: Core review action — allows correcting data before approval.

**Independent Test**: Click a row → drawer opens → verify that form field labels and
order match the `GET /api/schemas/cadastral-movement` response → edit a field → save → validations
update from API response.

**Acceptance Scenarios**:

1. **Given** the drawer is open, **When** the occurrence detail loads from
   `GET /api/occurrences/{id}`, **Then** fields are rendered in the order and with the
   labels specified by the schema returned by `GET /api/schemas/cadastral-movement`.
2. **Given** a field is edited and saved, **When** `PATCH /fields/{key}` responds,
   **Then** the drawer reflects updated validations without a full reload.
3. **Given** a blocking error exists, **When** the drawer footer renders, **Then**
   the Approve button is disabled.
4. **Given** a field is present in the schema but absent in the occurrence data, **When**
   the drawer renders, **Then** that field is shown as empty/blank, not omitted.

---

### User Story 3 — Analyst Approves, Rejects, or Disables (Priority: P2)

From the drawer or via multi-select, the analyst approves, rejects (with reason), or
disables occurrences. Changes are reflected immediately in the table.

**Why this priority**: This is the decision-making action the cockpit exists to support.

**Independent Test**: Approve one occurrence → status updates to Approved in table.

**Acceptance Scenarios**:

1. **Given** no blocking errors, **When** Approve is clicked, **Then**
   `POST /approve` is called and the row updates to "Aprovado".
2. **Given** Reject is clicked, **When** the reason modal confirms, **Then**
   `POST /reject` is called with the reason and the row updates to "Rejeitado".
3. **Given** Disable is clicked, **When** confirmed, **Then**
   `POST /disable` is called and the row updates to "Desabilitado".

---

### User Story 4 — Analyst Exports Approved Occurrences (Priority: P3)

The analyst clicks Export and the browser downloads an XLSX file containing all
approved occurrences of the selected batch.

**Why this priority**: Final step of the batch workflow; follows approval.

**Independent Test**: Approve at least one occurrence → click Export → XLSX downloads.

**Acceptance Scenarios**:

1. **Given** at least one approved occurrence exists, **When** Export is clicked,
   **Then** `GET /api/batches/{id}/export` is called and the browser downloads XLSX.
2. **Given** no approved occurrences exist, **When** Export is clicked, **Then**
   the user sees a warning message.

---

### Edge Cases

- What happens when the API returns 401 (token expired)? Show an auth error banner.
- What happens when the batch has zero occurrences? Show empty state message.
- What happens when a PATCH/POST action fails (network error)? Show toast with error.
- What happens when the schemas endpoint is unreachable? Show a loading error and
  prevent the table from rendering with fallback/hardcoded columns.
- What happens when the schema returns zero dynamic fields? The table still shows the
  fixed "Conferência" and "Status" columns.

## Requirements

### Functional Requirements

- **FR-001**: Screen MUST load batch list from `GET /api/batches` on mount.
- **FR-002**: Screen MUST load occurrence list from `GET /api/batches/{id}` on batch
  selection.
- **FR-003**: On screen mount (once), the UI MUST fetch field definitions from
  `GET /api/schemas/cadastral-movement` before
  rendering the table or any edit form. No column header or form field label may be
  hardcoded anywhere in the component tree.
- **FR-004**: Table columns MUST be generated dynamically from the schema response
  (FR-003), in the order specified by the schema. The "Conferência" and "Status"
  columns MUST always appear as the **last two columns** (in that order), after all
  dynamic schema-driven columns. They are NOT driven by the schema and are rendered
  regardless of the schema content.
- **FR-005**: Edit form fields (labels, order, and presence) in the detail drawer MUST
  be generated dynamically from the same schema response (FR-003). If a new field is
  added to the schema, it appears in the form automatically; if a field is removed from
  the schema, it disappears from the form automatically — no code change required. All
  schema-driven fields are editable; there is no read-only field concept in the form.
- **FR-005a**: The form renderer MUST map each field's `dataType` to an input control
  as follows: fields with `dataType` of `date` or `datetime` render as a date picker
  input; all other `dataType` values render as a plain text input. No other control
  types are required.
- **FR-006**: Detail drawer MUST fetch occurrence data from `GET /api/occurrences/{id}`
  when an occurrence is opened.
- **FR-007**: Field edits MUST call `PATCH /api/occurrences/{id}/fields/{key}`.
- **FR-008**: Approve action MUST call `POST /api/occurrences/{id}/approve`.
- **FR-009**: Reject action MUST call `POST /api/occurrences/{id}/reject` with reason.
- **FR-010**: Disable action MUST call `POST /api/occurrences/{id}/disable`.
- **FR-011**: Export MUST call `GET /api/batches/{id}/export` and trigger XLSX download.
- **FR-012**: API calls MUST be organized in `src/api/` files, one per resource group.
- **FR-013**: API types MUST mirror the backend contract with no `any`.
- **FR-014**: The original `CadastralMoviment.tsx` MUST NOT be modified.

### Key Entities

- **ApiBatch**: Top-level grouping returned by `GET /api/batches`.
- **ApiOccurrence**: List-level occurrence item with `hasBlockingErrors` and
  `validationSummary`.
- **ApiOccurrenceDetail**: Full detail occurrence with all fields and validations.
- **ApiSchema**: Field definitions returned by `GET /api/schemas/cadastral-movement`.
  Each field definition supplies at minimum: a key, a display label, a display
  order, and a data type. This is the authoritative source for column headers and form
  field rendering.
- **FixedColumn**: A UI concept — the "Conferência" and "Status" columns that are always
  rendered independently of the `ApiSchema` response.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Batch list renders within 2 seconds of page mount on a local network.
- **SC-002**: Table column headers (excluding "Conferência" and "Status") exactly match
  the field display labels from `GET /api/schemas/cadastral-movement`
  — verified by comparing rendered header text to the API response.
- **SC-003**: Edit form fields in the drawer (labels, count, and order) exactly match
  the field definitions from `GET /api/schemas/cadastral-movement` — verified by comparing
  rendered form structure to the API response.
- **SC-004**: Adding or removing a field in the schema response causes the table column
  and form field to appear or disappear without any code change — verified by mocking
  a modified schema response and confirming the UI adapts.
- **SC-005**: "Conferência" and "Status" columns are present in the rendered table
  regardless of the schema content — verified by rendering with a schema that does not
  include those field names.
- **SC-006**: Approve/reject/disable actions round-trip to the API and update the row
  status without a full page refresh.
- **SC-007**: Zero hardcoded field labels in `CadastralMovimentDefaut.tsx` or its
  sub-components (excluding the two fixed column labels "Conferência" and "Status").

## Assumptions

- The API base URL is provided via an environment variable.
- The auth token is available in the in-memory token store (set by a login flow).
- The schemas endpoint is `GET /api/schemas/cadastral-movement` (path parameter, confirmed).
- The schemas endpoint uses a **path parameter**: `GET /api/schemas/cadastral-movement`.
- The schema is fetched **once on screen mount** and cached in component state for the
  lifetime of that screen session. No re-fetching occurs on batch selection. A page
  reload is the expected recovery path if the schema changes mid-session.
- The schema response includes at minimum: `key`, `displayLabel`, `displayOrder`, and
  `dataType` per field.
- The "Conferência" column maps to the `hasBlockingErrors` / conference status of the
  occurrence; "Status" maps to the approval/rejection/disabled state.
- Per the constitution, no application state is persisted in `localStorage` or
  `sessionStorage`.

## Clarifications

### Session 2026-06-27

- Q: What is the exact URL format for the schemas endpoint? → A: Path parameter — `GET /api/schemas/cadastral-movement`
- Q: How should schema `dataType` values map to edit form input controls? → A: `date`/`datetime` → date picker; all other types → plain text input
- Q: Should the schema be re-fetched on each batch selection or cached? → A: Fetch once on screen mount; cache for the session; page reload to recover from schema changes
- Q: Where should the fixed "Conferência" and "Status" columns appear in the table? → A: Last two columns (rightmost), after all dynamic schema-driven columns
- Q: Should schema fields in the edit drawer have a read-only state? → A: No — all schema-driven fields are always editable
