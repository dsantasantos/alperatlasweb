# Quickstart: JWT Auth Login Migration

**Feature**: 004-jwt-auth-login | **Date**: 2026-06-28

## What Changed

The login flow migrates from a client-side hardcoded credential check to a real `/auth/login` API call. All old OAuth2 client_credentials code is removed.

## How to Log In (dev)

1. Start the backend (must expose `POST /auth/login`)
2. Start the frontend: `npm run dev`
3. Open `http://localhost:5173`
4. Enter a valid username and password — the login form calls `/auth/login` and stores the returned JWT
5. All subsequent API calls automatically carry `Authorization: Bearer <token>`

## Environment Variables

Remove from `.env` (no longer needed):
```
VITE_CLIENT_ID=...
VITE_CLIENT_SECRET=...
```

No new variables are required. The backend base URL is still `VITE_API_BASE_URL` (or falls back to the Vite proxy at `/api`).

## Session Lifetime

Tokens expire after `expires_in` seconds (currently 8 hours). When a token expires:
- The next API call dispatches an `auth:expired` event
- The app automatically redirects to the login screen
- No manual refresh; the user must log in again

## Logout

Clicking "Sair" in the sidebar:
1. Clears the in-memory token (`clearAuthToken()`)
2. Clears the React session state
3. Renders the login screen

## Key Files After Migration

| File | Role |
|------|------|
| `src/api/auth.ts` | `login(username, password)` — calls `/auth/login`, stores token |
| `src/api/client.ts` | Token store, expiry check, 401 → `auth:expired` event |
| `src/pages/Login.tsx` | Login form — calls `login()`, handles errors |
| `src/App.tsx` | Session state, `auth:expired` listener, logout handler |
| `src/types.ts` | `Session` interface (includes `profile`) |
| `src/api/types.ts` | `ApiTokenResponse` (includes `profile`) |
