# Research: Fix UI Bugs — Moviment Table & Modals

**Date**: 2026-06-28 | **Feature**: `003-fix-moviment-ui-bugs`

## Decision 1 — Bug 1: Estratégia para corrigir o artefato cinza no header de checkbox

**Decision**: Adicionar `height` explícito à `.grid thead th.w-chk` e garantir que o `<input type="checkbox">` esteja `display:block` com dimensões fixas (16×16px), sem alterar o `display:flex` do container.

**Rationale**: O problema está na inflação da altura do `<th>` pelo checkbox (que tem dimensões variáveis por browser). Fixar a altura do `<th>` de 42px (mesma das demais `<th>`) e centralizar o checkbox via flex resolve sem mudar a estrutura do componente.

**Alternatives considered**:
- Remover `display:flex` do `.w-chk` header → rejeitado: perde centralização vertical do checkbox.
- Usar `overflow:hidden` no thead → rejeitado: pode mascarar outros problemas de alinhamento.

---

## Decision 2 — Bug 2: Mapeamento de movementType para badge

**Decision**: Criar constante `MOVEMENT_TYPE_META` em `CadastralMovimentDefaut.tsx` mapeando os valores da API (`"New"`, `"Edit"`, `"Remove"`) para labels em português e classes badge existentes:

```
"New"    → { label: "Inclusão", cls: "tipo-inc" }
"Edit"   → { label: "Alteração", cls: "tipo-alt" }
"Remove" → { label: "Exclusão", cls: "tipo-exc" }
```

Reutiliza exatamente as classes `.tipo-inc`, `.tipo-exc`, `.tipo-alt` e `.badge` já existentes em `app.css`.

**Rationale**: Consistência visual com a tela de referência `CadastralMoviment.tsx` que usa o mesmo sistema de badge. Os valores da API são em inglês (conforme contrato `api/types.ts` linha 59) mas o display é sempre em português (Princípio III — labels canônicos).

**Alternatives considered**:
- Exibir valor bruto da API com texto puro → rejeitado: sem destaque visual, parece "vazio" e viola Princípio II.
- Criar novas classes CSS → rejeitado: as classes `.tipo-inc/alt/exc` + `.badge` já estão no sistema; criar duplicatas viola Princípio II.

---

## Decision 3 — Bug 3a: Estratégia de refresh do diário após ações em lote

**Decision**: Incluir `batchesApi.audit(selBatchId)` no `Promise.all` existente dentro de `refreshBatch()` e chamar `setAuditEntries(audit)` com o resultado. Também adicionar loading state (`setAuditLoading(true/false)`) durante o refresh.

**Rationale**: `refreshBatch()` já é o ponto central de re-fetch após todas as ações em lote (approve, reject, disable). Adicionar o audit ao mesmo `Promise.all` mantém atomicidade e não aumenta a latência percebida.

**Alternatives considered**:
- Polling periódico do diário (ex: `setInterval`) → rejeitado: desnecessário, aumenta carga e complexidade.
- Evento/callback separado para cada ação → rejeitado: redundante com o `refreshBatch` já existente.
- Otimistic update do diário local sem re-fetch → rejeitado: o servidor é autoritativo sobre o estado do audit.

---

## Decision 4 — Bug 3b: Estilo do AuditDiaryPanel

**Decision**: Adicionar classes CSS específicas em `app.css` para o `AuditDiaryPanel`. O painel ficará no posicionamento atual (inline, acima da filterbar), estilizado como um painel colapsável com:
- Container `.audit-diary`: `background:#fff; border-bottom:1px solid var(--line); padding:10px 24px`
- Toggle `.audit-diary-toggle`: usa `.btn .btn-ghost` + layout flex com ícone + label + chevron
- Corpo `.audit-diary-body`: lista de entries com fonte 12px e cores `--soft`/`--slate`
- Cada entry `.audit-row`: `display:flex; gap:12px; padding:6px 0; border-bottom:1px solid var(--line2); font-size:12px`

**Rationale**: O painel inline colapsável é mais ergonômico que um modal (usuário não precisa abrir/fechar para consultar o histórico enquanto trabalha). O botão de toggle usa as classes já existentes `btn btn-ghost` para fidelidade ao design system.

**Alternatives considered**:
- Voltar para DiaryModal (igual à referência seed) → rejeitado: o panel inline é superior em UX para auditoria contínua; a referência usa modal por limitação de layout, não por design.
- Usar componente `<Modal>` como na referência → rejeitado: seria regressão de UX.

---

## Decision 5 — Bug 4: Estilo da NotesSection

**Decision**: Adicionar CSS completo para as classes do `NotesSection` em `app.css`, mantendo o `<textarea>` (mais funcional que `<input>` para notas longas), mas com estilos idênticos ao padrão da referência:

```css
.notes-section { display:flex; flex-direction:column; gap:8px }
.notes-list    { display:flex; flex-direction:column; gap:8px }
.note-item     { display:flex; flex-direction:column; gap:2px; border-bottom:1px solid var(--line2); padding-bottom:8px }
.note-meta     { font-size:11px; color:var(--soft) }
.note-text     { font-size:14px; color:var(--slate) }
.note-input    { border:1px solid var(--line); border-radius:9px; padding:8px 12px; resize:none; width:100% }
.note-input:focus { outline:none; border-color:var(--navy-200) }
```

O botão usa `btn btn-ghost` com ícone check (já existe no design system).

**Rationale**: Manter `<textarea>` é mais ergonômico para notas do que `<input>` single-line. Os estilos CSS novos espelham exatamente os tokens de `.nota-row input` e `.nota-btn` da referência.

**Alternatives considered**:
- Substituir `<textarea>` por `<input>` e usar `.nota-row`/`.nota-btn` diretamente → viável mas perde capacidade de nota longa; rejeitado por regressão de UX.
- Usar `style` inline → rejeitado: viola Princípio II (design system como fonte única de verdade).
