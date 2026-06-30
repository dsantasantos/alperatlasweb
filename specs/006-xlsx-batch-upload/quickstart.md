# Quickstart: XLSX Batch Upload

**Feature**: 006-xlsx-batch-upload
**Date**: 2026-06-29

## Dev Setup

No new dependencies required. Stack is unchanged: React 18 + TypeScript + Vite + Tailwind.

```bash
npm install     # if not already done
npm run dev     # starts Vite dev server
```

## Manual Test Checklist

1. Navigate to the Cadastral Moviment Default screen.
2. Select any batch in the left rail.
3. Verify "Importar planilha" button appears between "Diário do lote" and "Exportar XLSX".
4. Click "Importar planilha" — modal opens with 6 fields all empty.
5. Click "Salvar" without filling anything — error message appears, no request sent.
6. Select a non-xlsx file — error message "O arquivo deve ter extensão .xlsx." appears.
7. Select a valid `.xlsx` file > 10 MB — error message about size limit appears.
8. Fill all fields with a valid `.xlsx` file ≤ 10 MB and click "Salvar".
9. Loading indicator appears; "Salvar" disabled.
10. On success: modal closes, toast "Lote importado com sucesso" appears, new batch is selected in the left rail.
11. On server error: modal stays open, error message from server displayed.
12. Click "Cancelar" — modal closes, no request sent, existing selection unchanged.

## Test File

Create a minimal `.xlsx` test file:
- Any spreadsheet with at least one row of data
- Keep under 10 MB for happy-path test
- For size limit test: any file renamed to `.xlsx` that exceeds 10 MB

## Running Tests

```bash
npm test        # or: npx vitest run
```

Tests for `XlsxUploadModal` will be in the existing test file for `CadastralMovimentDefaut` (or a sibling test file if one exists).
