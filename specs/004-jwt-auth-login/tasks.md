---

description: "Task list for JWT Auth Login Migration"
---

# Tasks: JWT Auth Login Migration

**Input**: Design documents from `specs/004-jwt-auth-login/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-usage.md ✅

**Tests**: No automated test suite exists for auth; validation is done manually in the browser.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Type definitions and HTTP client infrastructure that ALL user stories depend on. Complete this phase before any user-story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Add `profile: string` to `ApiTokenResponse` and bump version comment from `3.0` to `4.0` in `src/api/types.ts`
- [x] T002 [P] Add `profile: string` to the `Session` interface in `src/types.ts`
- [x] T003 Add expiry tracking to `src/api/client.ts`: add `let _expiresAt: number | null = null` module var; add `setTokenExpiry(expiresIn: number)` that stores `Date.now() + expiresIn * 1000`; add `isTokenExpired()` that returns `true` when `_expiresAt` is set and `Date.now() > _expiresAt`; update `clearAuthToken()` to also reset `_expiresAt = null`; export all three new functions
- [x] T004 Add session-expiry event dispatch to `src/api/client.ts` `request()` function: (a) before `fetch`, call `isTokenExpired()` — if `true`, dispatch `new CustomEvent('auth:expired')` on `window` and throw `new ApiError(401, 'token expired')`; (b) after `fetch`, if `res.status === 401`, dispatch `new CustomEvent('auth:expired')` on `window` before throwing (keep existing throw unchanged)

**Checkpoint**: Types updated and client infrastructure ready — user story work can now begin

---

## Phase 2: User Story 1 — Authenticate via Login Endpoint (Priority: P1) 🎯 MVP

**Goal**: Replace all hardcoded credential logic with a real `POST /auth/login` API call. Users authenticate with username + password; the JWT token is stored and attached to subsequent requests.

**Independent Test**: Start the dev server with the backend running. Enter valid credentials on the login screen. Verify the user reaches the cockpit view. Open the browser network inspector and confirm every subsequent API request carries `Authorization: Bearer <token>`. Enter invalid credentials and verify the error message appears.

### Implementation for User Story 1

- [x] T005 [US1] Rewrite `src/api/auth.ts`: remove `loginWithCredentials(clientId, clientSecret)` entirely; add `login(username: string, password: string): Promise<Session>` that POSTs `{ username, password }` as JSON to `/auth/login` using `fetch`; on success calls `setAuthToken(data.access_token)` and `setTokenExpiry(data.expires_in)` then returns `{ name: data.profile, role: 'user', profile: data.profile }`; on non-OK response throws `new ApiError(res.status, text)`; import `setAuthToken` and `setTokenExpiry` from `./client`, import `ApiError` from `./client`, import `Session` type from `../types`
- [x] T006 [US1] Rewrite `src/pages/Login.tsx`: remove `useState("admin")` default → use `useState("")`; remove the hardcoded `if (user.trim() === "admin" && password === "123@456")` block; remove the static session `{ name: "Administrador", role: "admin" }`; remove placeholder `"123@456"` from the password input; remove `"Acesso simulado para protótipo corporativo."` hint div and `"Protótipo · dados simulados para validação"` footer div; add `const [loading, setLoading] = useState(false)`; make `submit` async — call `login(user, password)` with `setLoading(true/false)` around it; on success call `onAuthenticated(session)`; on `ApiError` with status 401 set error to `"Usuário ou senha inválidos."`; on any other error set error to `"Serviço indisponível. Tente novamente."`; disable the submit button when `loading` is true; import `login` from `../api/auth`
- [x] T007 [US1] Modify `src/App.tsx`: remove `import { loginWithCredentials } from './api/auth'`; remove `const CLIENT_ID` and `const CLIENT_SECRET` constants; remove `const [authReady, setAuthReady]` state; remove the `useEffect` that calls `loginWithCredentials`; remove the `if (!authReady) return null` guard; add `import { clearAuthToken } from './api/client'`; add a `useEffect` (deps `[]`) that adds a `window` listener for `'auth:expired'` event — the handler calls `clearAuthToken()` then `setSession(null)` — return a cleanup that removes the listener; update the logout prop to `onLogout={() => { clearAuthToken(); setSession(null); }}`
- [x] T008 [P] [US1] Remove `VITE_CLIENT_ID=dev-client` and `VITE_CLIENT_SECRET=dev-secret-123` lines from `.env`
- [x] T009 [P] [US1] Remove same two variables from `.env.example`; update the file comment to note that authentication is now via `POST /auth/login` with username and password — no env vars required for auth
- [x] T010 [US1] Remove the `/token` proxy entry from `vite.config.ts` (the `'/token': { target: ..., ... }` block); leave the `/api` proxy unchanged

**Checkpoint**: User Story 1 complete — login, token storage, authenticated requests, error handling, and old credential removal all done

---

## Phase 3: User Story 2 — Session Persistence Within Tab (Priority: P2)

**Goal**: Verify that within a single browser tab, in-app navigation maintains the authenticated session and that an expired token causes automatic redirect to the login screen.

**Independent Test**: Log in. Navigate between pages using the sidebar. Verify no re-authentication is required. To test expiry: temporarily lower `expires_in` in the dev response (or mock), wait for expiry, then trigger any API call and verify the login screen appears automatically.

**Note**: No additional implementation code is required — session persistence within the same React tree is provided automatically by `useState` in `App.tsx`. Token expiry detection and the `auth:expired` event dispatch are already implemented in T003/T004. This phase is a validation checkpoint with one minor verification task.

### Implementation for User Story 2

- [x] T011 [US2] Verify integration of expiry mechanism: confirm `setTokenExpiry` is called in `src/api/auth.ts` login() (T005); confirm `isTokenExpired()` pre-check and 401 post-check dispatch `'auth:expired'` in `src/api/client.ts` (T004); confirm `App.tsx` listener catches the event and calls `clearAuthToken()` + `setSession(null)` (T007); fix any wiring gaps found during this review

**Checkpoint**: Session persistence verified — in-app navigation maintains auth; expiry redirects to login

---

## Phase 4: User Story 3 — Logout Clears Session (Priority: P3)

**Goal**: Ensure the explicit logout action clears both the in-memory Bearer token and the React session state, so the user must re-authenticate to regain access.

**Independent Test**: Log in. Click "Sair" in the sidebar. Verify the login screen appears. Attempt to navigate to a protected area — verify the login screen is still shown. Open browser devtools and confirm no `Authorization` header is sent after logout.

**Note**: The logout handler fix is already applied as part of T007 (`clearAuthToken()` + `setSession(null)`). This phase verifies and closes the loop on the previous bug where `clearAuthToken()` was never called on logout.

### Implementation for User Story 3

- [x] T012 [US3] Verify logout behavior end-to-end: confirm `onLogout` in `src/App.tsx` calls `clearAuthToken()` before `setSession(null)` (already done in T007); confirm `AppShell.tsx` `onClick={onLogout}` on the "Sair" button passes through correctly (no change needed); manually test the logout flow in browser and confirm no `Authorization` header appears in subsequent requests; if the `clearAuthToken()` call is missing from T007, add it now

**Checkpoint**: All three user stories independently functional — login, session persistence, and logout all verified

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, dead code removal, and spec documentation update

- [x] T013 [P] Search the codebase for any remaining references to `VITE_CLIENT_ID`, `VITE_CLIENT_SECRET`, `loginWithCredentials`, `/token` endpoint, or `client_credentials` grant type — remove any found instances
- [x] T014 [P] Update `specs/004-jwt-auth-login/checklists/requirements.md` to mark feature as implemented; verify all FR items (FR-001 through FR-008) are addressed
- [x] T015 Run TypeScript compiler (`npx tsc --noEmit`) and confirm zero type errors after all changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately; T001 and T002 can run in parallel
- **US1 (Phase 2)**: Requires Phase 1 complete — T005 depends on T003/T004 (setTokenExpiry); T006 depends on T005 (login function); T007 depends on T003 (clearAuthToken); T008/T009/T010 can run in parallel with T005-T007
- **US2 (Phase 3)**: Requires Phase 2 complete — T011 is a verification task
- **US3 (Phase 4)**: Requires Phase 2 complete — T012 is a verification/fix task
- **Polish (Phase 5)**: Requires all phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1 — no dependency on US2/US3
- **US2 (P2)**: Depends on Phase 1 implementation; US1 must be code-complete for wiring verification
- **US3 (P3)**: Depends on Phase 2 (App.tsx changes from T007)

### Within User Story 1

- T001/T002 in parallel → T003 → T004 → T005 → T006 → T007 (sequential, same files)
- T008, T009, T010 can run in parallel with T005-T007 (different files: .env, vite.config.ts)

---

## Parallel Execution Example: Phase 1

```
Launch in parallel:
  T001 — src/api/types.ts (add profile to ApiTokenResponse)
  T002 — src/types.ts (add profile to Session)

Then sequentially:
  T003 — src/api/client.ts (expiry tracking helpers)
  T004 — src/api/client.ts (expiry check + 401 dispatch in request())
```

## Parallel Execution Example: Phase 2 (US1)

```
Sequential (file dependencies):
  T005 — src/api/auth.ts
  T006 — src/pages/Login.tsx
  T007 — src/App.tsx

Launch in parallel with T005-T007:
  T008 — .env
  T009 — .env.example
  T010 — vite.config.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (T001–T004)
2. Complete Phase 2: User Story 1 (T005–T010)
3. **STOP and VALIDATE**: Log in with real credentials, confirm token in network inspector
4. Ship MVP — real authentication working

### Incremental Delivery

1. Phase 1 (Foundational) → types and client ready
2. Phase 2 (US1) → login works end-to-end (MVP)
3. Phase 3 (US2) → expiry/session verification
4. Phase 4 (US3) → logout verified
5. Phase 5 (Polish) → cleanup and type check

---

## Notes

- T001 and T002 touch different files — run in parallel
- T003 and T004 both touch `client.ts` — run sequentially
- T005, T006, T007 each touch different files but have logical dependencies — run sequentially
- T008, T009, T010 touch `.env`, `.env.example`, `vite.config.ts` — all independent, run in parallel
- Each [P] task = different file, no dependency on incomplete sibling tasks
- After T007, the old `loginWithCredentials` import is gone — TypeScript will error until T005 is also complete; do T005 before T007 or apply both atomically
