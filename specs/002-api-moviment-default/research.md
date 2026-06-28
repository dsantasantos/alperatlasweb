# Research: CadastralMovimentDefaut — API-Connected Screen

**Branch**: `002-api-moviment-default` | **Date**: 2026-06-27 | **Last Updated**: 2026-06-28

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
| `GET /api/schemas/cadastral-movement` | Fetch schema on screen mount (once); drives all column headers and form fields |
| `GET /api/batches` | Populate batch rail on mount |
| `GET /api/batches/{id}` | Load occurrences per batch selection |
| `GET /api/batches/{id}/summary` | Drive the progress/summary bar |
| `GET /api/batches/{id}/export` | XLSX download of approved occurrences |
| `GET /api/occurrences/{id}` | Full detail when analyst opens a row; includes embedded `notes[]` |
| `PATCH /api/occurrences/{id}/fields/{key}` | Field editing with auto-revalidation |
| `POST /api/occurrences/{id}/approve` | Single-occurrence approve |
| `POST /api/occurrences/{id}/reject` | Single-occurrence reject (reason required) |
| `POST /api/occurrences/{id}/disable` | Single-occurrence logical deletion |
| `POST /api/occurrences/{id}/notes` | Add annotation to occurrence (`{ "text": "..." }`) |
| `GET /api/batches/{id}/audit` | Batch change history (changedAt, changeType, actorId, description) |
| `POST /api/occurrences/batch/approve` | Batch approve (`{ "occurrenceIds": [...] }`) |
| `POST /api/occurrences/batch/reject` | Batch reject (`{ "occurrenceIds": [...], "reason": "..." }`) |
| `POST /api/occurrences/batch/disable` | Batch disable (`{ "occurrenceIds": [...] }`) |

**Endpoints NOT used by the new screen** (and why):

| Endpoint | Reason not used |
|----------|-----------------|
| `POST /token` | Auth flow is separate; screen assumes token already set |
| `GET /health` | Infra concern, not a UI concern |
| `POST /api/batches` | Ingestion endpoint for external systems, not the cockpit |
| `POST /api/batches/{id}/dispatch` | Out of scope for this phase |
| `GET /api/triage` | Cross-batch queue view; out of scope for the single-batch cockpit screen |

---

## 2. Schema-Driven Rendering Strategy

**Decision**: Fetch the schema from `GET /api/schemas/cadastral-movement` once on
screen mount and cache it in component state for the session lifetime. This schema
drives all dynamic column headers (table) and all form fields (edit drawer). No label
or field key is hardcoded in the component tree.

**Rationale**: The spec (FR-003) requires the schema to come from the dedicated
`/api/schemas` endpoint, not from the batch detail response. Using a dedicated endpoint:
- Decouples schema definition from batch data (schema can evolve independently)
- Fetched once on mount, not once per batch selection — lower latency on batch switches
- Provides full field metadata (`dataType`, `displayOrder`, `displayLabel`) in a single
  authoritative response

**Caching**: Schema is cached in component state after the first mount fetch. No
re-fetch occurs on batch selection. A page reload recovers from mid-session schema
changes (accepted tradeoff — schema changes are rare operational events).

**Column layout rule**:
1. Fixed `movementType` column (first) — values "New", "Edit", "Remove"; sourced from `ApiOccurrenceListItem.movementType`
2. Dynamic columns from the schema, in ascending `displayOrder`
3. Fixed "Conferência" column (last-but-one)
4. Fixed "Status" column (last)

Fixed columns are NOT in the schema; they render unconditionally.

**Form field input type rule** (FR-005a):

| `dataType` value | Input control |
|-----------------|---------------|
| `date` | `<input type="date">` |
| `datetime` | `<input type="datetime-local">` |
| Any other value | `<input type="text">` |

All schema-driven fields in the drawer are editable. There is no read-only field
concept — if a field is in the schema, it is rendered as an editable input.

**Column header rule**: Table `<th>` text for dynamic columns MUST use `displayLabel`
from the schema field. If a key exists in occurrence data but not in the schema, the
key name itself is shown as fallback (`schema.fields.find(f => f.key === key)?.displayLabel ?? key`).

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
| Diário do lote (DiaryModal) — per-occurrence inline diary | **Now implemented**: audit diary via `GET /api/batches/{id}/audit` at top of screen; occurrence notes via `POST /api/occurrences/{id}/notes` in drawer |
| Simular retorno (confirmar/recusar da operadora) | No return-simulation endpoint |
| Gerar movimentação compensatória | No compensate endpoint |
| Efeito previsto no Alper Core (coreEffect/coreApplied) | Not in any API response |
| Export modal por operadora (per-destination) | API exports all approved at once |
| Lista de artefatos gerados | No artifacts listing endpoint |
| Filtro por operadora/seguradora | `destino` field not guaranteed in all occurrences |
| Filtro por tipo de movimentação | `tipo` field not guaranteed in all occurrences |

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

---

## 7. Schema Endpoint vs Batch Detail Schema

The batch detail (`GET /api/batches/{id}`) may still include an inline `schema` object.
However, the screen MUST use `GET /api/schemas/cadastral-movement` as its authoritative
schema source (per FR-003 and spec clarification). The inline batch schema, if present,
is ignored for rendering purposes. This ensures schema consistency across all batch
selections without per-batch schema re-fetching.
