# Data Model: JWT Auth Login Migration

**Feature**: 004-jwt-auth-login | **Date**: 2026-06-28

---

## Entities

### AuthSession (runtime, in-memory only)

Represents the authenticated state held for the lifetime of the browser tab. Never persisted to storage.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `access_token` | `string` | `/auth/login` response | Sent as `Authorization: Bearer <token>` on every authenticated request |
| `token_type` | `string` | `/auth/login` response | Always `"Bearer"` per spec |
| `expires_in` | `number` | `/auth/login` response | Seconds until expiry (28800 = 8 h) |
| `expiresAt` | `number` | Derived | `Date.now() + expires_in * 1000`; computed on login, stored in `client.ts` |
| `profile` | `string` | `/auth/login` response | Opaque; typed as `string` until backend contract confirms shape |

Stored in: `client.ts` module scope (token + expiry) and React `useState<Session>` in `App.tsx` (name + profile).

---

### Session (React prop)

Carries the display-facing user data through the React tree. Passed as props from `App.tsx` → `AppShell.tsx`.

**Current shape** (`src/types.ts`):

```typescript
export interface Session {
  name: string;
  role: string;
}
```

**Updated shape**:

```typescript
export interface Session {
  name: string;
  role: string;
  profile: string;   // raw profile value from /auth/login
}
```

---

### LoginCredentials (input, transient)

The data the user provides on the login form. Sent to `/auth/login`. Never stored after the request completes.

| Field | Type | Notes |
|-------|------|-------|
| `username` | `string` | Text input; trimmed before submission |
| `password` | `string` | Password input; never logged or stored |

---

### ApiTokenResponse (API contract type)

Lives in `src/api/types.ts`. Mirrors the `/auth/login` JSON response.

**Current shape**:

```typescript
export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
```

**Updated shape**:

```typescript
export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  profile: string;
}
```

---

## Token Lifecycle

```
User submits credentials
        │
        ▼
POST /auth/login
        │
        ▼
Store access_token + expiresAt in client.ts module scope
Store Session { name, role, profile } in App.tsx React state
        │
        ▼
All authenticated requests → Authorization: Bearer <access_token>
        │
        ├─── Token not expired → request proceeds normally
        │
        └─── Token expired OR 401 received
                │
                ▼
        Dispatch 'auth:expired' event
        App.tsx listener calls logout handler
        clearAuthToken() clears module-scope token
        setSession(null) clears React state
        → Login screen shown
```

---

## State Synchronization

The two stores (module-scope token and React session state) must always stay in sync:

| Action | Token store | React state |
|--------|-------------|-------------|
| Login success | `setAuthToken()` + `setExpiry()` | `setSession({ name, role, profile })` |
| Explicit logout | `clearAuthToken()` | `setSession(null)` |
| Token expiry / 401 | `clearAuthToken()` (via event) | `setSession(null)` (via event listener) |
