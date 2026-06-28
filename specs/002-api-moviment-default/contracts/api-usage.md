# API Usage Contract: CadastralMovimentDefaut

**Contract Version**: 3.0 | **Date**: 2026-06-27 | **Last Updated**: 2026-06-28

Documents how `CadastralMovimentDefaut.tsx` and `src/api/` interact with the
backend. Source of truth: `api-atlas-endpoints.md`.

---

## Auth (src/api/auth.ts + src/api/client.ts)

```
POST /token
Content-Type: application/x-www-form-urlencoded
grant_type=client_credentials&client_id={id}&client_secret={secret}

→ 200: { access_token, token_type, expires_in }
→ Token stored in-memory via setAuthToken(); never in localStorage
```

---

## Schema — Fetch on Mount, Cache for Session (src/api/schemas.ts)

```
GET /api/schemas/cadastral-movement
Authorization: Bearer <token>

→ 200: ApiSchema
       ├── fields[] sorted by displayOrder → drives column headers
       ├── fields[].dataType → drives edit form input control type
       └── fields[].displayLabel → all column and field labels
→ Fetched ONCE on screen mount; cached in component state
→ Not re-fetched on batch selection
→ 401 → display auth error banner
→ Network error → display schema load error; block table render
```

---

## Batch Rail — Load on Mount (src/api/batches.ts)

```
GET /api/batches?operationTypeKey=cadastral-movement&pageSize=50
Authorization: Bearer <token>

→ 200: ApiBatchListResponse { items: ApiBatchListItem[], totalCount, page, pageSize }
→ First item is selected automatically
→ 401 → display auth error banner
```

---

## Batch Detail (src/api/batches.ts)

```
GET /api/batches/{batchId}?pageSize=200
Authorization: Bearer <token>

→ 200: ApiBatchDetail
       └── occurrences.items[] → populates the occurrence table
→ Any inline schema in this response is IGNORED for rendering;
  column and field definitions come exclusively from the schema cached on mount
→ 404 → flash warn
```

---

## Summary Bar (src/api/batches.ts)

```
GET /api/batches/{batchId}/summary
Authorization: Bearer <token>

→ 200: ApiBatchSummary { pending, approved, rejected, disabled, error, warning }
→ Drives the SummaryBar component (progress %, error/warning counts)
```

---

## Occurrence Detail (src/api/occurrences.ts)

```
GET /api/occurrences/{occurrenceId}
Authorization: Bearer <token>

→ 200: ApiOccurrenceDetail
       ├── fields[] → rendered using schema displayOrder and displayLabel
       ├── validations[] → grouped by dimension (Capture / Movement)
       └── notes[] → embedded; rendered in "Histórico" section of drawer
→ Triggered when analyst clicks a row, and after POST /notes to refresh
```

---

## Field Edit (src/api/occurrences.ts)

```
PATCH /api/occurrences/{occurrenceId}/fields/{fieldKey}
Authorization: Bearer <token>
Content-Type: application/json
{ "value": "new value" }

→ 200: ApiOccurrenceDetail (updated, validations recomputed by backend)
→ Updates drawer state; refreshes list item inline
→ 404 → flash warn
```

---

## Approve (src/api/occurrences.ts)

```
POST /api/occurrences/{occurrenceId}/approve
Authorization: Bearer <token>

→ 200: ApiOccurrenceDetail with state "Approved"
→ 422 → flash "Há erros bloqueantes pendentes."
→ Frontend MUST disable approve button when hasBlockingErrors === true
```

---

## Reject (src/api/occurrences.ts)

```
POST /api/occurrences/{occurrenceId}/reject
Authorization: Bearer <token>
Content-Type: application/json
{ "reason": "non-empty string" }

→ 200: ApiOccurrenceDetail with state "Rejected" and rejectionReason filled
→ 400 → reason was empty (frontend prevents this with modal guard)
→ 404 → flash warn
```

---

## Disable (src/api/occurrences.ts)

```
POST /api/occurrences/{occurrenceId}/disable
Authorization: Bearer <token>

→ 200: ApiOccurrenceDetail with state "Disabled"
→ 404 → flash warn
```

---

## Occurrence Note (src/api/occurrences.ts)

```
POST /api/occurrences/{occurrenceId}/notes
Authorization: Bearer <token>
Content-Type: application/json
{ "text": "non-empty string" }

→ 200/201: success
→ On success: re-fetch GET /api/occurrences/{occurrenceId} to refresh notes list
→ Empty text prevented client-side before call
→ Network error → flash warn; note not added
```

---

## Batch Audit Diary (src/api/batches.ts)

```
GET /api/batches/{batchId}/audit
Authorization: Bearer <token>

→ 200: ApiBatchAuditEntry[]
       ├── changedAt → when the change happened
       ├── changeType → type of change (e.g. "Created", "Dispatched")
       ├── actorId → who performed the change
       └── description → human-readable description
→ Fetched on each batch selection change
→ Rendered in the collapsible diary panel at the top of the screen
→ Network error → render error state in diary panel only; rest of screen unaffected
→ Empty array → render empty state (no error)
```

---

## Batch Approve (src/api/occurrences.ts)

```
POST /api/occurrences/batch/approve
Authorization: Bearer <token>
Content-Type: application/json
{ "occurrenceIds": ["id1", "id2", ...] }

→ 200: partial or full success response
→ Successful IDs → update row state to "Approved" in table
→ Failed IDs → row unchanged; summary toast: "N aprovados, M falharam"
→ API is the validity authority — UI does not pre-filter by hasBlockingErrors
```

---

## Batch Reject (src/api/occurrences.ts)

```
POST /api/occurrences/batch/reject
Authorization: Bearer <token>
Content-Type: application/json
{ "occurrenceIds": ["id1", ...], "reason": "non-empty string" }

→ 200: partial or full success response
→ Successful IDs → update row state to "Rejected" in table
→ Failed IDs → row unchanged; summary toast
→ reason is collected via modal before the API call; empty reason blocks submission
```

---

## Batch Disable (src/api/occurrences.ts)

```
POST /api/occurrences/batch/disable
Authorization: Bearer <token>
Content-Type: application/json
{ "occurrenceIds": ["id1", ...] }

→ 200: partial or full success response
→ Successful IDs → update row state to "Disabled" in table
→ Failed IDs → row unchanged; summary toast
```

---

## Export XLSX (src/api/batches.ts)

```
GET /api/batches/{batchId}/export?template=defaultxlsx
Authorization: Bearer <token>

→ 200: Blob (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
→ Triggers browser download: export-{batchId}.xlsx
→ 422 → flash "Sem ocorrências aprovadas."
→ 400 → flash "Template inválido."
```

---

## Mount Sequence

```
1. GET /api/schemas/cadastral-movement  → cache schema in state           ┐ parallel
2. GET /api/batches                     → populate batch rail, auto-select ┘
3. GET /api/batches/{firstId}           → load occurrences for selected batch  ┐
4. GET /api/batches/{firstId}/summary   → populate summary bar                 ├ parallel
5. GET /api/batches/{firstId}/audit     → populate diary panel                 ┘
```

Steps 1 and 2 are parallelised. Steps 3, 4, and 5 depend on step 2's selected batch id and run in parallel with each other. On each subsequent batch selection, steps 3, 4, and 5 re-run for the new batch id.

---

## Error Handling Convention

All API calls use `httpClient` from `src/api/client.ts`. On non-2xx:
- Throws `ApiError(status, body)`
- Screen catches and calls `flash('warn', message)`
- 401 on mount → shows persistent error banner (not a toast)
- Schema fetch failure → renders error state instead of table (cannot render without schema)
