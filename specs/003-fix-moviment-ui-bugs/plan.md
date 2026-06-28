# Implementation Plan: Fix UI Bugs — Moviment Table & Modals

**Branch**: `003-fix-moviment-ui-bugs` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-fix-moviment-ui-bugs/spec.md`

## Summary

Correção de 4 grupos de bugs visuais e comportamentais introduzidos na implementação API-based da tela `CadastralMovimentDefaut.tsx`. Os problemas raiz são: (1) header da coluna de seleção com artefato visual por alinhamento CSS; (2) coluna "Tipo" sem badge/mapeamento de valores da API; (3) `AuditDiaryPanel` sem classes CSS definidas e sem refresh reativo após ações; (4) `NotesSection` usando classes CSS inexistentes em vez das classes do design system da tela de referência `CadastralMoviment.tsx`.

## Technical Context

**Language/Version**: TypeScript 6.0 / React 19.1

**Primary Dependencies**: React 19.1, Tailwind CSS 3.4, Vite 7.0

**Storage**: N/A — estado em memória, hidratado da API; nenhum `localStorage`/`sessionStorage`

**Testing**: Vitest 4.1 + @testing-library/react 16.3

**Target Platform**: Web browser, desktop-first, responsivo

**Project Type**: Web application (frontend-only, API integration)

**Performance Goals**: Interação padrão de web app; refresh do diário em < 3 s após ação

**Constraints**: Design System Fidelity (Princípio II); Schema-Driven rendering (Princípio I) — nenhum campo hardcoded; nenhum `any` em dados de contrato (Princípio IV)

**Scale/Scope**: Apenas dois arquivos críticos: `CadastralMovimentDefaut.tsx` + `app.css`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|-----------|--------|------------|
| I — Schema-Driven | ✅ | `movementType` vem da API; badge usa mapeamento genérico, não hardcode de negócio |
| II — Design System Fidelity | ⚠️ GATE | Bug 3b e Bug 4: classes CSS inexistentes violam o princípio. Correção obrigatória antes de merge |
| III — Single Canonical Surface | ✅ | Nenhuma mudança de rótulo de campo |
| IV — Component Isolation & Typed Contracts | ✅ | `movementType?: string` já existe no contrato; nenhum `any` introduzido |
| V — Test Discipline | ⚠️ | Cobertura de renderização do badge Tipo e comportamento do refresh do diário deve ser adicionada |
| VI — A11y & UX | ✅ | Correções melhoram UX (refresh automático, layout coerente) |
| VII — AI-Readiness | ✅ | Sem impacto |

**Gate status**: 2 itens pendentes (II, V) — resolvidos pelas tarefas de implementação abaixo.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-moviment-ui-bugs/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (files alterados)

```text
src/
├── pages/moviment/
│   ├── CadastralMoviment.tsx          # referência visual (NÃO alterar)
│   └── CadastralMovimentDefaut.tsx    # alvo das 4 correções
└── styles/
    └── app.css                        # classes CSS a adicionar/corrigir
```

## Root Cause Diagnosis

### Bug 1 — Artefato cinza na coluna de checkbox

**Arquivo**: `CadastralMovimentDefaut.tsx` linha 847–858 + `app.css` linhas 166–170

**Causa**: O `<th className="w-chk">` recebe `display:flex;align-items:center;justify-content:center` via `.grid thead th.w-chk` (app.css linha 168). O `<SelectAllCheckbox>` renderiza um `<input type="checkbox">` que, sob Tailwind preflight + box-sizing reset, pode alterar a altura da linha de cabeçalho. Como o `<thead>` é `display:block` e `background:#f3f4f6`, qualquer height extra na `<th>` manifesta-se como uma faixa cinza visível logo abaixo do cabeçalho, especialmente quando o sticky header (z-index:5) não tem `overflow:hidden`.

**Fix**: Adicionar `overflow:hidden` ao `.grid thead th` e garantir `line-height:0` ou `height` fixo no `.w-chk` do thead para que o checkbox não inflacione a linha. Alternativamente, usar `vertical-align:middle` + `padding` explícito.

### Bug 2 — Coluna "Tipo" sem conteúdo

**Arquivo**: `CadastralMovimentDefaut.tsx` linha 117

**Causa dupla**:
1. `r.movementType` é `?: string` (opcional) — pode chegar `undefined` da API; o `?? ''` retorna string vazia mas não exibe nada visível.
2. O valor da API é em inglês (`"New" | "Edit" | "Remove"`) enquanto a referência usa badge com labels em português + cores (`.tipo-inc`, `.tipo-exc`, `.tipo-alt`). Mesmo quando o valor chega, é exibido como texto puro sem qualquer destaque visual, o que pode parecer "vazio" em algumas fontes/zooms.

**Fix**:
- Criar mapeamento `movementTypeMeta` (English key → label PT + badge class) análogo ao `tipoCls` de `seed.ts`.
- Substituir `<td>{r.movementType ?? ''}</td>` por `<td><MovementTypeBadge type={r.movementType} /></td>`.
- Reutilizar as classes `.badge .tipo-inc .tipo-exc .tipo-alt` já definidas em `app.css`.

### Bug 3a — Diário do lote sem refresh automático

**Arquivo**: `CadastralMovimentDefaut.tsx` linhas 659–700

**Causa**: `refreshBatch()` (linha 659) busca apenas `batchesApi.detail` e `batchesApi.summary`. Ações em lote (`bulkApprove`, `bulkReject`, `bulkDisable`) chamam `refreshBatch()` mas nunca re-buscam `batchesApi.audit(selBatchId)`. O `auditEntries` state só é atualizado no `useEffect` da seleção de lote.

**Fix**: Incluir `batchesApi.audit(selBatchId)` no `Promise.all` dentro de `refreshBatch` e atualizar `setAuditEntries` com o resultado.

### Bug 3b — Diário do lote visualmente fora do padrão

**Arquivo**: `CadastralMovimentDefaut.tsx` linhas 47–73 + `app.css` (ausência de classes)

**Causa**: `AuditDiaryPanel` usa classes `.audit-diary`, `.audit-diary-toggle`, `.audit-diary-body`, `.audit-row`, `.audit-at`, `.audit-type`, `.audit-actor`, `.audit-desc`, `.audit-chevron` que **não existem** em `app.css`. O componente é renderizado sem qualquer estilo, aparecendo como texto bruto com botão padrão do browser.

**Fix**: Adicionar ao `app.css` as classes do diary panel, usando os mesmos tokens de design system (cores `--navy`, `--line`, `--soft`, font-size 11–13px, `border-radius:9px`) que os demais componentes usam. O botão de toggle deve usar `.btn .btn-ghost` ou variante equivalente.

### Bug 4 — Anotação bagunçada no modal

**Arquivo**: `CadastralMovimentDefaut.tsx` linhas 192–226 + `app.css`

**Causa**: `NotesSection` usa classes `.notes-section`, `.notes-list`, `.note-item`, `.note-meta`, `.note-text`, `.note-input` que **não existem** em `app.css`. A referência `CadastralMoviment.tsx` usa `.nota-row` e `.nota-btn` que já existem e estão estilizados. O campo de texto usa `<textarea rows={2}>` enquanto a referência usa `<input>` single-line — a mudança para textarea sem CSS correto faz a seção se expandir de forma desestruturada no drawer.

**Fix**: 
- Adicionar CSS para `.notes-section`, `.notes-list`, `.note-item`, `.note-meta`, `.note-text`, `.note-input` seguindo exatamente os tokens da referência.
- O campo de anotação pode permanecer como `<textarea>` (mais funcional para notas longas) desde que tenha `resize:none`, `border-radius:9px`, `border:1px solid var(--line)` e `padding:8px 12px` (mesmo padrão da `.nota-row input`).
- O botão Adicionar deve usar `btn btn-ghost` com tamanho compact, idêntico ao padrão do drawer de referência.

## Phase 0: Research

Ver `research.md` para decisões e alternativas avaliadas.

## Phase 1: Design Artifacts

### data-model.md

Não há novos modelos de dados — as correções são puramente de UI e comportamento reativo. O contrato `ApiOccurrenceListItem.movementType?: string` já existe e é adequado. Ver `data-model.md` para mapeamento de valores.

### Contracts

Nenhuma interface nova. Todas as correções usam contratos existentes (`batchesApi.audit`, `occurrencesApi`, `ApiOccurrenceListItem`).
