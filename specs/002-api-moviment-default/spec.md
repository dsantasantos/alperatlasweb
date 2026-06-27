# Feature Specification: CadastralMovimentDefaut — API-Connected Screen

**Feature Branch**: `002-api-moviment-default`

**Created**: 2026-06-27

**Status**: Draft

**Input**: Create a CadastralMovimentDefaut.tsx screen identical in structure to
CadastralMoviment.tsx, in the same folder, but fed by real backend API endpoints.
API calls must be organized in dedicated files per the constitution. The existing
CadastralMoviment.tsx must remain untouched.

## User Scenarios & Testing

### User Story 1 — Analyst Reviews Batch Occurrences (Priority: P1)

The analyst opens the app and sees the list of batches on the left rail. They select a
batch and see its occurrences in a sortable table. Occurrences with errors appear first.

**Why this priority**: This is the primary workflow. Nothing else works without it.

**Independent Test**: Can be fully tested by selecting a batch from the rail and
confirming occurrences load from the API with schema-driven column labels.

**Acceptance Scenarios**:

1. **Given** the user is on the CadastralMovimentDefaut screen, **When** the page
   loads, **Then** the batch list is populated from `GET /api/batches` and the first
   batch is selected automatically.
2. **Given** a batch is selected, **When** its occurrences load, **Then** column
   headers use `displayLabel` from the batch schema, not hardcoded strings.
3. **Given** occurrences are loaded, **When** they render, **Then** occurrences with
   blocking errors appear first (sorted by `hasBlockingErrors`).

---

### User Story 2 — Analyst Inspects and Edits an Occurrence (Priority: P2)

The analyst clicks an occurrence row to open the detail drawer. They see all fields
with labels from the schema, provenance on demand, and validation messages. They can
edit a field and save — validations recompute automatically.

**Why this priority**: Core review action — allows correcting data before approval.

**Independent Test**: Click a row → drawer opens → edit a field → save → validations
update from API response.

**Acceptance Scenarios**:

1. **Given** the drawer is open, **When** the occurrence detail loads from
   `GET /api/occurrences/{id}`, **Then** fields are grouped and labeled per schema.
2. **Given** a field is edited and saved, **When** `PATCH /fields/{key}` responds,
   **Then** the drawer reflects updated validations without a full reload.
3. **Given** a blocking error exists, **When** the drawer footer renders, **Then**
   the Approve button is disabled.

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

## Requirements

### Functional Requirements

- **FR-001**: Screen MUST load batch list from `GET /api/batches` on mount.
- **FR-002**: Screen MUST load occurrence list from `GET /api/batches/{id}` on batch
  selection.
- **FR-003**: Schema labels MUST come from `schema.fields[].displayLabel` in the batch
  detail response — no hardcoded label maps.
- **FR-004**: Detail drawer MUST fetch from `GET /api/occurrences/{id}` when an
  occurrence is opened.
- **FR-005**: Field edits MUST call `PATCH /api/occurrences/{id}/fields/{key}`.
- **FR-006**: Approve action MUST call `POST /api/occurrences/{id}/approve`.
- **FR-007**: Reject action MUST call `POST /api/occurrences/{id}/reject` with reason.
- **FR-008**: Disable action MUST call `POST /api/occurrences/{id}/disable`.
- **FR-009**: Export MUST call `GET /api/batches/{id}/export` and trigger XLSX download.
- **FR-010**: API calls MUST be organized in `src/api/` files, one per resource group.
- **FR-011**: API types MUST mirror the backend contract with no `any`.
- **FR-012**: The original `CadastralMoviment.tsx` MUST NOT be modified.

### Key Entities

- **ApiBatch**: Top-level grouping returned by `GET /api/batches`.
- **ApiOccurrence**: List-level occurrence item with `hasBlockingErrors` and
  `validationSummary`.
- **ApiOccurrenceDetail**: Full detail occurrence with all fields and validations.
- **ApiSchema**: Field definitions supplying `displayLabel` and `displayOrder`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Batch list renders within 2 seconds of page mount on a local network.
- **SC-002**: Occurrence table shows schema-derived column labels (verified by
  inspecting rendered header text against API schema response).
- **SC-003**: Approve/reject/disable actions round-trip to the API and update the row
  status without a full page refresh.
- **SC-004**: Zero hardcoded field labels in `CadastralMovimentDefaut.tsx` or its
  sub-components.

## Assumptions

- The API base URL is provided via `VITE_API_BASE_URL` environment variable.
- The auth token is available in the in-memory token store (set by a login flow).
- The `operationTypeKey` is `cadastral-movement` for the `CadastralMovimentDefaut`
  screen.
- The batch schema included in `GET /api/batches/{id}` response is sufficient to drive
  column and field rendering (no separate `GET /api/schemas/...` call is required for
  the primary render path).
- Per the constitution, no application state is persisted in `localStorage` or
  `sessionStorage`.
