import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I } from '../../components/shared/Icons';
import { Tog, Toast, Modal } from '../../components/shared/UI';
import { batchesApi } from '../../api/batches';
import { occurrencesApi } from '../../api/occurrences';
import { schemasApi } from '../../api/schemas';
import { ApiError } from '../../api/client';
import { getField, makeLabel, resolveInputType, mapSev, stateMeta } from '../../api/helpers';
import { translateChangeType, translateValidationMessage } from '../../i18n/glossary';
import type {
  ApiSchema,
  ApiSchemaField,
  ApiBatchListItem,
  ApiBatchSummary,
  ApiBatchAuditEntry,
  ApiOccurrenceListItem,
  ApiOccurrenceDetail,
  ApiOccurrenceNote,
  ApiValidation,
} from '../../api/types';

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

// ===== Movement type badge mapping (API values are English, display is PT) =====
const MOVEMENT_TYPE_META: Record<string, { label: string; cls: string }> = {
  New:    { label: 'Inclusão',  cls: 'tipo-inc' },
  Edit:   { label: 'Alteração', cls: 'tipo-alt' },
  Remove: { label: 'Exclusão',  cls: 'tipo-exc' },
};

// ===== Audit Diary Panel =====

interface AuditDiaryPanelProps {
  entries: ApiBatchAuditEntry[];
  loading: boolean;
  error: boolean;
  collapsed: boolean;
  onToggle: () => void;
}
function AuditDiaryPanel({ entries, loading, error, collapsed, onToggle }: AuditDiaryPanelProps) {
  return (
    <div className="audit-diary">
      <button className="audit-diary-toggle" onClick={onToggle}>
        <I n="list" s={13} />
        <span className="sec-lbl">Diário do lote</span>
        <I n={collapsed ? 'chevR' : 'chevD' as never} s={13} cls="audit-chevron" />
      </button>
      {!collapsed && (
        <div className="audit-diary-body">
          {loading && <div className="muted audit-row">Carregando…</div>}
          {!loading && error && <div className="muted audit-row">Erro ao carregar diário.</div>}
          {!loading && !error && entries.length === 0 && (
            <div className="muted audit-row">Sem registros.</div>
          )}
          {!loading && !error && entries.map((e, i) => (
            <div key={i} className="audit-row">
              <span className="audit-at">{new Date(e.changedAt).toLocaleString('pt-BR')}</span>
              <span className="audit-type">{translateChangeType(e.changeType)}</span>
              <span className="audit-actor">{e.actorId}</span>
              <span className="audit-desc">{e.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Select-all checkbox (supports indeterminate state) =====

interface SelectAllCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}
function SelectAllCheckbox({ checked, indeterminate, onChange }: SelectAllCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input type="checkbox" ref={ref} checked={checked} onChange={onChange} />;
}

// ===== Row (fully dynamic — schema-driven columns) =====

interface RowProps {
  r: ApiOccurrenceListItem;
  schema: ApiSchemaField[];
  checked: boolean;
  onCheck: () => void;
  onOpen: () => void;
  gridCols?: string;
}
function Row({ r, schema, checked, onCheck, onOpen, gridCols }: RowProps) {
  const hasErr  = r.hasBlockingErrors;
  const hasWarn = !r.hasBlockingErrors && r.validationSummary.warningCount > 0;
  const rowCls  = hasErr ? 'row-err' : hasWarn ? 'row-warn' : '';
  const dim     = r.state === 'Disabled';
  const { l, c } = stateMeta(r.state);
  const orderedFields = useMemo(
    () => schema.slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [schema],
  );

  return (
    <tr onClick={onOpen} className={'row ' + rowCls + (dim ? ' dimmed' : '')} style={{ gridTemplateColumns: gridCols }}>
      <td className="w-chk" onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={checked} onChange={onCheck} />
      </td>
      {/* Fixed first column: movementType */}
      <td>
        {r.movementType && MOVEMENT_TYPE_META[r.movementType]
          ? <span className={'badge ' + MOVEMENT_TYPE_META[r.movementType].cls}>{MOVEMENT_TYPE_META[r.movementType].label}</span>
          : <span className="muted">—</span>}
      </td>
      {orderedFields.map(sf => (
        <td key={sf.key}>{getField(r.fields, sf.key)}</td>
      ))}
      {/* Fixed: Conferência */}
      <td>
        {r.validationSummary.errorCount   > 0 && <span className="chip chip-err">{r.validationSummary.errorCount} erro{r.validationSummary.errorCount > 1 ? 's' : ''}</span>}
        {r.validationSummary.warningCount > 0 && <span className="chip chip-warn">{r.validationSummary.warningCount} aviso{r.validationSummary.warningCount > 1 ? 's' : ''}</span>}
        {r.validationSummary.errorCount + r.validationSummary.warningCount === 0 && <span className="chip chip-ok">conforme</span>}
      </td>
      {/* Fixed: Status */}
      <td><span className={'badge ' + c}>{l}</span></td>
      <td className="chevcell"><I n="chevR" s={16} cls="chev" /></td>
    </tr>
  );
}

// ===== Validation panel =====

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
                  <span>{translateValidationMessage(v.message)}</span>
                </div>
              </div>
            );
          })
      }
    </div>
  );
}

// ===== Notes Section =====

interface NotesSectionProps {
  occurrenceId: string;
  notes: ApiOccurrenceNote[];
  onNoteAdded: (updated: ApiOccurrenceDetail) => void;
  flash: (k: 'ok' | 'warn' | 'info', m: string) => void;
}
function NotesSection({ occurrenceId, notes, onNoteAdded, flash }: NotesSectionProps) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await occurrencesApi.postNote(occurrenceId, trimmed);
      const updated = await occurrencesApi.detail(occurrenceId);
      onNoteAdded(updated);
      setText('');
    } catch {
      flash('warn', 'Erro ao salvar anotação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="notes-section">
      <div className="dim-head">
        <span className="sec-lbl"><I n="list" s={13} /> Histórico · auditoria e diário</span>
      </div>
      {notes.length === 0
        ? <div className="note-meta" style={{ padding: '4px 0' }}>Sem anotações.</div>
        : <div className="notes-list">
            {notes.map(n => (
              <div key={n.id} className="note-item">
                <div className="note-meta">
                  {new Date(n.createdAt).toLocaleString('pt-BR')} · {n.authorId}
                </div>
                <div className="note-text">{n.text}</div>
              </div>
            ))}
          </div>
      }
      <textarea
        className="note-input"
        rows={2}
        placeholder="Adicionar anotação…"
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={saving}
      />
      <button
        className={'btn btn-ghost save-btn' + (!text.trim() || saving ? ' btn-disabled' : '')}
        disabled={!text.trim() || saving}
        onClick={submit}
      >
        <I n="check" s={14} /> {saving ? 'Salvando…' : 'Adicionar anotação'}
      </button>
    </div>
  );
}

// ===== Drawer (schema-driven fields + resolveInputType) =====

interface DrawerProps {
  detail: ApiOccurrenceDetail;
  schema: ApiSchemaField[];
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

  const [rejectOpen, setRejectOpen] = useState(false);

  const disable = async () => {
    try {
      const updated = await occurrencesApi.disable(detail.occurrenceId);
      onUpdate(updated); flash('ok', 'Movimentação desabilitada.');
    } catch {
      flash('warn', 'Erro ao desabilitar.');
    }
  };

  // Group fields by schema order; include only fields present in occurrence data
  const orderedFields = useMemo(() => {
    const fieldMap = Object.fromEntries(detail.fields.map(f => [f.key, f]));
    return schema
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(sf => ({ schemaField: sf, occField: fieldMap[sf.key] ?? null }));
  }, [detail.fields, schema]);

  return (
    <>
      <div className="drawer-overlay">
        <div className="drawer-bg" onClick={onClose} />
        <div className="drawer">
          <div className="dr-head">
            <div>
              <div className="dr-badges">
                <span className={'badge ' + stateCls}>{stateLabel}</span>
              </div>
              <h2>{detail.occurrenceId}</h2>
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
                {orderedFields.map(({ schemaField: sf, occField: f }) => {
                  const currentVal = f?.value ?? '';
                  const ambig = f ? (f.provenance.state !== 'Automatic' && f.provenance.state !== 'Manual') : false;
                  return (
                    <label key={sf.key} className="fld">
                      <span className="fl">
                        {label[sf.key] ?? sf.key}
                        {ambig && <span className="ambig-tag">origem ambígua</span>}
                      </span>
                      <input
                        type={resolveInputType(sf.dataType)}
                        value={draft[sf.key] ?? currentVal}
                        onChange={e => setDraft(d => ({ ...d, [sf.key]: e.target.value }))}
                        className={ambig ? 'amb' : ''}
                        disabled={detail.state !== 'Pending'}
                      />
                      {showOrig && f && (
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

            <hr className="notes-divider" />
            <NotesSection
              occurrenceId={detail.occurrenceId}
              notes={detail.notes ?? []}
              onNoteAdded={onUpdate}
              flash={flash}
            />
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
                <button className="btn btn-rejo" onClick={() => setRejectOpen(true)}>
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

// ===== XLSX Upload Modal =====

const XLSX_MAX_BYTES = 10 * 1024 * 1024;

interface XlsxUploadModalProps { onSuccess: () => void; onClose: () => void }
function XlsxUploadModal({ onSuccess, onClose }: XlsxUploadModalProps) {
  const [file,             setFile]             = useState<File | null>(null);
  const [operationTypeKey, setOperationTypeKey] = useState('');
  const [movementType,     setMovementType]     = useState('');
  const [sourceType,       setSourceType]       = useState('');
  const [sourceId,         setSourceId]         = useState('');
  const [sourceChannel,    setSourceChannel]    = useState('');
  const [loading,          setLoading]          = useState(false);
  const [formError,        setFormError]        = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file)                                          return setFormError('Selecione um arquivo XLSX.');
    if (!file.name.toLowerCase().endsWith('.xlsx'))     return setFormError('O arquivo deve ter extensão .xlsx.');
    if (file.size > XLSX_MAX_BYTES)                     return setFormError('O arquivo não pode ultrapassar 10 MB.');
    if (!operationTypeKey.trim() || !movementType.trim() ||
        !sourceType.trim()       || !sourceId.trim()    ||
        !sourceChannel.trim())                          return setFormError('Preencha todos os campos obrigatórios.');

    setFormError(null);
    setLoading(true);
    try {
      await batchesApi.uploadXlsx({ file, operationTypeKey, movementType, sourceType, sourceId, sourceChannel });
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? (err.body || 'Erro no servidor.') : 'Erro inesperado.';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Importar planilha" icon="upload">
      <div className="modal-field">
        <label className="field-lbl">Arquivo XLSX *</label>
        <input type="file" accept=".xlsx" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <div className="modal-field">
        <label className="field-lbl">Tipo de operação *</label>
        <input value={operationTypeKey} onChange={e => setOperationTypeKey(e.target.value)} placeholder="Ex.: cadastral-movement" />
      </div>
      <div className="modal-field">
        <label className="field-lbl">Tipo de movimentação *</label>
        <input value={movementType} onChange={e => setMovementType(e.target.value)} placeholder="Ex.: New" />
      </div>
      <div className="modal-field">
        <label className="field-lbl">Tipo de fonte *</label>
        <input value={sourceType} onChange={e => setSourceType(e.target.value)} placeholder="Ex.: System" />
      </div>
      <div className="modal-field">
        <label className="field-lbl">ID da fonte *</label>
        <input value={sourceId} onChange={e => setSourceId(e.target.value)} placeholder="Ex.: crm-001" />
      </div>
      <div className="modal-field">
        <label className="field-lbl">Canal da fonte *</label>
        <input value={sourceChannel} onChange={e => setSourceChannel(e.target.value)} placeholder="Ex.: API" />
      </div>
      {formError && <p className="form-error">{formError}</p>}
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
        <button
          className={'btn ' + (loading ? 'btn-disabled' : 'btn-primary')}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Enviando…' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}

// ===== Named exports for testing =====
export { AuditDiaryPanel, SelectAllCheckbox, Row, ValidationGroup, NotesSection, Drawer, RejectModal, BulkRejectModal, XlsxUploadModal };
export type { AuditDiaryPanelProps, SelectAllCheckboxProps, RowProps, ValidationGroupProps, NotesSectionProps, DrawerProps, RejectModalProps, BulkRejectModalProps, XlsxUploadModalProps };


// ===== Page =====

// ===== Diary Modal =====

interface DiaryModalProps { entries: ApiBatchAuditEntry[]; loading: boolean; error: boolean; onClose: () => void }
function DiaryModal({ entries, loading, error, onClose }: DiaryModalProps) {
  return (
    <Modal onClose={onClose} title="Diário do lote" icon="book">
      <p className="modal-p">Histórico compartilhado do lote — qualquer analista acompanha o que aconteceu e por quê.</p>
      {loading && <div className="muted audit-row">Carregando…</div>}
      {!loading && error && <div className="muted audit-row">Erro ao carregar diário.</div>}
      {!loading && !error && entries.length === 0 && <div className="muted audit-row">Sem registros.</div>}
      {!loading && !error && entries.map((e, i) => (
        <div key={i} className="audit-row">
          <span className="audit-at">{new Date(e.changedAt).toLocaleString('pt-BR')}</span>
          <span className="audit-type">{translateChangeType(e.changeType)}</span>
          <span className="audit-actor">{e.actorId}</span>
          <span className="audit-desc">{e.description}</span>
        </div>
      ))}
    </Modal>
  );
}

type ModalKind = 'bulk-reject' | 'diary' | 'xlsx-upload' | null;

export default function CadastralMovimentDefaut() {
  // Schema state — fetched once on mount, never re-fetched on batch selection
  const [apiSchema,    setApiSchema]    = useState<ApiSchema | null>(null);
  const [schemaError,  setSchemaError]  = useState<string | null>(null);

  const [batches,       setBatches]       = useState<ApiBatchListItem[]>([]);
  const [selBatchId,    setSelBatchId]    = useState<string | null>(null);
  const [batchOccurrences, setBatchOccurrences] = useState<{
    items: ApiOccurrenceListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
  } | null>(null);
  const [batchMeta, setBatchMeta] = useState<{
    batchId: string;
    operationTypeKey: string;
    sourceType: string;
    sourceId: string;
    state: string;
    receivedAt: string;
  } | null>(null);
  const [summary,       setSummary]       = useState<ApiBatchSummary | null>(null);
  const [selOccurrence, setSelOccurrence] = useState<ApiOccurrenceDetail | null>(null);
  const [loadingBatch,  setLoadingBatch]  = useState(false);
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [checked,       setChecked]       = useState<Set<string>>(new Set());
  const [filters,       setFilters]       = useState({ q: '', pend: true, ocultar: true });
  const [toast,         setToast]         = useState<{ k: 'ok' | 'warn' | 'info'; m: string } | null>(null);
  const [modal,         setModal]         = useState<ModalKind>(null);
  const [auditEntries,  setAuditEntries]  = useState<ApiBatchAuditEntry[]>([]);
  const [auditLoading,  setAuditLoading]  = useState(false);
  const [auditError,    setAuditError]    = useState(false);

  const flash = useCallback((k: 'ok' | 'warn' | 'info', m: string) => {
    setToast({ k, m });
    setTimeout(() => setToast(null), 3400);
  }, []);

  // On mount: fetch schema + batch list in parallel (schema cached for session)
  useEffect(() => {
    schemasApi.get('cadastral-movement')
      .then(setApiSchema)
      .catch(() => setSchemaError('Erro ao carregar schema. Recarregue a página.'));

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

  // Load batch detail + summary + audit when selection changes (schema NOT re-fetched)
  useEffect(() => {
    if (!selBatchId) return;
    setLoadingBatch(true);
    setChecked(new Set());
    setSelOccurrence(null);
    setAuditLoading(true);
    setAuditError(false);
    Promise.all([
      batchesApi.detail(selBatchId, { pageSize: 200 }),
      batchesApi.summary(selBatchId),
      batchesApi.audit(selBatchId),
    ])
      .then(([detail, sum, audit]) => {
        setBatchMeta({
          batchId:          detail.batchId,
          operationTypeKey: detail.operationTypeKey,
          sourceType:       detail.sourceType,
          sourceId:         detail.sourceId,
          state:            detail.state,
          receivedAt:       detail.receivedAt,
        });
        setBatchOccurrences(detail.occurrences);
        setSummary(sum);
        setAuditEntries(audit);
        setAuditLoading(false);
      })
      .catch(() => {
        flash('warn', 'Erro ao carregar lote.');
        setAuditError(true);
        setAuditLoading(false);
      })
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
    if (batchOccurrences) {
      const updatedItems = batchOccurrences.items.map(item =>
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
      setBatchOccurrences({ ...batchOccurrences, items: updatedItems });
    }
    if (selBatchId) batchesApi.summary(selBatchId).then(setSummary).catch(() => {});
  };

  const schema = apiSchema?.fields ?? [];

  // Client-side triage filtering
  const view = useMemo(() => {
    if (!batchOccurrences) return { rs: [], oc: 0 };
    let rs = batchOccurrences.items;

    if (filters.q) {
      const q = filters.q.toLowerCase();
      rs = rs.filter(r =>
        r.fields.some(f => f.value.toLowerCase().includes(q))
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
  }, [batchOccurrences, filters]);

  // Batch actions — API is the validity authority (D9: no pre-filtering by blocking errors)
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

  const bulkApprove = async (ids: string[]) => {
    try {
      await occurrencesApi.batchApprove(ids);
      flash('ok', `${ids.length} movimentação(ões) aprovada(s).`);
    } catch {
      flash('warn', 'Erro na operação em lote.');
    }
    setChecked(new Set());
    await refreshBatch();
  };

  const bulkReject = async (ids: string[], reason: string) => {
    try {
      await occurrencesApi.batchReject(ids, reason);
      flash('ok', `${ids.length} movimentação(ões) rejeitada(s).`);
    } catch {
      flash('warn', 'Erro na operação em lote.');
    }
    setChecked(new Set()); setModal(null);
    await refreshBatch();
  };

  const bulkDisable = async (ids: string[]) => {
    try {
      await occurrencesApi.batchDisable(ids);
      flash('ok', `${ids.length} movimentação(ões) desabilitada(s).`);
    } catch {
      flash('warn', 'Erro na operação em lote.');
    }
    setChecked(new Set());
    await refreshBatch();
  };

  const handleXlsxUploadSuccess = async () => {
    setModal(null);
    try {
      const res = await batchesApi.list({ operationTypeKey: 'cadastral-movement', pageSize: 50 });
      setBatches(res.items);
      if (res.items.length > 0) setSelBatchId(res.items[0].batchId);
    } catch {
      // list stays stale; user can reload
    }
    flash('ok', 'Lote importado com sucesso');
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

  // Auth / critical error banner
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

  // Schema load error — cannot render table without schema
  if (schemaError) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dim-ok" style={{ flexDirection: 'column', gap: 8 }}>
          <I n="alert" s={24} />
          <div>{schemaError}</div>
        </div>
      </div>
    );
  }

  const orderedSchema = schema.slice().sort((a, b) => a.displayOrder - b.displayOrder);
  const TABLE_COLUMN_LIMIT = 5;
  const tableSchema = orderedSchema.slice(0, TABLE_COLUMN_LIMIT);

  // Dynamic grid columns: checkbox + tipo + N schema fields (capped) + conferência + status + chevron
  const gridCols = tableSchema.length > 0
    ? `minmax(38px,.28fr) minmax(88px,.72fr) ${tableSchema.map(() => 'minmax(100px,1fr)').join(' ')} minmax(110px,.9fr) minmax(100px,.8fr) minmax(32px,.25fr)`
    : 'minmax(38px,.28fr) minmax(88px,.72fr) minmax(120px,1fr) minmax(110px,.9fr) minmax(100px,.8fr) minmax(32px,.25fr)';

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
        ) : batchMeta && batchOccurrences ? (
          <>
            <div className="m-head">
              <div className="m-head-row">
                <div>
                  <div className="eyebrow"><I n="building" s={13} /> Lote · {batchMeta.operationTypeKey}</div>
                  <h1>{apiSchema?.displayName ?? batchMeta.operationTypeKey}</h1>
                  <div className="m-sub">
                    <span className="mono">{batchMeta.batchId}</span>
                    <span className="dot">·</span>{batchMeta.sourceType} / {batchMeta.sourceId}
                    <span className="dot">·</span>{new Date(batchMeta.receivedAt).toLocaleDateString('pt-BR')}
                    <span className="dot">·</span>Estado: {batchMeta.state}
                  </div>
                </div>
                <div className="m-actions">
                  <button className="btn btn-ghost" onClick={() => setModal('diary')}>
                    <I n="book" s={16} /> Diário do lote
                  </button>
                  <button className="btn btn-ghost" onClick={() => setModal('xlsx-upload')}>
                    <I n="upload" s={16} /> Importar planilha
                  </button>
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
                  placeholder="Buscar em todos os campos"
                />
              </span>
              <Tog on={filters.pend}    onClick={() => setFilters(s => ({ ...s, pend: !s.pend }))}       label="Só pendências" />
              <Tog on={filters.ocultar} onClick={() => setFilters(s => ({ ...s, ocultar: !s.ocultar }))} label="Ocultar conformes" />
              <span className="fcount">{view.rs.length} em conferência</span>
            </div>

            {checked.size > 0 && (
              <div className="batchbar">
                <span className="bb-count">{checked.size} selecionada(s)</span>
                <button className="bb-app" onClick={() => bulkApprove(Array.from(checked))}><I n="checkCircle" s={14} /> Aprovar selecionados</button>
                <button className="bb-rej" onClick={() => setModal('bulk-reject')}><I n="xCircle" s={14} /> Rejeitar selecionados</button>
                <button className="bb-dis" onClick={() => bulkDisable(Array.from(checked))}><I n="ban" s={14} /> Desabilitar selecionados</button>
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
                <thead>
                  <tr style={{ gridTemplateColumns: gridCols }}>
                    <th className="w-chk">
                      <SelectAllCheckbox
                        checked={view.rs.length > 0 && checked.size === view.rs.length}
                        indeterminate={checked.size > 0 && checked.size < view.rs.length}
                        onChange={() => {
                          if (checked.size === view.rs.length) {
                            setChecked(new Set());
                          } else {
                            setChecked(new Set(view.rs.map(r => r.occurrenceId)));
                          }
                        }}
                      />
                    </th>
                    {/* Fixed first data column */}
                    <th>Tipo</th>
                    {tableSchema.map(sf => (
                      <th key={sf.key}>{sf.displayLabel}</th>
                    ))}
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
                      schema={tableSchema}
                      checked={checked.has(r.occurrenceId)}
                      onCheck={() => setChecked(s => {
                        const n = new Set(s);
                        if (n.has(r.occurrenceId)) { n.delete(r.occurrenceId); } else { n.add(r.occurrenceId); }
                        return n;
                      })}
                      onOpen={() => openOccurrence(r.occurrenceId)}
                      gridCols={gridCols}
                    />
                  ))}
                  {view.rs.length === 0 && (
                    <tr style={{ gridTemplateColumns: gridCols }}>
                      <td colSpan={tableSchema.length + 4} className="empty">
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

      {selOccurrence && !loadingDrawer && (
        <Drawer
          detail={selOccurrence}
          schema={schema}
          onClose={() => setSelOccurrence(null)}
          onUpdate={handleOccurrenceUpdate}
          flash={flash}
        />
      )}

      {modal === 'diary' && (
        <DiaryModal
          entries={auditEntries}
          loading={auditLoading}
          error={auditError}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'bulk-reject' && (
        <BulkRejectModal
          count={checked.size}
          onConfirm={reason => bulkReject(Array.from(checked), reason)}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'xlsx-upload' && (
        <XlsxUploadModal
          onSuccess={handleXlsxUploadSuccess}
          onClose={() => setModal(null)}
        />
      )}

      {toast && <Toast k={toast.k} m={toast.m} />}
    </div>
  );
}
