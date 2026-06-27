# API Usage Contract: CadastralMovimentDefaut

**Contract Version**: 1.0 | **Date**: 2026-06-27

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

## Batch Rail — Load on Mount (src/api/batches.ts)

```
GET /api/batches?operationTypeKey=cadastral-movement&pageSize=50
Authorization: Bearer <token>

→ 200: ApiBatchListResponse { items: ApiBatchListItem[], totalCount, page, pageSize }
→ First item is selected automatically
→ 401 → display auth error banner
```

---

## Batch Detail + Schema (src/api/batches.ts)

```
GET /api/batches/{batchId}?pageSize=200
Authorization: Bearer <token>

→ 200: ApiBatchDetail
       ├── schema.fields[] → drives column headers and field order
       └── occurrences.items[] → populates the occurrence table
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
       ├── fields[] → rendered in displayOrder from schema
       └── validations[] → grouped by dimension (Capture / Movement)
→ Triggered when analyst clicks a row
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

## Error Handling Convention

All API calls use `httpClient` from `src/api/client.ts`. On non-2xx:
- Throws `ApiError(status, body)`
- Screen catches and calls `flash('warn', message)`
- 401 on mount → shows persistent error banner (not a toast)
