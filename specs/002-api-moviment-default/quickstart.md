# Quickstart: CadastralMovimentDefaut — Development Setup

**Branch**: `002-api-moviment-default` | **Date**: 2026-06-27

---

## 1. Prerequisites

- Node.js 20+ / npm 10+
- A running instance of the Atlas backend API
- Valid OAuth2 `client_id` and `client_secret` for the backend

---

## 2. Environment Configuration

Create `.env.local` in the project root (not committed):

```
VITE_API_BASE_URL=http://localhost:5000
```

Replace `http://localhost:5000` with the actual backend base URL.

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Wire Up the Auth Token

The new screen uses an in-memory token. To connect to a real API you need to obtain a
token before mounting the screen. Quick way to test in the browser console:

```ts
// In browser devtools console after the app loads:
import { setAuthToken } from '/src/api/client.ts';
setAuthToken('YOUR_BEARER_TOKEN_HERE');
// Then navigate to the CadastralMovimentDefaut page
```

For a proper integration, call `loginWithCredentials(clientId, secret)` from
`src/api/auth.ts` in the login flow before routing to the screen.

---

## 5. Register the Screen in AppShell

Add a nav entry and render condition in `src/components/layout/AppShell.tsx`:

```tsx
// In NAV array:
{ id: 'cadastral-moviment-default', label: 'Movimentação Cadastral (API)', icon: 'package' }

// In shell-content:
{activePage === 'cadastral-moviment-default' && <CadastralMovimentDefaut />}
```

Import at the top:
```tsx
import CadastralMovimentDefaut from '../../pages/moviment/CadastralMovimentDefaut';
```

---

## 6. Run the Dev Server

```bash
npm run dev
```

Opens at `http://localhost:5173`. Navigate to **Movimentação Cadastral (API)** in the
sidebar after logging in.

---

## 7. Smoke-Check Validation

1. Navigate to the new screen.
2. Open the browser Network tab — confirm `GET /api/schemas/cadastral-movement` fires
   on mount (once) and `GET /api/batches` fires in parallel.
3. Confirm the batch rail populates from the API (not hardcoded seed).
4. Select a different batch — confirm **no second** `GET /api/schemas/...` request fires
   (schema is cached for the session).
5. Confirm the occurrence table columns (excluding the last two) use `displayLabel`
   values from the schema response — no hardcoded labels like "Beneficiário".
6. Confirm "Conferência" and "Status" are the last two columns in every table.
7. Click a row — confirm the drawer loads from `GET /api/occurrences/{id}`.
8. Confirm form fields in the drawer match the schema field list, in `displayOrder`.
9. Confirm `date`/`datetime` fields render a date picker; all others render text inputs.
10. Edit a field and save — confirm `PATCH /fields/{key}` is called and validations
    update in the drawer without a full reload.
11. Approve a non-blocked occurrence — confirm `POST /approve` succeeds and the row
    updates to "Aprovado".
12. Reject an occurrence — confirm the reason modal appears and `POST /reject` is called.
13. Click "Exportar XLSX" — confirm an XLSX file downloads.

---

## 8. Auth Error State

If the API returns 401 (no token or expired token), the screen displays a persistent
error banner:

> "Não autenticado. Configure VITE_API_BASE_URL e o token Bearer."

This is the expected behavior when the token is not set.
