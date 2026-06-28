# Data Model: Fix UI Bugs — Moviment Table & Modals

**Date**: 2026-06-28 | **Feature**: `003-fix-moviment-ui-bugs`

Não há novos modelos de dados. As correções são de UI e comportamento reativo. Abaixo estão os mapeamentos e contratos relevantes para a implementação.

---

## movementType Mapping

O campo `movementType?: string` em `ApiOccurrenceListItem` (`api/types.ts:59`) contém valores em inglês vindos da API. Mapeamento canônico para exibição:

| API value | Label (PT) | Badge class | CSS background / color |
|-----------|-----------|-------------|------------------------|
| `"New"`    | Inclusão  | `tipo-inc`  | `var(--green-50)` / `var(--green-d)` |
| `"Edit"`   | Alteração | `tipo-alt`  | `var(--amber-50)` / `var(--amber)`   |
| `"Remove"` | Exclusão  | `tipo-exc`  | `var(--rose-50)` / `var(--rose)`     |
| `undefined` / outro | — | (sem badge) | — |

Implementado como constante `MOVEMENT_TYPE_META` em `CadastralMovimentDefaut.tsx`:

```ts
const MOVEMENT_TYPE_META: Record<string, { label: string; cls: string }> = {
  New:    { label: 'Inclusão',  cls: 'tipo-inc' },
  Edit:   { label: 'Alteração', cls: 'tipo-alt' },
  Remove: { label: 'Exclusão',  cls: 'tipo-exc' },
};
```

---

## CSS Classes a Adicionar em app.css

### AuditDiaryPanel (Bug 3b)

| Classe | Propósito | Estilo-base |
|--------|-----------|-------------|
| `.audit-diary` | Container do painel | `background:#fff; border-bottom:1px solid var(--line); padding:10px 24px 0` |
| `.audit-diary-toggle` | Botão de expandir/colapsar | Segue `.btn .btn-ghost` + gap + padding compact |
| `.audit-chevron` | Ícone chevron no toggle | `margin-left:auto; color:var(--soft)` |
| `.audit-diary-body` | Área de entries | `padding:8px 0 12px; display:flex; flex-direction:column; gap:0` |
| `.audit-row` | Uma entrada do diário | `display:flex; gap:12px; padding:6px 0; border-bottom:1px solid var(--line2); font-size:12px; flex-wrap:wrap` |
| `.audit-at` | Timestamp da entry | `color:var(--soft); white-space:nowrap` |
| `.audit-type` | Tipo do evento | `font-weight:600; color:var(--navy); white-space:nowrap` |
| `.audit-actor` | Ator | `color:var(--mute)` |
| `.audit-desc` | Descrição livre | `color:var(--slate); flex:1` |

### NotesSection (Bug 4)

| Classe | Propósito | Estilo-base |
|--------|-----------|-------------|
| `.notes-section` | Container da seção | `display:flex; flex-direction:column; gap:10px` |
| `.notes-list` | Lista de notas existentes | `display:flex; flex-direction:column; gap:8px` |
| `.note-item` | Uma nota individual | `display:flex; flex-direction:column; gap:2px; padding-bottom:8px; border-bottom:1px solid var(--line2)` |
| `.note-meta` | Meta da nota (data, autor) | `font-size:11px; color:var(--soft)` |
| `.note-text` | Texto da nota | `font-size:14px; color:var(--slate)` |
| `.note-input` | Campo textarea de nova nota | `border:1px solid var(--line); border-radius:9px; padding:8px 12px; resize:none; width:100%; font-size:14px` |
| `.note-input:focus` | Focus state | `outline:none; border-color:var(--navy-200); box-shadow:0 0 0 3px var(--navy-50)` |

---

## Contratos de API Utilizados (sem alteração)

| Endpoint | Método | Uso |
|----------|--------|-----|
| `GET /api/batches/{id}/audit` | `batchesApi.audit(id)` | Busca entries do diário; agora também chamado em `refreshBatch()` |
| `GET /api/batches/{id}` | `batchesApi.detail(id)` | Já na `refreshBatch()` |
| `GET /api/batches/{id}/summary` | `batchesApi.summary(id)` | Já na `refreshBatch()` |

Tipo retornado por `batchesApi.audit`: `ApiBatchAuditEntry[]` — contrato existente, sem alteração.

---

## refreshBatch — Assinatura Atualizada

```ts
// Antes
const refreshBatch = useCallback(async () => {
  if (!selBatchId) return;
  const [detail, sum] = await Promise.all([
    batchesApi.detail(selBatchId, { pageSize: 200 }),
    batchesApi.summary(selBatchId),
  ]);
  setBatchOccurrences(detail.occurrences);
  setSummary(sum);
}, [selBatchId]);

// Depois
const refreshBatch = useCallback(async () => {
  if (!selBatchId) return;
  setAuditLoading(true);
  try {
    const [detail, sum, audit] = await Promise.all([
      batchesApi.detail(selBatchId, { pageSize: 200 }),
      batchesApi.summary(selBatchId),
      batchesApi.audit(selBatchId),
    ]);
    setBatchOccurrences(detail.occurrences);
    setSummary(sum);
    setAuditEntries(audit);
  } finally {
    setAuditLoading(false);
  }
}, [selBatchId]);
```
