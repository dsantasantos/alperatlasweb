# Quickstart: Limit Moviment Default Table Columns

## Dev Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and navigate to the Cadastral Moviment Default page.

## Verifying the Change

1. With the app running, open the Moviment Default cockpit.
2. Count the column headers between "Tipo" and "Conferência" — there should be at most 5.
3. Click any row to open the detail modal and verify all schema fields appear (more than 5 if the schema has them).

## Running Tests

```bash
npm test
```

The test for `Row` column capping lives in the existing test suite for `CadastralMovimentDefaut`.
