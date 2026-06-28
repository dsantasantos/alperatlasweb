---
description: "Task list for Fix UI Bugs — Moviment Table & Modals"
---

# Tasks: Fix UI Bugs — Moviment Table & Modals

**Input**: Design documents from `specs/003-fix-moviment-ui-bugs/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅

**Tests**: Não solicitados na spec — tarefas de teste omitidas. Validação via inspeção visual após cada fase.

**Organization**: Tarefas agrupadas por User Story (US). As User Stories P1 (US1, US2) podem ser implementadas em paralelo pois afetam diferentes colunas. As P2 (US3/US4 compartilham o AuditDiaryPanel; US5 é independente).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências de tarefas incompletas)
- **[Story]**: Qual User Story esta tarefa pertence (US1–US5 conforme spec.md)

---

## Phase 1: Setup

**Purpose**: Sem infraestrutura nova — este feature é exclusivamente bug fixes em arquivos existentes. Fase satisfeita automaticamente.

- [x] T001 Confirmar que o branch `003-fix-moviment-ui-bugs` está ativo e o ambiente de dev está rodando (`npm run dev`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Identificar e documentar exatamente quais linhas de `app.css` e `CadastralMovimentDefaut.tsx` serão modificadas para evitar conflitos entre as tarefas paralelas.

**⚠️ CRÍTICO**: Nenhuma tarefa de US pode começar antes que T002 mapeie os intervalos de linha para evitar conflitos de edição simultânea.

- [x] T002 Ler `src/styles/app.css` e `src/pages/moviment/CadastralMovimentDefaut.tsx` e confirmar números de linha atuais dos trechos identificados no plan.md antes de qualquer edição

**Checkpoint**: Ambiente rodando + linhas mapeadas → implementação de User Stories pode começar em paralelo.

---

## Phase 3: User Story 1 — Coluna de Checkbox sem artefato visual (Priority: P1) 🎯 MVP

**Goal**: Remover a faixa cinza que aparece abaixo do cabeçalho da coluna de seleção entre o `<th>` e a primeira linha de dados.

**Independent Test**: Abrir a tela "Movimentação Cadastral (API)", verificar que a coluna de checkbox tem a mesma altura e fundo que as demais colunas do cabeçalho, sem nenhuma faixa cinza extra.

### Implementation for User Story 1

- [x] T003 [US1] Adicionar `height:42px` e `box-sizing:border-box` ao seletor `.grid thead th.w-chk` em `src/styles/app.css` (linha ~168) para fixar a altura do header e impedir que o `<input type="checkbox">` inflacione a linha
- [x] T004 [US1] Adicionar regra `input[type="checkbox"]` dentro do escopo `.grid thead th.w-chk` em `src/styles/app.css` com `width:16px; height:16px; display:block; margin:0` para dimensões explícitas e sem margem padrão do browser
- [x] T005 [US1] Inspecionar visualmente o resultado no browser: confirmar que não há faixa cinza entre o `<th>` de checkbox e o primeiro `<tr>` de dados; se o artefato persistir, adicionar `overflow:hidden` ao `.grid thead th` em `src/styles/app.css` (linha ~166)

**Checkpoint**: Coluna de seleção visualmente idêntica às demais colunas do cabeçalho, sem artefatos. ✅

---

## Phase 4: User Story 2 — Coluna "Tipo" com conteúdo e badge visual (Priority: P1)

**Goal**: Exibir o valor do campo `movementType` da API com o mesmo estilo de badge (cor + label PT) que a tela de referência `CadastralMoviment.tsx` usa para a coluna "Tipo".

**Independent Test**: Carregar um lote com ocorrências que possuam `movementType` definido e confirmar que a coluna "Tipo" mostra badges coloridos ("Inclusão" verde, "Alteração" âmbar, "Exclusão" rosa).

### Implementation for User Story 2

- [x] T006 [P] [US2] Adicionar constante `MOVEMENT_TYPE_META` logo após as importações em `src/pages/moviment/CadastralMovimentDefaut.tsx` (antes da linha do `AuditDiaryPanel`):
  ```ts
  const MOVEMENT_TYPE_META: Record<string, { label: string; cls: string }> = {
    New:    { label: 'Inclusão',  cls: 'tipo-inc' },
    Edit:   { label: 'Alteração', cls: 'tipo-alt' },
    Remove: { label: 'Exclusão',  cls: 'tipo-exc' },
  };
  ```
- [x] T007 [US2] Substituir `<td>{r.movementType ?? ''}</td>` (linha ~117 da função `Row`) em `src/pages/moviment/CadastralMovimentDefaut.tsx` por:
  ```tsx
  <td>
    {r.movementType && MOVEMENT_TYPE_META[r.movementType]
      ? <span className={'badge ' + MOVEMENT_TYPE_META[r.movementType].cls}>
          {MOVEMENT_TYPE_META[r.movementType].label}
        </span>
      : <span className="muted">—</span>}
  </td>
  ```
  usando as classes `.badge .tipo-inc .tipo-alt .tipo-exc` já definidas em `app.css`
- [x] T008 [US2] Verificar no TypeScript: `npm run lint` não deve reportar erros; confirmar que `MOVEMENT_TYPE_META` é acessível no escopo da função `Row` (pode precisar ser movido para fora do componente se definido dentro)

**Checkpoint**: Coluna "Tipo" exibe badges coloridos para todos os registros com `movementType` definido; registros sem o campo exibem "—". ✅

---

## Phase 5: User Stories 3 & 4 — Diário do Lote: refresh reativo e estilo correto (Priority: P2)

**Goal (US3)**: O painel "Diário do lote" se atualiza automaticamente após aprovar, rejeitar ou desabilitar ocorrências — sem necessidade de recarregar a página.

**Goal (US4)**: O painel "Diário do lote" tem aparência visual idêntica ao padrão da tela `CadastralMoviment.tsx`, usando tokens e variantes do design system.

**Independent Test**: (1) Executar uma aprovação em lote e confirmar que o painel do diário atualiza em < 3 s sem reload. (2) Comparar visualmente o painel com os componentes equivalentes de `CadastralMoviment.tsx` — tipografia, cores e espaçamento devem ser indistinguíveis.

### Implementation for User Stories 3 & 4

- [x] T009 [US3] Atualizar a função `refreshBatch` em `src/pages/moviment/CadastralMovimentDefaut.tsx` (linhas ~659–667) para incluir `batchesApi.audit(selBatchId)` no `Promise.all` e chamar `setAuditEntries(audit)` + `setAuditLoading(true/false)` conforme o contrato definido em `data-model.md`
- [x] T010 [P] [US4] Adicionar ao final da seção de componentes em `src/styles/app.css` (após linha ~326, antes do `@media`) as classes CSS do `AuditDiaryPanel`:
  ```css
  .audit-diary{background:#fff;border-bottom:1px solid var(--line);padding:10px 24px 0}
  .audit-diary-toggle{display:flex;align-items:center;gap:7px;width:100%;padding:8px 0 10px;font-size:13px;color:var(--navy);font-weight:600;background:none;border:none;cursor:pointer}
  .audit-diary-toggle:hover{color:var(--navy-d)}
  .audit-chevron{margin-left:auto;color:var(--soft)}
  .audit-diary-body{padding:4px 0 12px;display:flex;flex-direction:column}
  .audit-row{display:flex;align-items:baseline;gap:12px;padding:6px 0;border-bottom:1px solid var(--line2);font-size:12px;flex-wrap:wrap}
  .audit-row:last-child{border-bottom:0}
  .audit-at{color:var(--soft);white-space:nowrap;flex-shrink:0}
  .audit-type{font-weight:700;color:var(--navy);white-space:nowrap;flex-shrink:0}
  .audit-actor{color:var(--mute);white-space:nowrap;flex-shrink:0}
  .audit-desc{color:var(--slate);flex:1}
  ```
- [x] T011 [US4] Atualizar o componente `AuditDiaryPanel` em `src/pages/moviment/CadastralMovimentDefaut.tsx` (linhas ~47–73): o `<button>` de toggle deve remover qualquer classe ad-hoc e usar `className="audit-diary-toggle"` com o ícone, `<span className="sec-lbl">Diário do lote</span>` e o chevron com `className="audit-chevron"` — assegurando que o padrão visual use os tokens definidos
- [x] T012 [US3] Testar refresh reativo: realizar uma ação em lote (approve ou reject), observar que `auditLoading` aparece brevemente e que as novas entradas aparecem no painel sem reload da página

**Checkpoint**: Painel do diário atualiza após ações em lote E tem visual consistente com o design system. ✅

---

## Phase 6: User Story 5 — Área de Anotação no modal com layout correto (Priority: P2)

**Goal**: A seção de anotação dentro do drawer (modal de detalhes de uma ocorrência) segue exatamente o layout, alinhamento e variantes de componentes da tela `CadastralMoviment.tsx`.

**Independent Test**: Abrir o drawer de uma ocorrência e verificar que a seção "Histórico · auditoria e diário" exibe: lista de notas com meta (data/autor) + texto; campo textarea com borda, raio e padding idênticos ao `<input>` da referência; botão "Adicionar anotação" com mesmo tamanho e estilo dos demais `btn btn-ghost` do drawer.

### Implementation for User Story 5

- [x] T013 [P] [US5] Adicionar ao `src/styles/app.css` as classes da `NotesSection` (após as classes do `AuditDiaryPanel` adicionadas em T010):
  ```css
  .notes-section{display:flex;flex-direction:column;gap:10px}
  .notes-list{display:flex;flex-direction:column;gap:0}
  .note-item{display:flex;flex-direction:column;gap:2px;padding:8px 0;border-bottom:1px solid var(--line2)}
  .note-item:last-child{border-bottom:0}
  .note-meta{font-size:11px;color:var(--soft)}
  .note-text{font-size:14px;color:var(--slate);margin-top:2px}
  .note-input{border:1px solid var(--line);border-radius:9px;padding:8px 12px;resize:none;width:100%;font-size:14px;color:var(--slate);background:#fff}
  .note-input:focus{outline:none;border-color:var(--navy-200);box-shadow:0 0 0 3px var(--navy-50)}
  ```
- [x] T014 [US5] Atualizar o componente `NotesSection` em `src/pages/moviment/CadastralMovimentDefaut.tsx` (linhas ~192–226):
  - Trocar `className="note-input"` no `<textarea>` para que use a classe definida em T013
  - Garantir que o `<button>` de submit usa `className={'btn btn-ghost' + (!text.trim() || saving ? ' btn-disabled' : '')}` com ícone `check` e label "Adicionar anotação" — removendo a classe `save-btn` que causava sobreposição
  - Verificar que `<div className="notes-section">` envolve corretamente a lista de notas, o textarea e o botão
- [x] T015 [US5] Comparar visualmente o drawer aberto com `CadastralMoviment.tsx`: confirmar que a seção de anotação (campo + botão) é visualmente indistinguível da `.nota-row` + `.nota-btn` da referência em termos de tamanho, cor e espaçamento

**Checkpoint**: Seção de anotação no drawer é visualmente idêntica à referência `CadastralMoviment.tsx`. ✅

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação final, sem regressões, e limpeza.

- [x] T016 [P] Rodar `npm run lint` e `npm run build` em `C:\all-projects\alperatlasweb` para confirmar zero erros de TypeScript e lint em todos os arquivos alterados
- [x] T017 Validação visual completa em desktop (>1320px): navegar pelas 5 correções na ordem da spec — checkbox, Tipo, diário refresh, diário visual, anotação — confirmando cada critério de sucesso (SC-001 a SC-005 de `spec.md`)
- [x] T018 [P] Validação de não-regressão: confirmar que colunas dinâmicas (schema-driven), fluxo de aprovação em lote, export XLSX e demais campos do drawer continuam funcionando sem alteração de comportamento

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — pode começar imediatamente
- **Phase 2 (Foundational)**: Depende de Phase 1 — confirmar linhas antes de editar
- **Phases 3–6 (User Stories)**: Dependem de Phase 2; **podem rodar em paralelo** pois US1/US2 editam seções distintas do CSS e do componente, e US3/US4/US5 editam seções distintas do CSS
- **Phase 7 (Polish)**: Depende de todas as User Stories completas

### User Story Dependencies

- **US1 (P1)**: Independente — somente `app.css` seção `.w-chk`
- **US2 (P1)**: Independente — constante + 1 trecho do componente `Row`
- **US3 (P2)**: Independente de US1/US2 — somente `refreshBatch()` no componente
- **US4 (P2)**: Depende de T009 (US3) para o reset de estilo + requer o CSS novo de T010
- **US5 (P2)**: Independente das demais — seção de CSS separada + `NotesSection` component

### Within Each User Story

- CSS antes de componente (quando aplicável) — as classes devem existir antes de serem aplicadas
- Implementação antes de validação visual
- Confirmar no browser após cada fase

### Parallel Opportunities

- T003 + T006 + T010 + T013: todos adicionam CSS em seções não-sobrepostas de `app.css` — **podem rodar em paralelo**
- T007 + T006 (US2 + US4): arquivos distintos ou seções distintas — **paralelos**
- T016 + T018 (polish): verificações independentes — **paralelas**

---

## Parallel Example: Phases 3 & 4 em paralelo

```
Desenvolvedor A (US1 — Checkbox):
  → T003: CSS height fix para .w-chk header
  → T004: CSS para checkbox dimensions
  → T005: Validação visual

Desenvolvedor B (US2 — Tipo):
  → T006: Constante MOVEMENT_TYPE_META
  → T007: Substituição da célula <td> no Row
  → T008: npm run lint
```

---

## Implementation Strategy

### MVP (US1 + US2 — ambos P1)

1. Complete Phase 1 (T001)
2. Complete Phase 2 (T002)
3. **Parallel**: Complete Phase 3 (T003–T005) + Phase 4 (T006–T008)
4. **VALIDAR**: Checkbox sem artefato + coluna Tipo com badge
5. Prosseguir para Phases 5–6 se aprovado

### Incremental Delivery

1. Setup + Foundational → ambiente pronto
2. US1 (checkbox) → validar → commit
3. US2 (tipo badge) → validar → commit
4. US3+US4 (diário: refresh + estilo) → validar → commit
5. US5 (anotação modal) → validar → commit
6. Polish → lint + build + regressão → PR

### Sequência de edição recomendada (single developer)

Para evitar conflitos de edição em `app.css`, seguir esta ordem:
1. T003–T004 (CSS checkbox)
2. T010 (CSS audit diary) + T013 (CSS notes) — adicionar os dois blocos CSS juntos ao final de `app.css`
3. T006–T007 (componente Row — badge tipo)
4. T009 (refreshBatch)
5. T011 (AuditDiaryPanel styling)
6. T014 (NotesSection styling)
7. T005, T008, T012, T015 (validações visuais)
8. T016–T018 (polish)

---

## Notes

- `[P]` = tarefas em arquivos diferentes ou seções distintas, sem dependências — podem rodar em paralelo
- `[Story]` mapeia cada tarefa à User Story da spec.md para rastreabilidade
- Nenhuma tarefa de test foi gerada (não solicitado na spec)
- Commit após cada fase ou grupo lógico
- `CadastralMoviment.tsx` é a referência visual canônica — **não alterar este arquivo**
- Todos os valores de tipo usados nas badges (`tipo-inc`, `tipo-alt`, `tipo-exc`, `badge`) já existem em `app.css` — nenhuma classe duplicada será criada
