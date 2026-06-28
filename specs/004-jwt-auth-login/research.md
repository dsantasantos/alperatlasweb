# Research: JWT Auth Login Migration

**Feature**: 004-jwt-auth-login | **Date**: 2026-06-28

---

## Finding 1: Current Auth Architecture

**Decision**: The project uses two separate, disconnected mechanisms for auth — a module-level `_token` variable in `client.ts` for the Bearer token, and a React `useState<Session | null>` in `App.tsx` for the UI session. Logout currently only clears the React state; it does not call `clearAuthToken()`.

**Rationale**: This architecture can be preserved and improved. The token store already exists and is in-memory (compliant with the constitution). The Session object is already passed via props throughout the tree.

**Alternatives considered**: Introducing a React Context for auth — rejected; the existing prop-drilling is shallow (App → AppShell only) and adding Context would be over-engineering for the current scope.

---

## Finding 2: Files Containing Hardcoded Credential Logic

All of the following must be cleaned up:

| File | What to remove |
|------|---------------|
| `src/pages/Login.tsx` | `useState("admin")` default, `if (user.trim() === "admin" && password === "123@456")` check, placeholder `"123@456"`, `"Acesso simulado para protótipo corporativo."` hint text |
| `src/api/auth.ts` | Entire `loginWithCredentials(clientId, clientSecret)` function — OAuth2 client_credentials grant to `/token` |
| `src/App.tsx` | `VITE_CLIENT_ID` / `VITE_CLIENT_SECRET` constants, `authReady` state and effect, auto-login `useEffect` |
| `.env` | `VITE_CLIENT_ID=dev-client` and `VITE_CLIENT_SECRET=dev-secret-123` |
| `.env.example` | Same two variables |
| `vite.config.ts` | `/token` proxy entry (keep `/api`) |

---

## Finding 3: `/auth/login` Endpoint Contract

**Decision**: The new endpoint accepts username + password as a JSON body (standard REST practice for user-facing login). Request shape assumed:

```json
POST /auth/login
Content-Type: application/json

{ "username": "...", "password": "..." }
```

Response (per spec):

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 28800,
  "profile": "..."
}
```

**Rationale**: The existing `httpClient.post` in `client.ts` uses JSON by default. Using the same pattern is consistent. If the backend requires form-encoded body, only `auth.ts` needs adjustment.

**Note**: The exact request shape should be confirmed against the backend spec before implementation. The plan flags this as a single-file change if it differs.

---

## Finding 4: Token Expiry Strategy

**Decision**: Store the expiry timestamp (`Date.now() + expires_in * 1000`) alongside the token in `client.ts`. Check expiry on each request — if expired, throw a specific `TokenExpiredError`. `App.tsx` catches this and calls the logout handler.

**Rationale**: A `setTimeout` for 28800 s (8 hours) is fragile across tab sleep/wake cycles. Checking at request time is more reliable.

**Alternatives considered**: Refresh token flow — explicitly out of scope; intercepting 401s instead of proactive check — 401 interception is added as a secondary defense (belt-and-suspenders).

---

## Finding 5: Session and Token Sync Fix

**Decision**: The `onLogout` handler in `App.tsx` must call `clearAuthToken()` before clearing the React session state. This fixes the current bug where the Bearer token persists after logout.

**Rationale**: Without clearing the token, any network request made before the component re-renders would still go out with a valid token. The fix is a one-line addition.

---

## Finding 6: `profile` Field

**Decision**: The `profile` field from `/auth/login` is stored on the `Session` object. `src/types.ts` `Session` interface gets a `profile: string` field. `AppShell.tsx` already renders `session.name` and `session.role` — `profile` is available if any view needs it.

**Rationale**: The spec requires `profile` to be stored and available to authenticated views. The `Session` type is the natural carrier since it already flows via props.

**Open question**: The `profile` field type is opaque (could be a role string, a display name, or a JSON payload). It is typed as `string` until the backend contract confirms otherwise. No UI renders it in this feature scope.

---

## Finding 7: 401 Auto-Redirect

**Decision**: Add a 401 check in `client.ts`'s `request()` function that dispatches a custom `auth:expired` browser event. `App.tsx` listens to this event and calls the logout handler. This avoids a circular dependency (client.ts → App.tsx).

**Rationale**: Token expiry mid-session (e.g., user leaves tab open overnight) must be handled gracefully. An event bus is the standard pattern when the HTTP layer cannot directly call React state setters.

---

## Summary of Changes per File

| File | Change type | Summary |
|------|-------------|---------|
| `src/api/types.ts` | Modify | Add `profile: string` to `ApiTokenResponse` |
| `src/api/auth.ts` | Rewrite | Replace OAuth2 client_credentials with `/auth/login` username+password |
| `src/api/client.ts` | Modify | Add expiry tracking, 401 event dispatch |
| `src/types.ts` | Modify | Add `profile: string` to `Session` |
| `src/pages/Login.tsx` | Rewrite | Remove hardcoded check; call new `login()` function; handle errors |
| `src/App.tsx` | Modify | Remove `authReady` / env-var flow; add `auth:expired` listener; fix logout |
| `src/components/layout/AppShell.tsx` | No change | Already uses `session.name` / `session.role` via props |
| `.env` | Modify | Remove `VITE_CLIENT_ID` and `VITE_CLIENT_SECRET` |
| `.env.example` | Modify | Same |
| `vite.config.ts` | Modify | Remove `/token` proxy |
