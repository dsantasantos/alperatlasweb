# Research: CadastralMovimentDefaut — API-Connected Screen

**Branch**: `002-api-moviment-default` | **Date**: 2026-06-27

---

## 1. API Contract Analysis

**Decision**: Consume the 15 endpoints documented in `api-atlas-endpoints.md`. All
authenticated endpoints use `Authorization: Bearer <token>` obtained via
`POST /token` (OAuth2 `client_credentials` flow).

**Rationale**: The existing `CadastralMoviment.tsx` uses hardcoded seed data.
`CadastralMovimentDefaut.tsx` must replace every seed dependency with real API calls.

**Endpoints used by the new screen**:

| Endpoint | Use |
|----------|-----|
| `GET /api/batches` | Populate batch rail on mount |
| `GET /api/batches/{id}` | Load occurrences + inline schema per batch |
| `GET /api/batches/{id}/summary` | Drive the progress/summary bar |
| `GET /api/batches/{id}/export` | XLSX download of approved occurrences |
| `GET /api/occurrences/{id}` | Full detail when analyst opens a row |
| `PATCH /api/occurrences/{id}/fields/{key}` | Field editing with auto-revalidation |
| `POST /api/occurrences/{id}/approve` | Single and bulk approve |
| `POST /api/occurrences/{id}/reject` | Single and bulk reject (reason required) |
| `POST /api/occurrences/{id}/disable` | Logical deletion from review flow |

**Endpoints NOT used by the new screen** (and why):

| Endpoint | Reason not used |
|----------|-----------------|
| `POST /token` | Auth flow is separate; screen assumes token already set |
| `GET /health` | Infra concern, not a UI concern |
| `POST /api/batches` | Ingestion endpoint for external systems, not the cockpit |
| `POST /api/batches/{id}/dispatch` | Out of scope for this phase |
| `GET /api/schemas/{operationTypeKey}` | Schema is embedded in `GET /api/batches/{id}` response; no extra call needed for render path |
| `GET /api/triage` | Cross-batch queue view; out of scope for the single-batch cockpit screen |

---

## 2. Schema-Driven Rendering Strategy

**Decision**: Use the `schema` object embedded in `GET /api/batches/{id}` as the
field definition source. Extract `displayLabel` and `displayOrder` from
`schema.fields[]`. Build a local `Record<string, string>` label map on each batch
load.

**Rationale**: This avoids a second round-trip to `GET /api/schemas/{operationTypeKey}`
for the primary render path and keeps schema and occurrences in sync (same API call).
For future needs (full schema with `isRequired`, `typeHint`), the dedicated
`GET /api/schemas/` endpoint is available via `src/api/schemas.ts`.

**Column header rule**: Table `<th>` text MUST use `label[fieldKey]` from the schema
map, never a hardcoded string. If the schema doesn't include a key, the key name is
shown as fallback (`label[key] ?? key`).

---

## 3. State Mapping

The API uses English Pascal-case state strings; the existing CSS classes use a
different naming convention. Mapping is done in a local constant:

| API state | Display label | CSS class |
|-----------|--------------|-----------|
| `Pending`  | Pendente     | `st-pend` |
| `Approved` | Aprovado     | `st-apr`  |
| `Rejected` | Rejeitado    | `st-rej`  |
| `Disabled` | Desabilitado | `st-dis`  |

---

## 4. Auth Token Management

**Decision**: In-memory token store in `src/api/client.ts` via module-level variable.
`setAuthToken(token)` / `clearAuthToken()` / `hasAuthToken()` functions are exported.

**Rationale**: Per constitution Principle Technical Constraints — no `localStorage` or
`sessionStorage` for application state. The token is held in memory and is lost on
page refresh (intentional for a cockpit with session-based auth).

**Token acquisition**: `src/api/auth.ts` exposes `loginWithCredentials(clientId, secret)`
which calls `POST /token` with `Content-Type: application/x-www-form-urlencoded`.
The existing mock `Login.tsx` is not modified; a real auth flow wiring the token to
the API client is a separate task.

---

## 5. Features Not Available via the API

The following features from `CadastralMoviment.tsx` have no equivalent backend
endpoints and are **intentionally omitted** from `CadastralMovimentDefaut.tsx`:

| Omitted feature | Reason |
|-----------------|--------|
| Diário do lote (DiaryModal) | No diary/journal endpoint in the API |
| Simular retorno (confirmar/recusar da operadora) | No return-simulation endpoint |
| Gerar movimentação compensatória | No compensate endpoint |
| Efeito previsto no Alper Core (coreEffect/coreApplied) | Not in any API response |
| Export modal por operadora (per-destination) | API exports all approved at once |
| Lista de artefatos gerados | No artifacts listing endpoint |
| Filtro por operadora/seguradora | `destino` field not guaranteed in all occurrences |
| Filtro por tipo de movimentação | `tipo` field not guaranteed in all occurrences |

These are documented in the spec's non-goals and reported back to the user.

---

## 6. Component Reuse Strategy

**Decision**: Reuse existing shared components (`Toast`, `Modal`, `Tog`, `Sel`) from
`src/components/shared/UI.tsx`. Create inline sub-components inside
`CadastralMovimentDefaut.tsx` for the schema-driven Row, Drawer, and ValidationGroup,
rather than modifying the existing `Field` and `Dimension` components (which accept
the old Portuguese-typed `FieldValue` / `Validacao` types).

**Rationale**: The existing shared components use types from `src/types.ts` (Portuguese
domain model). Modifying them to accept the new API types would change the contract
for `CadastralMoviment.tsx` (which must be preserved). The inline approach keeps the
old and new screens fully independent.
