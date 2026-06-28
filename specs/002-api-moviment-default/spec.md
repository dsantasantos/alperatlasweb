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

**Update (2026-06-28)**: Four enhancements added:
(1) `movementType` (New / Edit / Remove) from `/api/occurrences/` must appear as the
**first column** of the table.
(2) A batch audit diary panel must be shown at the top of the screen, consuming
`GET /api/batches/{id}/audit` (fields: `changedAt`, `changeType`, `actorId`, `description`).
(3) The occurrence detail drawer must include a notes section (Histórico · auditoria e
diário) that lists existing notes and allows the analyst to add a new note via
`POST /api/occurrences/{id}/notes` with `{ "text": "..." }`.
(4) Batch operations (approve, reject, disable) must be available for all rows selected
via the table checkboxes, each calling the corresponding batch endpoint.

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

### User Story 5 — Analyst Views Batch Audit Diary (Priority: P2)

When the analyst opens the CadastralMovimentDefaut screen for a batch, a diary panel
at the top of the screen shows the complete change history of that batch. Each entry
displays when the change happened, what type of change it was, who performed it, and
a description of the change.

**Why this priority**: Gives the analyst immediate context about the batch's history
before reviewing individual occurrences.

**Independent Test**: Load the screen for a batch → the diary panel at the top renders
entries from `GET /api/batches/{id}/audit` with `changedAt`, `changeType`, `actorId`,
and `description` visible.

**Acceptance Scenarios**:

1. **Given** the screen loads for a batch, **When** the audit endpoint responds,
   **Then** the diary panel at the top shows each audit entry with its `changedAt`,
   `changeType`, `actorId`, and `description`.
2. **Given** the batch has no audit entries, **When** the diary panel renders,
   **Then** an empty state is shown (no error, no crash).
3. **Given** a batch is selected from the rail, **When** the user switches to a
   different batch, **Then** the diary panel updates to reflect the newly selected
   batch's audit history.

---

### User Story 6 — Analyst Adds and Views Occurrence Notes (Priority: P2)

Inside the occurrence detail drawer, the analyst sees the "Histórico · auditoria e
diário" section. They can read existing notes left by themselves or colleagues, and
add a new annotation via a text input. After submitting, the new note appears in the
list immediately.

**Why this priority**: Allows analysts to communicate context, flag issues, or leave
a trail of decisions for colleagues.

**Independent Test**: Open a drawer → notes section renders → type a note → submit →
new note appears in the list from `GET /api/occurrences/{id}/notes`.

**Acceptance Scenarios**:

1. **Given** the drawer opens for an occurrence, **When** the occurrence detail loads
   from `GET /api/occurrences/{id}`, **Then** the `notes` array embedded in the
   response is rendered chronologically (each entry shows `text`, `authorId`, and
   `createdAt`).
2. **Given** the analyst types a note and submits, **When** `POST /api/occurrences/{id}/notes`
   with `{ "text": "..." }` responds successfully, **Then** the note list refreshes
   and the new note appears without closing the drawer.
3. **Given** the note input is empty, **When** the analyst attempts to submit,
   **Then** submission is prevented and a validation message is shown.
4. **Given** the notes endpoint fails, **When** the drawer renders, **Then** an error
   message is shown in the notes section and the rest of the drawer still works.

---

### User Story 7 — Analyst Performs Batch Approve / Reject / Disable (Priority: P2)

The analyst selects multiple occurrences using the table checkboxes, then triggers
a batch action (approve, reject, or disable) that applies to all selected rows in
a single operation. Rejected batches require a reason.

**Why this priority**: Processing occurrences one by one is impractical at scale;
batch actions are the primary efficiency lever for high-volume batches.

**Independent Test**: Select 3 rows via checkboxes → click "Approve all" → table
updates all 3 rows to "Aprovado" after a single `POST /api/occurrences/batch/approve`.

**Acceptance Scenarios**:

1. **Given** one or more rows are selected, **When** "Approve" is triggered,
   **Then** `POST /api/occurrences/batch/approve` is called with all selected
   `occurrenceIds` and each row updates to "Aprovado".
2. **Given** one or more rows are selected, **When** "Reject" is triggered,
   **Then** the analyst is prompted for a reason; after confirming,
   `POST /api/occurrences/batch/reject` is called with `occurrenceIds` and `reason`,
   and each row updates to "Rejeitado".
3. **Given** one or more rows are selected, **When** "Disable" is triggered,
   **Then** `POST /api/occurrences/batch/disable` is called with all selected
   `occurrenceIds` and each row updates to "Desabilitado".
4. **Given** no rows are selected, **When** the batch action controls render,
   **Then** the batch action buttons are disabled or hidden.
5. **Given** the analyst clicks the header checkbox with no rows selected, **When**
   it toggles, **Then** all visible rows become selected and the header checkbox
   appears checked.
6. **Given** all rows are selected and the analyst clicks the header checkbox, **When**
   it toggles, **Then** all rows are deselected.
5. **Given** a batch action partially fails (some IDs rejected by API), **When** the
   response arrives, **Then** successfully processed rows update and failed rows
   remain unchanged; a summary error toast is shown.

---

### Edge Cases

- What happens when the API returns 401 (token expired)? Show an auth error banner.
- What happens when the batch has zero occurrences? Show empty state message.
- What happens when a PATCH/POST action fails (network error)? Show toast with error.
- What happens when the schemas endpoint is unreachable? Show a loading error and
  prevent the table from rendering with fallback/hardcoded columns.
- What happens when the schema returns zero dynamic fields? The table still shows the
  fixed "Conferência" and "Status" columns.
- What happens when the audit endpoint is unreachable? Show an error state in the
  diary panel; the rest of the screen still works.
- What happens when a batch action is triggered on a very large selection? The UI
  must remain responsive; a loading indicator is shown until the API responds.
- What happens when the occurrence notes list is empty? Show an empty state (no crash).
- What happens when the `movementType` field is absent in an occurrence? The cell
  renders as blank, not as an error.

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
  (FR-003), in the order specified by the schema. The `movementType` column MUST
  always appear as the **first column**, before all dynamic schema-driven columns.
  The "Conferência" and "Status" columns MUST always appear as the **last two columns**
  (in that order), after all dynamic schema-driven columns. `movementType`,
  "Conferência", and "Status" are NOT driven by the schema and are rendered regardless
  of the schema content. The `movementType` values displayed are "New", "Edit", and
  "Remove".
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
- **FR-015**: The screen MUST display a batch audit diary panel at the top of the
  screen. The panel MUST fetch data from `GET /api/batches/{id}/audit` whenever the
  selected batch changes and display the `changedAt`, `changeType`, `actorId`, and
  `description` fields of each audit entry. The panel MUST be collapsible: it renders
  expanded by default; the analyst can collapse it to reclaim vertical space for the
  occurrence table. Collapsed/expanded state does not need to persist across sessions.
- **FR-016**: The occurrence detail drawer MUST include a "Histórico · auditoria e
  diário" section positioned below the schema-driven form fields, separated by a
  visible divider. Notes are embedded in the occurrence detail response from
  `GET /api/occurrences/{id}` as a `notes` array. Each note entry contains `id`,
  `text`, `authorId`, and `createdAt`. The section MUST render them in chronological
  order on drawer open — no separate listing call is required.
- **FR-017**: The notes section MUST allow the analyst to type a new annotation and
  submit it via `POST /api/occurrences/{id}/notes` with body `{ "text": "..." }`.
  On success, the notes list MUST refresh to include the new entry. Submission of an
  empty note MUST be blocked client-side.
- **FR-018**: The screen MUST support batch approve: when one or more occurrences are
  selected via table checkboxes and the analyst triggers approve, the UI MUST call
  `POST /api/occurrences/batch/approve` with `{ "occurrenceIds": [...] }` — including
  occurrences with blocking errors — and update each successfully approved row to
  "Aprovado". The API is the authority on which IDs are valid; the UI does not
  pre-filter by blocking-error state before the batch call. Partially failed responses
  MUST result in a summary toast indicating how many succeeded and how many failed.
- **FR-019**: The screen MUST support batch reject: when one or more occurrences are
  selected via table checkboxes and the analyst triggers reject, the UI MUST prompt
  for a reason, then call `POST /api/occurrences/batch/reject` with
  `{ "occurrenceIds": [...], "reason": "..." }` and update each affected row to
  "Rejeitado" on success.
- **FR-020**: The screen MUST support batch disable: when one or more occurrences are
  selected via table checkboxes and the analyst triggers disable, the UI MUST call
  `POST /api/occurrences/batch/disable` with `{ "occurrenceIds": [...] }` and update
  each affected row to "Desabilitado" on success.
- **FR-021**: Batch action controls (approve, reject, disable) MUST be disabled or
  hidden when no rows are selected.
- **FR-022**: The table header MUST include a "select all" checkbox that selects or
  deselects all currently visible occurrence rows in the active batch. When all rows
  are selected the header checkbox appears checked; when none are selected it appears
  unchecked; when some are selected it appears in an indeterminate state.

### Key Entities

- **ApiBatch**: Top-level grouping returned by `GET /api/batches`.
- **ApiOccurrence**: List-level occurrence item with `hasBlockingErrors`,
  `validationSummary`, and `movementType` ("New" | "Edit" | "Remove").
- **ApiOccurrenceDetail**: Full detail occurrence with all fields and validations.
- **ApiSchema**: Field definitions returned by `GET /api/schemas/cadastral-movement`.
  Each field definition supplies at minimum: a key, a display label, a display
  order, and a data type. This is the authoritative source for column headers and form
  field rendering.
- **FixedColumn**: A UI concept — the `movementType` column (always first), and the
  "Conferência" and "Status" columns (always last), all rendered independently of the
  `ApiSchema` response.
- **ApiBatchAuditEntry**: A single entry from `GET /api/batches/{id}/audit` with
  `changedAt`, `changeType`, `actorId`, and `description`.
- **ApiOccurrenceNote**: A note embedded in `ApiOccurrenceDetail` under the `notes`
  array. Fields: `id` (string), `text` (string), `authorId` (string), `createdAt`
  (datetime). New notes are submitted via `POST /api/occurrences/{id}/notes` with
  `{ "text": "..." }`; after success, the drawer re-fetches the occurrence detail to
  refresh the notes list.

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
  sub-components (excluding the three fixed column labels "movementType",
  "Conferência", and "Status").
- **SC-008**: The batch audit diary panel renders at the top of the screen whenever a
  batch is selected and displays all four audit fields (`changedAt`, `changeType`,
  `actorId`, `description`) for each entry — verified by comparing rendered entries
  to the `GET /api/batches/{id}/audit` response.
- **SC-009**: The notes section in the occurrence detail drawer lists all existing
  notes on open, and after submitting a new note the list updates to include it —
  verified end-to-end without a drawer close/reopen.
- **SC-010**: Selecting N rows and triggering a batch action results in exactly one
  API call with all N `occurrenceIds`, and all N rows update in the table — verified
  by selecting multiple rows and confirming a single network request is made.

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
- The batch audit diary endpoint uses the currently selected batch ID:
  `GET /api/batches/{id}/audit`. The diary panel re-fetches when the batch selection
  changes.
- Notes are embedded in the occurrence detail response (`GET /api/occurrences/{id}`)
  as a `notes` array with fields `id`, `text`, `authorId`, and `createdAt`. There is
  no separate listing endpoint. After a successful `POST /api/occurrences/{id}/notes`,
  the drawer re-fetches the occurrence detail to refresh the notes list.
- The `movementType` field is present on the occurrence list items returned by
  `GET /api/occurrences/` and requires no separate fetch.
- Batch action endpoints (`/api/occurrences/batch/*`) accept an array of occurrence
  IDs. A partial-success response (some IDs rejected) should update successful rows
  and display a summary error; the spec treats this as a best-effort scenario.

## Clarifications

### Session 2026-06-27

- Q: What is the exact URL format for the schemas endpoint? → A: Path parameter — `GET /api/schemas/cadastral-movement`
- Q: How should schema `dataType` values map to edit form input controls? → A: `date`/`datetime` → date picker; all other types → plain text input
- Q: Should the schema be re-fetched on each batch selection or cached? → A: Fetch once on screen mount; cache for the session; page reload to recover from schema changes
- Q: Where should the fixed "Conferência" and "Status" columns appear in the table? → A: Last two columns (rightmost), after all dynamic schema-driven columns
- Q: Should schema fields in the edit drawer have a read-only state? → A: No — all schema-driven fields are always editable

### Session 2026-06-28

- Q: Is there a `GET /api/occurrences/{id}/notes` listing endpoint, or are notes embedded in the occurrence detail? → A: Notes are embedded in `GET /api/occurrences/{id}` as a `notes` array with fields `id`, `text`, `authorId`, `createdAt`. No separate listing call. After POST, re-fetch the occurrence detail to refresh.
- Q: Should the table include a header-level checkbox to select all visible occurrences at once? → A: Yes — header checkbox selects/deselects all visible rows; supports indeterminate state when partially selected.
- Q: When batch approving a selection that includes occurrences with blocking errors, should the UI pre-filter or send all IDs to the API? → A: Send all selected IDs to the API; the API is the authority on validity; UI surfaces a partial-failure toast with succeed/fail counts.
- Q: Should the batch audit diary panel at the top of the screen be collapsible? → A: Yes — expanded by default; analyst can collapse it; state does not persist across sessions.
- Q: Where in the occurrence detail drawer should the notes section appear? → A: Below the schema-driven form fields, separated by a visible divider. No tabs.
- Req: `movementType` field from `/api/occurrences/` must be shown as the first column. Values are "New", "Edit", "Remove".
- Req: Batch audit diary must appear at the top of the screen consuming `GET /api/batches/{id}/audit` with fields `changedAt`, `changeType`, `actorId`, `description`.
- Req: Occurrence detail drawer must include a notes section (Histórico · auditoria e diário) using `GET /api/occurrences/{id}/notes` for listing and `POST /api/occurrences/{id}/notes` (body `{ "text": "..." }`) for creation.
- Req: Batch operations (approve / reject with reason / disable) must be added using table checkboxes and the endpoints `/api/occurrences/batch/approve`, `/api/occurrences/batch/reject`, `/api/occurrences/batch/disable`.
