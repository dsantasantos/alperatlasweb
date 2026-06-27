# Quickstart: Alper Atlas Frontend — Generic Cockpit

**Branch**: `001-generic-cockpit` | **Date**: 2026-06-27

---

## Prerequisites

- Node.js 20+
- npm 10+

---

## 1. Install Dependencies

```bash
npm install
```

Install test dependencies (not yet in `package.json` — add once):

```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event \
  @vitest/coverage-v8 jsdom
```

---

## 2. Configure Vitest

Add to `vite.config.ts` (or create it if only `vite.config.js` exists):

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
});
```

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom';
```

Install jest-dom matchers:

```bash
npm install --save-dev @testing-library/jest-dom
```

---

## 3. Environment Variables

Create `.env.local` (not committed):

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 4. Run the Dev Server

```bash
npm run dev
```

Opens at `http://localhost:5173`.

---

## 5. Run Tests

```bash
npm run test          # watch mode
npm run test -- --run # single pass (CI)
npm run coverage      # coverage report
```

Add to `package.json` scripts:

```json
"test": "vitest",
"coverage": "vitest run --coverage"
```

---

## 6. Validate Schema-Driven Rendering

Smoke-check that the generic renderer is working end-to-end:

1. Start the dev server.
2. Log in with any valid session.
3. Open a batch — confirm the occurrence grid columns match the schema returned by
   `GET /schema/beneficiario-movimentacao`, not hardcoded labels.
4. Open an occurrence detail — confirm fields render in `displayOrder` order with
   canonical labels from the schema.
5. Find an occurrence with a blocking error — confirm the Approve button is disabled.
6. Toggle provenance — confirm the provenance chip appears/disappears per field.

---

## 7. Design System Token Validation

After aligning token hex values (see `research.md` § 1):

1. Open `src/styles/app.css` — confirm `--green`, `--navy`, `--teal` match the
   constitution values (`#06805B`, `#143D6B`, `#2C7A93`).
2. Open `tailwind.config.js` — confirm `alper.green`, `alper.navy`, `alper.teal`
   match the same values.
3. Hard-refresh the browser — topbar gradient should render in validated brand navy.

---

## 8. Linting

```bash
npm run lint
```

TypeScript strict mode is enforced. `no-any` ESLint rule MUST be enabled for contract
types (see `.eslintrc` setup in implementation tasks).
