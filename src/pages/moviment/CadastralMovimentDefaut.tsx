import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { I } from '../../components/shared/Icons';
import { Tog, Toast, Modal } from '../../components/shared/UI';
import { batchesApi } from '../../api/batches';
import { occurrencesApi } from '../../api/occurrences';
import { ApiError } from '../../api/client';
import { getField, makeLabel, mapSev, stateMeta } from '../../api/helpers';
import type {
  ApiBatchListItem,
  ApiBatchDetail,
  ApiBatchSummary,
  ApiBatchSchemaField,
  ApiOccurrenceListItem,
  ApiOccurrenceDetail,
  ApiValidation,
} from '../../api/types';

// ===== Display helpers =====

const TIPO_CLS: Record<string, string> = {
  Inclusão: 'tipo-inc', Exclusão: 'tipo-exc', Alteração: 'tipo-alt',
};

// ===== Progress (from summary) =====

interface SummaryBarProps { summary: ApiBatchSummary }
function SummaryBar({ summary }: SummaryBarProps) {
  const total = summary.pending + summary.approved + summary.rejected + summary.disabled;
  const done  = summary.approved + summary.rejected + summary.disabled;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="prog">
      <div className="prog-bar"><div className="prog-fill" style={{ width: pct + '%' }} /></div>
      <div className="prog-tx">{done} de {total} conferidas · {pct}%</div>
      {summary.error   > 0 && <div className="prog-err"><I n="alert"  s={13} />{summary.error} com erro</div>}
      {summary.warning > 0 && <div className="prog-warn"><I n="alert" s={13} />{summary.warning} com aviso</div>}
    </div>
  );
}

// ===== Row =====

interface RowProps {
  r: ApiOccurrenceListItem;
  checked: boolean;
  onCheck: () => void;
  onOpen: () => void;
}
function Row({ r, checked, onCheck, onOpen }: RowProps) {
  const hasErr  = r.hasBlockingErrors;
  const hasWarn = !r.hasBlockingErrors && r.validationSummary.warningCount > 0;
  const rowCls  = hasErr ? 'row-err' : hasWarn ? 'row-warn' : '';
  const dim     = r.state === 'Disabled';
  const tipo    = getField(r.fields, 'tipo');
  const nome    = getField(r.fields, 'nome');
  const cpf     = getField(r.fields, 'cpf');
  const dest    = getField(r.fields, 'destino');
  const plano   = getField(r.fields, 'plano');
  const parent  = getField(r.fields, 'parentesco');
  const isTit   = parent === 'Titular';
  const { l, c } = stateMeta(r.state);

  return (
    <tr onClick={onOpen} className={'row ' + rowCls + (dim ? ' dimmed' : '')}>
      <td className="w-chk" onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={checked} onChange={onCheck} />
      </td>
      <td>
        {tipo !== '—'
          ? <span className={'badge ' + (TIPO_CLS[tipo] ?? '')}>{tipo}</span>
          : <span className="badge">{r.sourceRecordId}</span>
        }
      </td>
      <td>
        <div className="ben">
          <I n={isTit ? 'user' : 'users'} s={14} cls="ben-ic" />
          <span className={'ben-name' + (dim ? ' struck' : '')}>{nome}</span>
        </div>
        {parent !== '—' && <div className="ben-sub">{parent}</div>}
      </td>
      <td className="mono small">{cpf}</td>
      <td><span className="cp-name">{dest}</span></td>
      <td className="plano">{plano}</td>
      <td>
        {r.validationSummary.errorCount   > 0 && <span className="chip chip-err">{r.validationSummary.errorCount} erro{r.validationSummary.errorCount > 1 ? 's' : ''}</span>}
        {r.validationSummary.warningCount > 0 && <span className="chip chip-warn">{r.validationSummary.warningCount} aviso{r.validationSummary.warningCount > 1 ? 's' : ''}</span>}
        {r.validationSummary.errorCount + r.validationSummary.warningCount === 0 && <span className="chip chip-ok">conforme</span>}
      </td>
      <td><span className={'badge ' + c}>{l}</span></td>
      <td className="chevcell"><I n="chevR" s={16} cls="chev" /></td>
    </tr>
  );
}

// ===== Validation panel (schema-driven, dimension-aware) =====

interface ValidationGroupProps { title: string; hint: string; items: ApiValidation[] }
function ValidationGroup({ title, hint, items }: ValidationGroupProps) {
  return (
    <div className="dim">
      <div className="dim-head">
        <span className="sec-lbl">{title}</span>
        <span className="dim-hint">{hint}</span>
      </div>
      {items.length === 0
        ? <div className="dim-ok"><I n="shield" s={16} /> Sem apontamentos.</div>
        : items.map((v, i) => {
            const sev = mapSev(v.severity);
            const k   = sev === 'erro' ? 'v-err' : sev === 'aviso' ? 'v-warn' : 'v-info';
            const ic  = sev === 'erro' ? 'xCircle' : sev === 'aviso' ? 'alert' : 'info';
            return (
              <div key={i} className={'vitem ' + k}>
                <div className="vitem-msg">
                  <I n={ic as never} s={16} cls="vitem-ic" />
                  <span>{v.message}</span>
                </div>
              </div>
            );
          })
      }
    </div>
  );
}

// ===== Drawer =====

interface DrawerProps {
  detail: ApiOccurrenceDetail;
  schema: ApiBatchSchemaField[];
  onClose: () => void;
  onUpdate: (updated: ApiOccurrenceDetail) => void;
  flash: (k: 'ok' | 'warn' | 'info', m: string) => void;
}
function Drawer({ detail, schema, onClose, onUpdate, flash }: DrawerProps) {
  const [showOrig, setShowOrig] = useState(false);
  const [draft, setDraft]       = useState<Record<string, string>>(
    () => Object.fromEntries(detail.fields.map(f => [f.key, f.value]))
  );
  const [saving, setSaving] = useState(false);

  const label  = useMemo(() => makeLabel(schema), [schema]);
  const blocked = detail.validations.some(v => v.severity === 'Error' && v.dimension === 'Capture');
  const { l: stateLabel, c: stateCls } = stateMeta(detail.state);
  const tipo = getField(detail.fields, 'tipo');

  const save = async () => {
    const changes = detail.fields.filter(f => draft[f.key] !== undefined && draft[f.key] !== f.value);
    if (!changes.length) { flash('warn', 'Nenhuma alteração.'); return; }
    setSaving(true);
    try {
      let updated = detail;
      for (const f of changes) {
        updated = await occurrencesApi.editField(detail.occurrenceId, f.key, draft[f.key]);
      }
      onUpdate(updated);
      flash('ok', `${changes.length} alteração(ões) salva(s).`);
    } catch (err) {
      flash('warn', err instanceof ApiError ? `Erro ao salvar: ${err.status}` : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    try {
      const updated = await occurrencesApi.approve(detail.occurrenceId);
      onUpdate(updated); flash('ok', 'Movimentação aprovada.');
    } catch (err) {
      flash('warn', err instanceof ApiError && err.status === 422 ? 'Há erros bloqueantes pendentes.' : 'Erro ao aprovar.');
    }
  };

  const startReject = () => setRejectOpen(true);
  const [rejectOpen, setRejectOpen] = useState(false);

  const disable = async () => {
    try {
      const updated = await occurrencesApi.disable(detail.occurrenceId);
      onUpdate(updated); flash('ok', 'Movimentação desabilitada.');
    } catch {
      flash('warn', 'Erro ao desabilitar.');
    }
  };

  // Group fields by schema order
  const orderedFields = useMemo(() => {
    const schemaOrder = schema
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(sf => sf.key);
    const fieldMap = Object.fromEntries(detail.fields.map(f => [f.key, f]));
    return schemaOrder.filter(k => k in fieldMap).map(k => fieldMap[k]);
  }, [detail.fields, schema]);

  return (
    <>
      <div className="drawer-overlay">
        <div className="drawer-bg" onClick={onClose} />
        <div className="drawer">
          <div className="dr-head">
            <div>
              <div className="dr-badges">
                {tipo !== '—' && <span className={'badge ' + (TIPO_CLS[tipo] ?? '')}>{tipo}</span>}
                <span className={'badge ' + stateCls}>{stateLabel}</span>
              </div>
              <h2>{getField(detail.fields, 'nome')}</h2>
              <div className="mono dr-id">
                {detail.occurrenceId} · {detail.sourceRecordId}
              </div>
            </div>
            <button className="iconbtn" onClick={onClose}><I n="x" s={20} /></button>
          </div>

          <div className="dr-body">
            <ValidationGroup
              title="Conformidade da captura"
              hint="A tradução de entrada foi fiel?"
              items={detail.validations.filter(v => v.dimension === 'Capture')}
            />
            <ValidationGroup
              title="Validade da movimentação"
              hint="O evento faz sentido?"
              items={detail.validations.filter(v => v.dimension === 'Movement')}
            />

            <div className="fields">
              <div className="fields-head">
                <span className="sec-lbl"><I n="pencil" s={13} /> Campos canônicos</span>
                <button className={'origbtn' + (showOrig ? ' on' : '')} onClick={() => setShowOrig(s => !s)}>
                  <I n={showOrig ? 'eyeOff' : 'eye'} s={13} /> Origem da captura
                </button>
              </div>
              <div className="fgrid">
                {orderedFields.map(f => {
                  const ambig = f.provenance.state !== 'Automatic' && f.provenance.state !== 'Manual';
                  return (
                    <label key={f.key} className="fld">
                      <span className="fl">
                        {label[f.key] ?? f.key}
                        {ambig && <span className="ambig-tag">origem ambígua</span>}
                      </span>
                      <input
                        value={draft[f.key] ?? f.value}
                        onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                        className={ambig ? 'amb' : ''}
                        disabled={detail.state !== 'Pending'}
                      />
                      {showOrig && (
                        <span className={'orig' + (ambig ? ' amber' : '')}>
                          <I n="swap" s={11} />
                          {f.provenance.description
                            ? <span>← {f.provenance.description} · {f.provenance.state}</span>
                            : <span>sem origem (derivado)</span>
                          }
                          {f.originalValue !== null && (
                            <span className="cand"> · original: {f.originalValue}</span>
                          )}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {detail.state === 'Pending' && (
                <button className="btn btn-ghost save-btn" onClick={save} disabled={saving}>
                  <I n="check" s={16} /> {saving ? 'Salvando…' : 'Salvar alterações'}
                </button>
              )}
            </div>

            {detail.rejectionReason && (
              <div className="dim">
                <div className="dim-head"><span className="sec-lbl">Motivo da rejeição</span></div>
                <div className="vitem v-err">
                  <div className="vitem-msg"><I n="xCircle" s={16} cls="vitem-ic" /><span>{detail.rejectionReason}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="dr-foot">
            {detail.state === 'Pending' && (
              <div className="foot-row">
                <button
                  disabled={blocked}
                  className={'btn btn-app' + (blocked ? ' disabled' : '')}
                  onClick={blocked ? undefined : approve}
                >
                  <I n="checkCircle" s={16} /> Aprovar
                </button>
                <button className="btn btn-rejo" onClick={startReject}>
                  <I n="xCircle" s={16} /> Rejeitar
                </button>
                <button className="btn btn-ghost foot-dis" onClick={disable}>
                  <I n="ban" s={16} /> Desabilitar
                </button>
              </div>
            )}
            {detail.state === 'Approved' && (
              <div className="foot-done"><I n="checkCircle" s={16} /> Aprovado. Aguardando exportação.</div>
            )}
            {detail.state === 'Rejected' && (
              <div className="foot-done"><I n="xCircle" s={16} /> Rejeitado.</div>
            )}
            {detail.state === 'Disabled' && (
              <div className="foot-done"><I n="ban" s={16} /> Desabilitado. Fora do fluxo de conferência.</div>
            )}
            {blocked && detail.state === 'Pending' && (
              <div className="foot-err">Há erro bloqueante. Resolva a pendência antes de aprovar.</div>
            )}
          </div>
        </div>
      </div>

      {rejectOpen && (
        <RejectModal
          onConfirm={async (reason) => {
            try {
              const updated = await occurrencesApi.reject(detail.occurrenceId, reason);
              onUpdate(updated);
              setRejectOpen(false);
              flash('ok', 'Movimentação rejeitada.');
            } catch {
              flash('warn', 'Erro ao rejeitar.');
            }
          }}
          onClose={() => setRejectOpen(false)}
        />
      )}
    </>
  );
}

// ===== Reject Modal =====

interface RejectModalProps { onConfirm: (reason: string) => void; onClose: () => void }
function RejectModal({ onConfirm, onClose }: RejectModalProps) {
  const [m, setM] = useState('');
  return (
    <Modal onClose={onClose} title="Rejeitar movimentação" icon="xCircle">
      <p className="modal-p">O motivo é obrigatório e fica registrado na ocorrência.</p>
      <textarea
        value={m}
        onChange={e => setM(e.target.value)}
        rows={3}
        placeholder="Ex.: CPF divergente, aguardando correção do cliente."
      />
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button
          disabled={!m.trim()}
          className={'btn ' + (m.trim() ? 'btn-rejo-solid' : 'btn-disabled')}
          onClick={m.trim() ? () => onConfirm(m.trim()) : undefined}
        >
          Confirmar rejeição
        </button>
      </div>
    </Modal>
  );
}

// ===== Bulk Reject Modal =====

interface BulkRejectModalProps { count: number; onConfirm: (reason: string) => void; onClose: () => void }
function BulkRejectModal({ count, onConfirm, onClose }: BulkRejectModalProps) {
  const [m, setM] = useState('');
  return (
    <Modal onClose={onClose} title={`Rejeitar ${count} movimentação(ões)`} icon="xCircle">
      <p className="modal-p">O motivo é obrigatório e fica registrado em cada ocorrência.</p>
      <textarea value={m} onChange={e => setM(e.target.value)} rows={3} placeholder="Ex.: CPF divergente, aguardando correção." />
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button
          disabled={!m.trim()}
          className={'btn ' + (m.trim() ? 'btn-rejo-solid' : 'btn-disabled')}
          onClick={m.trim() ? () => onConfirm(m.trim()) : undefined}
        >
          Confirmar rejeição
        </button>
      </div>
    </Modal>
  );
}

// ===== Named exports for testing =====
export { Row, ValidationGroup, Drawer, RejectModal, BulkRejectModal };
export type { RowProps, ValidationGroupProps, DrawerProps, RejectModalProps, BulkRejectModalProps };

// ===== Page =====

type ModalKind = 'bulk-reject' | null;

export default function CadastralMovimentDefaut() {
  const [batches,       setBatches]       = useState<ApiBatchListItem[]>([]);
  const [selBatchId,    setSelBatchId]    = useState<string | null>(null);
  const [batchDetail,   setBatchDetail]   = useState<ApiBatchDetail | null>(null);
  const [summary,       setSummary]       = useState<ApiBatchSummary | null>(null);
  const [selOccurrence, setSelOccurrence] = useState<ApiOccurrenceDetail | null>(null);
  const [loadingBatch,  setLoadingBatch]  = useState(false);
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [checked,       setChecked]       = useState<Set<string>>(new Set());
  const [filters,       setFilters]       = useState({ q: '', pend: true, ocultar: true });
  const [toast,         setToast]         = useState<{ k: 'ok' | 'warn' | 'info'; m: string } | null>(null);
  const [modal,         setModal]         = useState<ModalKind>(null);

  const flash = useCallback((k: 'ok' | 'warn' | 'info', m: string) => {
    setToast({ k, m });
    setTimeout(() => setToast(null), 3400);
  }, []);

  // Load batch list on mount
  useEffect(() => {
    batchesApi.list({ operationTypeKey: 'cadastral-movement', pageSize: 50 })
      .then(res => {
        setBatches(res.items);
        if (res.items.length > 0) setSelBatchId(res.items[0].batchId);
      })
      .catch(err => {
        const msg = err instanceof ApiError && err.status === 401
          ? 'Não autenticado. Configure VITE_API_BASE_URL e o token Bearer.'
          : 'Erro ao carregar lotes.';
        setError(msg);
      });
  }, []);

  // Load batch detail + summary when selection changes
  useEffect(() => {
    if (!selBatchId) return;
    setLoadingBatch(true);
    setChecked(new Set());
    setSelOccurrence(null);
    Promise.all([
      batchesApi.detail(selBatchId, { pageSize: 200 }),
      batchesApi.summary(selBatchId),
    ])
      .then(([detail, sum]) => { setBatchDetail(detail); setSummary(sum); })
      .catch(() => flash('warn', 'Erro ao carregar lote.'))
      .finally(() => setLoadingBatch(false));
  }, [selBatchId, flash]);

  const openOccurrence = async (id: string) => {
    setLoadingDrawer(true);
    try {
      const detail = await occurrencesApi.detail(id);
      setSelOccurrence(detail);
    } catch {
      flash('warn', 'Erro ao carregar ocorrência.');
    } finally {
      setLoadingDrawer(false);
    }
  };

  const handleOccurrenceUpdate = (updated: ApiOccurrenceDetail) => {
    setSelOccurrence(updated);
    // Reflect state change in the list
    if (batchDetail) {
      const updatedItems = batchDetail.occurrences.items.map(item =>
        item.occurrenceId === updated.occurrenceId
          ? {
              ...item,
              state: updated.state,
              hasBlockingErrors: updated.validations.some(v => v.severity === 'Error' && v.dimension === 'Capture'),
              validationSummary: {
                errorCount:   updated.validations.filter(v => v.severity === 'Error').length,
                warningCount: updated.validations.filter(v => v.severity === 'Warning').length,
              },
              fields: updated.fields,
            }
          : item
      );
      setBatchDetail({ ...batchDetail, occurrences: { ...batchDetail.occurrences, items: updatedItems } });
    }
    // Refresh summary
    if (selBatchId) batchesApi.summary(selBatchId).then(setSummary).catch(() => {});
  };

  const schema = batchDetail?.schema.fields ?? [];
  const label  = useMemo(() => makeLabel(schema), [schema]);

  // Client-side triage filtering
  const view = useMemo(() => {
    if (!batchDetail) return { rs: [], oc: 0 };
    let rs = batchDetail.occurrences.items;

    if (filters.q) {
      const q = filters.q.toLowerCase();
      rs = rs.filter(r =>
        getField(r.fields, 'nome').toLowerCase().includes(q) ||
        getField(r.fields, 'cpf').includes(q)
      );
    }
    if (filters.pend) rs = rs.filter(r => r.state === 'Pending');

    const oc = filters.ocultar
      ? rs.filter(r => r.state === 'Pending' && !r.hasBlockingErrors && r.validationSummary.warningCount === 0).length
      : 0;
    if (filters.ocultar) {
      rs = rs.filter(r => !(r.state === 'Pending' && !r.hasBlockingErrors && r.validationSummary.warningCount === 0));
    }

    const rank = (r: ApiOccurrenceListItem) =>
      r.hasBlockingErrors ? 0 : r.validationSummary.warningCount > 0 ? 1 : 2;
    return { rs: rs.slice().sort((a, b) => rank(a) - rank(b)), oc };
  }, [batchDetail, filters]);

  // Bulk actions
  const bulkApprove = async (ids: string[]) => {
    let ok = 0, skip = 0;
    for (const id of ids) {
      const item = batchDetail?.occurrences.items.find(i => i.occurrenceId === id);
      if (!item || item.hasBlockingErrors) { skip++; continue; }
      try { await occurrencesApi.approve(id); ok++; } catch { skip++; }
    }
    setChecked(new Set());
    // Reload batch detail to reflect changes
    if (selBatchId) {
      const [detail, sum] = await Promise.all([
        batchesApi.detail(selBatchId, { pageSize: 200 }),
        batchesApi.summary(selBatchId),
      ]);
      setBatchDetail(detail); setSummary(sum);
    }
    flash(
      ok && skip ? 'warn' : ok ? 'ok' : 'warn',
      ok && skip ? `${ok} aprovada(s). ${skip} com erro bloqueante ignorada(s).`
      : ok ? `${ok} movimentação(ões) aprovada(s).`
      : 'Nenhuma aprovada — há erros bloqueantes.',
    );
  };

  const bulkReject = async (ids: string[], reason: string) => {
    let ok = 0;
    for (const id of ids) {
      try { await occurrencesApi.reject(id, reason); ok++; } catch { /* skip */ }
    }
    setChecked(new Set()); setModal(null);
    if (selBatchId) {
      const [detail, sum] = await Promise.all([
        batchesApi.detail(selBatchId, { pageSize: 200 }),
        batchesApi.summary(selBatchId),
      ]);
      setBatchDetail(detail); setSummary(sum);
    }
    flash('ok', `${ok} movimentação(ões) rejeitada(s).`);
  };

  const doExport = async () => {
    if (!selBatchId) return;
    if (summary && summary.approved === 0) {
      flash('warn', 'Nenhuma movimentação aprovada para exportar.');
      return;
    }
    try {
      const blob = await batchesApi.export(selBatchId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `export-${selBatchId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      flash('ok', 'Download do XLSX iniciado.');
    } catch (err) {
      const msg = err instanceof ApiError
        ? (err.status === 422 ? 'Sem ocorrências aprovadas.' : `Erro ${err.status} ao exportar.`)
        : 'Erro ao exportar.';
      flash('warn', msg);
    }
  };

  if (error) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dim-ok" style={{ flexDirection: 'column', gap: 8 }}>
          <I n="alert" s={24} />
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app app--slim">
      {/* ===== Batch rail ===== */}
      <aside className="rail">
        <div className="rail-lbl"><I n="layers" s={13} /> Lotes</div>
        <div className="rail-list">
          {batches.length === 0 && (
            <div className="muted" style={{ padding: '12px 16px', fontSize: 12 }}>Carregando lotes…</div>
          )}
          {batches.map(b => (
            <button
              key={b.batchId}
              onClick={() => { setSelBatchId(b.batchId); setSelOccurrence(null); }}
              className={'lote' + (b.batchId === selBatchId ? ' active' : '')}
            >
              <div className="lote-top">
                <span className="mono lote-id">{b.batchId.slice(0, 8)}…</span>
                {b.pendingCount > 0 && <span className="lote-err"><I n="alert" s={12} />{b.pendingCount}</span>}
              </div>
              <div className="lote-name">{b.sourceId}</div>
              <div className="lote-meta">{b.sourceType} · {b.occurrenceCount} registro(s)</div>
            </button>
          ))}
        </div>
      </aside>

      {/* ===== Main content ===== */}
      <main className="main">
        {loadingBatch ? (
          <div className="m-head"><div className="muted">Carregando lote…</div></div>
        ) : batchDetail ? (
          <>
            <div className="m-head">
              <div className="m-head-row">
                <div>
                  <div className="eyebrow"><I n="building" s={13} /> Lote · {batchDetail.operationTypeKey}</div>
                  <h1>{batchDetail.schema.displayName}</h1>
                  <div className="m-sub">
                    <span className="mono">{batchDetail.batchId}</span>
                    <span className="dot">·</span>{batchDetail.sourceType} / {batchDetail.sourceId}
                    <span className="dot">·</span>{new Date(batchDetail.receivedAt).toLocaleDateString('pt-BR')}
                    <span className="dot">·</span>Estado: {batchDetail.state}
                  </div>
                </div>
                <div className="m-actions">
                  <button className="btn btn-primary" onClick={doExport}>
                    <I n="download" s={16} /> Exportar XLSX
                  </button>
                </div>
              </div>
              {summary && <SummaryBar summary={summary} />}
            </div>

            <div className="filterbar">
              <span className="inp-wrap">
                <I n="search" s={16} cls="inp-ic" />
                <input
                  value={filters.q}
                  onChange={e => setFilters(s => ({ ...s, q: e.target.value }))}
                  placeholder="Buscar nome ou CPF"
                />
              </span>
              <Tog on={filters.pend}    onClick={() => setFilters(s => ({ ...s, pend: !s.pend }))}       label="Só pendências" />
              <Tog on={filters.ocultar} onClick={() => setFilters(s => ({ ...s, ocultar: !s.ocultar }))} label="Ocultar conformes" />
              <span className="fcount">{view.rs.length} em conferência</span>
            </div>

            {checked.size > 0 && (
              <div className="batchbar">
                <span className="bb-count">{checked.size} selecionada(s)</span>
                <button className="bb-app" onClick={() => bulkApprove(Array.from(checked))}><I n="checkCircle" s={14} /> Aprovar</button>
                <button className="bb-rej" onClick={() => setModal('bulk-reject')}><I n="xCircle" s={14} /> Rejeitar</button>
                <button className="bb-clear" onClick={() => setChecked(new Set())}>Limpar</button>
              </div>
            )}

            {view.oc > 0 && (
              <div className="banner">
                <I n="shield" s={14} />{view.oc} movimentação(ões) conforme(s) oculta(s).
                <button onClick={() => setFilters(s => ({ ...s, ocultar: false }))}>Mostrar</button>
              </div>
            )}

            <div className="grid-wrap">
              <table className="grid">
                <colgroup>
                  <col className="col-check" /><col className="col-type" /><col className="col-person" />
                  <col className="col-cpf" /><col className="col-destination" /><col className="col-plan" />
                  <col className="col-checks" /><col className="col-status" /><col className="col-open" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="w-chk" />
                    <th>{label['tipo'] ?? 'Tipo'}</th>
                    <th>{label['nome'] ?? 'Beneficiário'}</th>
                    <th>{label['cpf']  ?? 'CPF'}</th>
                    <th>{label['destino'] ?? 'Operadora / Seguradora'}</th>
                    <th>{label['plano'] ?? 'Plano'}</th>
                    <th>Conferência</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {view.rs.map(r => (
                    <Row
                      key={r.occurrenceId}
                      r={r}
                      checked={checked.has(r.occurrenceId)}
                      onCheck={() => setChecked(s => {
                        const n = new Set(s);
                        if (n.has(r.occurrenceId)) { n.delete(r.occurrenceId); } else { n.add(r.occurrenceId); }
                        return n;
                      })}
                      onOpen={() => openOccurrence(r.occurrenceId)}
                    />
                  ))}
                  {view.rs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty">
                        <I n="list" s={24} />
                        <div>Nada para conferir com os filtros atuais.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-legend">
              <span><span className="sw sw-err" />Erro bloqueante</span>
              <span><span className="sw sw-warn" />Aviso</span>
              <span><span className="sw sw-teal" />Origem da captura</span>
            </div>
            <div className="legend">
              <span className="legend-rt">2026 Alper Seguros · Uso Interno - Confidencial · Atlas mantém o evento</span>
            </div>
          </>
        ) : (
          <div className="m-head">
            <div className="muted">{batches.length > 0 ? 'Selecione um lote.' : 'Nenhum lote disponível.'}</div>
          </div>
        )}
      </main>

      {/* ===== Overlays ===== */}
      {loadingDrawer && (
        <div className="drawer-overlay">
          <div className="drawer-bg" />
          <div className="drawer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="muted">Carregando ocorrência…</span>
          </div>
        </div>
      )}

      {selOccurrence && !loadingDrawer && batchDetail && (
        <Drawer
          detail={selOccurrence}
          schema={batchDetail.schema.fields}
          onClose={() => setSelOccurrence(null)}
          onUpdate={handleOccurrenceUpdate}
          flash={flash}
        />
      )}

      {modal === 'bulk-reject' && (
        <BulkRejectModal
          count={checked.size}
          onConfirm={reason => bulkReject(Array.from(checked), reason)}
          onClose={() => setModal(null)}
        />
      )}

      {toast && <Toast k={toast.k} m={toast.m} />}
    </div>
  );
}
