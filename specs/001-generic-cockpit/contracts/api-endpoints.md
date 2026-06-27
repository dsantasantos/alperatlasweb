# API Contract: Alper Atlas Frontend ↔ Backend

**Contract Version**: 1.0 | **Date**: 2026-06-27

All request/response shapes reference the types defined in `data-model.md`.
Base URL: `/api/v1` (configured via environment variable `VITE_API_BASE_URL`).

---

## 1. Schema

### GET `/schema/{operationType}`

Returns the `OperationSchema` that drives all generic rendering.
Called once on app init (or on operationType change); cached in app state.

**Response** `200 OK`:
```json
{
  "version": "1.0",
  "operationType": "beneficiario-movimentacao",
  "fields": [
    {
      "key": "tipo",
      "label": "Tipo",
      "group": "Movimentação",
      "dataType": "enum",
      "displayHint": "default",
      "displayOrder": 1,
      "enumValues": ["Inclusão", "Exclusão", "Alteração"],
      "required": true
    },
    {
      "key": "nome",
      "label": "Nome",
      "group": "Beneficiário",
      "dataType": "text",
      "displayHint": "full-width",
      "displayOrder": 6,
      "required": true
    }
  ]
}
```

**Frontend type**: `OperationSchema`

---

## 2. Batches

### GET `/batches`

Returns all batches for the authenticated user's scope.

**Response** `200 OK`:
```json
[
  {
    "id": "LT-2026-0619-A",
    "clientName": "Construtora Vega S/A",
    "period": "2026-06",
    "source": "Planilha (e-mail)",
    "pendingCount": 6,
    "errorCount": 3,
    "diary": []
  }
]
```

**Frontend type**: `Batch[]`

---

### GET `/batches/{batchId}`

Returns a single batch with full diary.

**Response** `200 OK`: `Batch`

---

### POST `/batches/{batchId}/diary`

Adds a human diary entry to a batch.

**Request body**:
```json
{ "text": "string" }
```

**Response** `201 Created`: `DiaryEntry`

---

## 3. Occurrences

### GET `/batches/{batchId}/occurrences`

Returns all occurrences for a batch.

**Response** `200 OK`: `Occurrence[]`

---

### GET `/batches/{batchId}/occurrences/{occurrenceId}`

Returns a single occurrence with full timeline and provenance.

**Response** `200 OK`: `Occurrence`

---

### PATCH `/batches/{batchId}/occurrences/{occurrenceId}`

Updates a field value in an occurrence (analyst edit).

**Request body**:
```json
{
  "fieldKey": "nome",
  "value": "Maria Silva"
}
```

**Response** `200 OK`: updated `Occurrence`

**Guard**: Backend rejects if occurrence status is `exportado`, `confirmado`,
`recusado`, or `desabilitado`.

---

### POST `/batches/{batchId}/occurrences/{occurrenceId}/approve`

Approves an occurrence.

**Request body**: `{}` (empty — no payload needed)

**Response** `200 OK`: updated `Occurrence` with `status: "aprovado"`

**Guard**: Backend rejects (422) if any validation has `severity === "erro"`.
Frontend MUST enforce this guard before enabling the approve affordance.

---

### POST `/batches/{batchId}/occurrences/{occurrenceId}/reject`

Rejects an occurrence.

**Request body**:
```json
{ "reason": "string (required, non-empty)" }
```

**Response** `200 OK`: updated `Occurrence` with `status: "rejeitado"`

**Guard**: Backend rejects (422) if `reason` is empty.
Frontend MUST enforce this guard before enabling the reject affordance.

---

## 4. Export

### POST `/batches/{batchId}/export`

Triggers export of approved occurrences as a versioned artifact.

**Request body**:
```json
{ "destinationId": "string" }
```

**Response** `201 Created`: `ExportArtifact`

---

### GET `/batches/{batchId}/artifacts`

Returns all export artifacts for a batch.

**Response** `200 OK`: `ExportArtifact[]`

---

## 5. Session

### POST `/auth/login`

**Request body**:
```json
{ "username": "string", "password": "string" }
```

**Response** `200 OK`:
```json
{ "token": "string", "session": { "name": "string", "role": "string" } }
```

### POST `/auth/logout`

**Response** `204 No Content`

---

## Error Shape

All error responses use:
```json
{
  "code": "string",
  "message": "string",
  "details": {}
}
```

Common codes: `VALIDATION_BLOCKED`, `REASON_REQUIRED`, `OCCURRENCE_LOCKED`,
`UNAUTHORIZED`, `NOT_FOUND`.
