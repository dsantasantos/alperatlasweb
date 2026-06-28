# API Contract: JWT Auth Login

**Feature**: 004-jwt-auth-login | **Date**: 2026-06-28
**Contract Version**: 4.0 — adds `/auth/login`; removes `/token`

---

## New Endpoint

### POST /auth/login

Authenticates a user with username and password. Returns a JWT Bearer token.

**Request**

```
POST /auth/login
Content-Type: application/json
```

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response — 200 OK**

```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 28800,
  "profile": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | JWT to use in `Authorization: Bearer` header |
| `token_type` | string | Always `"Bearer"` |
| `expires_in` | number | Token validity in seconds (currently 28800 = 8 h) |
| `profile` | string | Opaque user profile value; shape TBC with backend team |

**Error Responses**

| Status | Meaning | Frontend behavior |
|--------|---------|-------------------|
| 401 | Invalid credentials | Show "Usuário ou senha inválidos." |
| 422/400 | Malformed request | Show "Erro ao processar requisição." |
| 5xx / network | Server / connectivity error | Show "Serviço indisponível. Tente novamente." |

---

## Removed Endpoint

### POST /token (REMOVED)

The OAuth2 client_credentials endpoint previously used for automatic background login is **no longer called** by this frontend. The Vite dev proxy for `/token` is removed from `vite.config.ts`.

---

## Authentication Header (unchanged)

All authenticated API calls continue to send:

```
Authorization: Bearer <access_token>
```

This header is attached automatically by `src/api/client.ts`.

---

## TypeScript Contract Update

File: `src/api/types.ts`

**Version bump**: `3.0` → `4.0`

```typescript
// ===== Auth =====

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  profile: string;   // NEW — was absent in v3.0
}
```

**Note**: `ApiTokenResponse` is now only used inside `src/api/auth.ts`. It is not exported from `src/api/index.ts` for external use.
