# Quickstart: CadastralMovimentDefaut — Development Setup

**Branch**: `002-api-moviment-default` | **Date**: 2026-06-27 | **Last Updated**: 2026-06-28

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

**Schema & table layout**

1. Navigate to the new screen.
2. Open the browser Network tab — confirm `GET /api/schemas/cadastral-movement` fires
   on mount (once) and `GET /api/batches` fires in parallel.
3. Confirm the batch rail populates from the API (not hardcoded seed).
4. Select a different batch — confirm **no second** `GET /api/schemas/...` request fires
   (schema is cached for the session).
5. Confirm the first data column is `movementType` showing "New", "Edit", or "Remove".
6. Confirm the middle columns use `displayLabel` values from the schema response.
7. Confirm "Conferência" and "Status" are always the last two columns.

**Audit diary panel**

8. Confirm the diary panel appears at the top of the screen above the table.
9. Open the Network tab — confirm `GET /api/batches/{id}/audit` fires when a batch
   is selected and re-fires on batch switch.
10. Confirm the panel shows `changedAt`, `changeType`, `actorId`, and `description`
    for each audit entry.
11. Click the collapse/expand toggle — confirm the panel hides/shows correctly.
12. Confirm a diary fetch error shows an error state in the panel but the table still loads.

**Occurrence detail drawer & notes**

13. Click a row — confirm the drawer loads from `GET /api/occurrences/{id}`.
14. Confirm form fields in the drawer match the schema field list, in `displayOrder`.
15. Confirm `date`/`datetime` fields render a date picker; all others render text inputs.
16. Scroll to the bottom of the drawer — confirm the "Histórico · auditoria e diário"
    section appears below the divider with embedded notes from the detail response.
17. Add a note — confirm `POST /api/occurrences/{id}/notes` is called and the notes
    list refreshes (new note appears) without closing the drawer.
18. Attempt to submit an empty note — confirm the submit button is disabled.
19. Edit a field and save — confirm `PATCH /fields/{key}` is called and validations
    update in the drawer without a full reload.

**Single-occurrence actions**

20. Approve a non-blocked occurrence — confirm `POST /approve` succeeds and the row
    updates to "Aprovado".
21. Reject an occurrence — confirm the reason modal appears and `POST /reject` is called.
22. Click "Exportar XLSX" — confirm an XLSX file downloads.

**Batch actions with checkboxes**

23. Check 2–3 rows individually — confirm the header checkbox shows indeterminate state.
24. Click the header checkbox — confirm all visible rows are selected (header = checked).
25. Click header checkbox again — confirm all rows are deselected.
26. Select 2 rows and click "Batch Approve" — confirm a single `POST /api/occurrences/batch/approve`
    fires with both IDs; both rows update to "Aprovado".
27. Select 2 rows and click "Batch Reject" — confirm the reason modal appears; on
    confirm a single `POST /api/occurrences/batch/reject` fires with both IDs and
    the `reason` field; both rows update to "Rejeitado".
28. Select 2 rows and click "Batch Disable" — confirm `POST /api/occurrences/batch/disable`
    fires with both IDs; both rows update to "Desabilitado".
29. With no rows selected — confirm batch action buttons are disabled or hidden.

---

## 8. Auth Error State

If the API returns 401 (no token or expired token), the screen displays a persistent
error banner:

> "Não autenticado. Configure VITE_API_BASE_URL e o token Bearer."

This is the expected behavior when the token is not set.
