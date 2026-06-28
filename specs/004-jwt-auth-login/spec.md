# Feature Specification: JWT Auth Login Migration

**Feature Branch**: `004-jwt-auth-login`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Migrate login to use /auth/login endpoint with JWT Bearer token, removing old hardcoded admin/password auth model"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticate via Login Endpoint (Priority: P1)

A user opens the application and enters their credentials on the login screen. The system submits those credentials to the `/auth/login` endpoint, receives a JWT Bearer token, and grants access to the application. All subsequent API calls are authorized using that token.

**Why this priority**: This is the core authentication flow. Without it, no user can access the application. It replaces the previously hardcoded credentials entirely.

**Independent Test**: Can be fully tested by submitting valid credentials on the login screen and verifying the user is redirected to the main cockpit view with a valid session.

**Acceptance Scenarios**:

1. **Given** the user is on the login screen, **When** they enter valid credentials and submit, **Then** the system calls `/auth/login`, stores the received `access_token`, and navigates to the authenticated area.
2. **Given** the user has an active session token, **When** they navigate within the application, **Then** all API requests include the `Authorization: Bearer <access_token>` header.
3. **Given** the user submits invalid credentials, **When** the `/auth/login` endpoint returns an error, **Then** the login screen displays an appropriate error message without exposing internal details.
4. **Given** the user's token has expired (after `expires_in` seconds), **When** they attempt any authenticated action, **Then** the system redirects them back to the login screen.

---

### User Story 2 - Session Persistence Within Tab (Priority: P2)

After logging in, the user can refresh the page or navigate within the same browser tab and remain authenticated without needing to log in again, for as long as the token is valid.

**Why this priority**: Without in-session persistence the user would be forced to re-authenticate on every navigation, making the application unusable. This is secondary only because it depends on Story 1.

**Independent Test**: Log in successfully, then refresh the page and verify the user remains in the authenticated view.

**Acceptance Scenarios**:

1. **Given** the user is logged in, **When** they refresh the page, **Then** the session is restored and the user remains authenticated.
2. **Given** the token's `expires_in` period has elapsed, **When** the user refreshes, **Then** the session is considered expired and the user is redirected to login.

---

### User Story 3 - Logout Clears Session (Priority: P3)

A user who explicitly logs out has their session token cleared, so any subsequent navigation requires re-authentication.

**Why this priority**: Logout is a basic security requirement. Lower priority than login itself but must be functional for a complete auth flow.

**Independent Test**: Log in, click logout, then attempt to navigate to a protected route and verify the user is redirected to the login screen.

**Acceptance Scenarios**:

1. **Given** the user is authenticated, **When** they click logout, **Then** the stored token is cleared and the user is redirected to the login screen.
2. **Given** the user has logged out, **When** they attempt to access a protected route directly, **Then** they are redirected to the login screen.

---

### Edge Cases

- What happens when the `/auth/login` endpoint is unreachable (network error)? The login form shows a connection error message; no partial session is created.
- What happens when the server returns an unexpected response shape (missing `access_token`)? The login is treated as failed; an error is shown.
- What happens if the user opens the app in multiple tabs? Each tab uses the same in-memory token; a logout in one tab does not automatically expire others (out of scope for this feature).
- What happens when a token expires mid-session while the user is idle? The next API call fails with a 401 and the user is redirected to login.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST authenticate users exclusively via the `/auth/login` endpoint — all previous hardcoded credential logic must be removed.
- **FR-002**: The system MUST store the `access_token` from the login response in application memory (not in `localStorage` or `sessionStorage`, per the project constitution).
- **FR-003**: The system MUST attach the `access_token` as a `Bearer` token in the `Authorization` header for every authenticated API request.
- **FR-004**: The system MUST respect the `expires_in` value (in seconds) from the login response to determine session validity and trigger re-authentication when the token expires.
- **FR-005**: The system MUST clear the stored token and redirect the user to the login screen upon logout or token expiry.
- **FR-006**: The system MUST display a user-friendly error message when login fails (invalid credentials or network error), without exposing internal details.
- **FR-007**: The system MUST remove all code, types, constants, and configuration previously used for the hardcoded admin/password authentication model.
- **FR-008**: The `profile` field returned by `/auth/login` MUST be stored alongside the token and made available to authenticated views that require user context.

### Key Entities

- **AuthSession**: Represents the authenticated state — holds `access_token`, `token_type`, `expires_in`, expiry timestamp (derived), and `profile`.
- **LoginCredentials**: The input provided by the user — username/email and password submitted to `/auth/login`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the login flow (enter credentials → authenticated view) in under 5 seconds under normal network conditions.
- **SC-002**: Zero instances of hardcoded credential logic remain in the codebase after the migration.
- **SC-003**: All authenticated API calls carry a valid `Authorization: Bearer` header — verifiable via browser network inspector.
- **SC-004**: A user whose token has expired is automatically redirected to login within one navigation action, with no data loss on the current view beyond the session itself.
- **SC-005**: The login error state is reachable and displays a message within 3 seconds of a failed credential submission.

## Assumptions

- The `/auth/login` endpoint accepts credentials as a standard form or JSON body (the exact request shape will be confirmed during implementation by reading the existing API contract or backend spec).
- The `profile` field in the login response is a string (e.g., a role or display name); its exact structure will be treated as opaque until confirmed.
- Multi-tab session synchronization is out of scope for this feature.
- Password change, user creation, and user management are explicitly out of scope.
- The token is held in React application state (in-memory) and is not persisted to browser storage, in compliance with the project constitution's Technical Constraints.
- Session restoration on page refresh is limited to the token lifetime; no refresh-token flow is included in this feature.
