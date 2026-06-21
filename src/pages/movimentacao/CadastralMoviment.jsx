import React, { useMemo, useState } from 'react';
import { I } from '../../components/shared/Icons';
import { Sel, Tog, Progress, Toast, Modal, TLItem, Field, Dimension } from '../../components/shared/UI';
import {
  CATALOG, batches, seed, tipoCls, stMeta,
  hasErro, hasAviso, now, ANALISTA, CP
} from '../../data/seed';

// ===== Layout helper =====
function layoutV(cp) {
  return { "Bradesco Saúde": "v3.2", "CNU": "v1.7", "Seguros Unimed": "v2.0", "GNDI": "v4.1", "MetLife": "v1.0" }[cp] || "v1.0";
}

// ===== Row =====
function Row({ r, checked, onCheck, onOpen }) {
  const cls = hasErro(r) ? "row-err" : hasAviso(r) ? "row-warn" : "";
  const er  = r.validacoes.filter(v => v.sev === "erro").length;
  const av  = r.validacoes.filter(v => v.sev === "aviso").length;
  const dim = r.status === "desabilitado";
  const tit = r.campos.parentesco.value === "Titular";
  return (
    <tr onClick={onOpen} className={"row " + cls + (dim ? " dimmed" : "")}>
      <td className="w-chk" onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={checked} onChange={onCheck} />
      </td>
      <td><span className={"badge " + tipoCls[r.tipo]}>{r.tipo}</span></td>
      <td>
        <div className="ben">
          <I n={tit ? "user" : "users"} s={14} cls="ben-ic" />
          <span className={"ben-name" + (dim ? " struck" : "")}>{r.campos.nome.value}</span>
          {r.compensaDe && <span className="comp-tag">compensa {r.compensaDe}</span>}
        </div>
        <div className="ben-sub">
          {r.campos.parentesco.value}
          {r.vida && r.vida !== "VIDA-—" ? <span className="vida"> · {r.vida}</span> : ""}
        </div>
      </td>
      <td className="mono small">{r.campos.cpf.value}</td>
      <td>
        <span className="cp-name">{r.destino.nome}</span>{" "}
        <span className={"kind " + (r.destino.kind === "seguradora" ? "kind-seg" : "kind-op")}>{r.destino.kind}</span>
      </td>
      <td className="plano">{r.campos.plano.value}</td>
      <td>
        {er > 0 && <span className="chip chip-err">{er} erro{er > 1 ? "s" : ""}</span>}
        {av > 0 && <span className="chip chip-warn">{av} aviso{av > 1 ? "s" : ""}</span>}
        {er + av === 0 && <span className="chip chip-ok">conforme</span>}
      </td>
      <td><span className={"badge " + stMeta[r.status].c}>{stMeta[r.status].l}</span></td>
      <td className="chevcell"><I n="chevR" s={16} cls="chev" /></td>
    </tr>
  );
}

// ===== Drawer =====
function Drawer({ r, onClose, patch, onApprove, onReject, onDisable, onReturn, onCompensate, flash }) {
  const [showOrig, setShowOrig] = useState(false);
  const [nota, setNota] = useState("");
  const init = {};
  Object.keys(r.campos).forEach(k => init[k] = r.campos[k].value);
  const [draft, setDraft] = useState(init);
  const blocked = hasErro(r);

  const save = () => {
    const ev = [];
    Object.keys(draft).forEach(k => {
      if (draft[k] !== r.campos[k].value) ev.push({
        id: r.id + Date.now() + k, origem: "sistema", tipo: "campo", autor: ANALISTA, quando: now(),
        texto: `Campo "${r.campos[k] ? k : k}" alterado.`, de: r.campos[k].value || "—", para: draft[k] || "—"
      });
    });
    if (!ev.length) { flash("warn", "Nenhuma alteração."); return; }
    const novos = {};
    Object.keys(r.campos).forEach(k => novos[k] = {
      ...r.campos[k], value: draft[k],
      origem: draft[k] !== r.campos[k].value ? { coluna: "edição manual", transform: "Manual", linha: null } : r.campos[k].origem
    });
    patch(r.id, { campos: novos }, ev);
    flash("ok", ev.length + " alteração(ões) salva(s) na auditoria.");
  };

  const addNota = () => {
    if (!nota.trim()) return;
    patch(r.id, {}, [{ id: r.id + "n" + Date.now(), origem: "humano", tipo: "nota", autor: ANALISTA, quando: now(), texto: nota.trim() }]);
    setNota("");
  };

  return (
    <div className="drawer-overlay">
      <div className="drawer-bg" onClick={onClose} />
      <div className="drawer">
        <div className="dr-head">
          <div>
            <div className="dr-badges">
              <span className={"badge " + tipoCls[r.tipo]}>{r.tipo}</span>
              <span className={"badge " + stMeta[r.status].c}>{stMeta[r.status].l}</span>
              {r.compensaDe && <span className="comp-tag">compensa {r.compensaDe}</span>}
            </div>
            <h2>{r.campos.nome.value}</h2>
            <div className="mono dr-id">{r.id} · {r.destino.nome} ({r.destino.kind}) · competência {r.campos.competencia.value}</div>
          </div>
          <button className="iconbtn" onClick={onClose}><I n="x" s={20} /></button>
        </div>

        <div className="dr-body">
          {r.delta && (
            <div className="delta">
              <div className="delta-lbl">O que mudou</div>
              <div className="delta-row">
                <b>{r.delta.campo}:</b> <span className="old">{r.delta.de}</span>
                <I n="arrowR" s={14} cls="delta-arr" />
                <b>{r.delta.para}</b>
              </div>
            </div>
          )}

          <div className={"core-box" + (r.coreApplied ? " applied" : "")}>
            <div className="core-lbl">
              <I n="database" s={14} />
              {r.coreApplied ? "Aplicado ao Alper Core" : "Efeito previsto no Alper Core"}
            </div>
            <div className="core-eff">
              {r.coreApplied && <I n="checkCircle" s={16} cls="core-check" />}
              {r.coreEffect}
            </div>
            {!r.coreApplied && (
              <div className="core-note">Será gravado quando a operadora/seguradora confirmar a movimentação.</div>
            )}
          </div>

          <Dimension title="Conformidade da captura" hint="A tradução de entrada foi fiel?" items={r.validacoes.filter(v => v.dim === "captura")} />
          <Dimension title="Validade da movimentação" hint="O evento faz sentido?" items={r.validacoes.filter(v => v.dim === "movimentacao")} />

          <div className="fields">
            <div className="fields-head">
              <span className="sec-lbl"><I n="pencil" s={13} /> Campos canônicos</span>
              <button className={"origbtn" + (showOrig ? " on" : "")} onClick={() => setShowOrig(s => !s)}>
                <I n={showOrig ? "eyeOff" : "eye"} s={13} /> Origem da captura
              </button>
            </div>
            {CATALOG.map(g => (
              <div key={g.group} className="fgroup">
                <div className="fgroup-lbl">{g.group}</div>
                <div className="fgrid">
                  {g.fields.map(k => (
                    <Field key={k} k={k} cell={r.campos[k]} value={draft[k]}
                      onChange={v => setDraft(d => ({ ...d, [k]: v }))} showOrig={showOrig} />
                  ))}
                </div>
              </div>
            ))}
            <button className="btn btn-ghost save-btn" onClick={save}>
              <I n="check" s={16} /> Salvar alterações
            </button>
          </div>

          <div className="tl-sec">
            <div className="sec-lbl"><I n="clock" s={13} /> Histórico · auditoria e diário</div>
            <div className="nota-row">
              <input value={nota} onChange={e => setNota(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNota()}
                placeholder="Adicionar observação…" />
              <button className="nota-btn" onClick={addNota}><I n="msg" s={16} /></button>
            </div>
            <ol className="tl">{r.timeline.slice().reverse().map(ev => <TLItem key={ev.id} ev={ev} />)}</ol>
          </div>
        </div>

        <div className="dr-foot">
          {r.status === "pendente" && (
            <div className="foot-row">
              <button disabled={blocked} className={"btn btn-app" + (blocked ? " disabled" : "")} onClick={blocked ? null : onApprove}>
                <I n="checkCircle" s={16} /> Aprovar
              </button>
              <button className="btn btn-rejo" onClick={onReject}><I n="xCircle" s={16} /> Rejeitar</button>
              <button className="btn btn-ghost foot-dis" onClick={onDisable}><I n="ban" s={16} /> Desabilitar</button>
            </div>
          )}
          {(r.status === "aprovado" || r.status === "exportado") && (
            <div className="foot-row">
              <span className="foot-hint">Simular retorno:</span>
              <button className="btn btn-core" onClick={() => onReturn(true)}><I n="database" s={16} /> Confirmar → Core</button>
              <button className="btn btn-rejo" onClick={() => onReturn(false)}><I n="xCircle" s={16} /> Recusar</button>
            </div>
          )}
          {r.status === "confirmado" && (
            <div className="foot-done"><I n="checkCircle" s={16} /> Vínculo aplicado ao Alper Core. Evento encerrado.</div>
          )}
          {r.status === "recusado" && (
            <div className="foot-row">
              <span className="foot-hint">Recusada.</span>
              <button className="btn btn-primary" onClick={onCompensate}><I n="branch" s={16} /> Gerar movimentação compensatória</button>
            </div>
          )}
          {blocked && r.status === "pendente" && (
            <div className="foot-err">Há erro bloqueante. Resolva a pendência antes de aprovar.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Export Modal =====
function ExportModal({ brecs, artifacts, onExport, onClose }) {
  const cps = Object.values(CP).map(c => c.nome);
  return (
    <Modal onClose={onClose} title="Exportar por operadora / seguradora" icon="download">
      <p className="modal-p">Cada exportação gera um <b>artefato versionado</b> (arquivo + layout + vidas). Só entram movimentações aprovadas.</p>
      <div className="exp-list">
        {cps.map(cp => {
          const ap = brecs.filter(r => r.destino.nome === cp && r.status === "aprovado").length;
          const pd = brecs.filter(r => r.destino.nome === cp && r.status === "pendente").length;
          return (
            <div key={cp} className="exp-row">
              <div>
                <div className="exp-name">{cp} <span className="mono exp-layout">layout {layoutV(cp)}</span></div>
                <div className="exp-meta">{ap} aprovada(s) · {pd} pendente(s)</div>
              </div>
              <button disabled={!ap} className={"btn " + (ap ? "btn-primary" : "btn-disabled")} onClick={ap ? () => onExport(cp) : null}>
                <I n="download" s={16} /> Gerar
              </button>
            </div>
          );
        })}
      </div>
      {artifacts.length > 0 && (
        <div className="exp-arts">
          <div className="exp-arts-lbl">Arquivos gerados</div>
          {artifacts.map(a => (
            <div key={a.id} className="art">
              <I n="package" s={16} cls="art-ic" />
              <span className="mono small">{a.arquivo}</span>
              <span className="art-meta">{a.n} vida(s) · {a.quando}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ===== Reject Modal =====
function RejectModal({ count, onConfirm, onClose }) {
  const [m, setM] = useState("");
  return (
    <Modal onClose={onClose} title={`Rejeitar ${count} movimentação(ões)`} icon="xCircle">
      <p className="modal-p">O motivo é obrigatório e fica registrado no diário de cada movimentação.</p>
      <textarea value={m} onChange={e => setM(e.target.value)} rows={3} placeholder="Ex.: CPF divergente, aguardando correção do cliente." />
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button disabled={!m.trim()} className={"btn " + (m.trim() ? "btn-rejo-solid" : "btn-disabled")}
          onClick={m.trim() ? () => onConfirm(m.trim()) : null}>
          Confirmar rejeição
        </button>
      </div>
    </Modal>
  );
}

// ===== Diary Modal =====
function DiaryModal({ batch, onClose }) {
  return (
    <Modal onClose={onClose} title={`Diário do lote ${batch.id}`} icon="book">
      <p className="modal-p">Histórico compartilhado do lote — qualquer analista acompanha o que aconteceu e por quê.</p>
      <ol className="tl">
        {batch.diario.length === 0
          ? <li className="muted">Sem anotações ainda.</li>
          : batch.diario.slice().reverse().map(ev => <TLItem key={ev.id} ev={ev} />)
        }
      </ol>
    </Modal>
  );
}

// ===== Page =====
export default function CadastralMoviment() {
  const [records, setRecords]   = useState(seed);
  const [selBatch, setSelBatch] = useState("LT-2026-0619-A");
  const [sel, setSel]           = useState(null);
  const [checked, setChecked]   = useState(() => new Set());
  const [filters, setFilters]   = useState({ q: "", cp: "Todas", tipo: "Todos", pend: true, ocultar: true });
  const [toast, setToast]       = useState(null);
  const [modal, setModal]       = useState(null);
  const [rejectCtx, setRejectCtx] = useState(null);
  const [artifacts, setArtifacts] = useState([]);

  const batch = batches.find(b => b.id === selBatch);
  const brecs = records.filter(r => r.batchId === selBatch);

  const flash = (k, m) => { setToast({ k, m }); setTimeout(() => setToast(null), 3400); };

  const view = useMemo(() => {
    let rs = brecs;
    if (filters.q) { const q = filters.q.toLowerCase(); rs = rs.filter(r => r.campos.nome.value.toLowerCase().includes(q) || r.campos.cpf.value.includes(q)); }
    if (filters.cp   !== "Todas") rs = rs.filter(r => r.destino.nome === filters.cp);
    if (filters.tipo !== "Todos") rs = rs.filter(r => r.tipo === filters.tipo);
    if (filters.pend) rs = rs.filter(r => r.status === "pendente");
    const oc = filters.ocultar ? rs.filter(r => r.status === "pendente" && !hasErro(r) && !hasAviso(r)).length : 0;
    if (filters.ocultar) rs = rs.filter(r => !(r.status === "pendente" && !hasErro(r) && !hasAviso(r)));
    const rank = r => hasErro(r) ? 0 : hasAviso(r) ? 1 : 2;
    return { rs: rs.slice().sort((a, b) => rank(a) - rank(b)), oc };
  }, [brecs, filters]);

  const patch = (id, p, ev = []) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...p, timeline: r.timeline.concat(ev) } : r));
  };

  const approve = ids => {
    let ok = 0, skip = 0;
    setRecords(prev => prev.map(r => {
      if (!ids.includes(r.id) || r.status !== "pendente") return r;
      if (hasErro(r)) { skip++; return r; }
      ok++;
      return { ...r, status: "aprovado", timeline: r.timeline.concat([{ id: r.id + Date.now(), origem: "humano", tipo: "estado", autor: ANALISTA, quando: now(), texto: "Movimentação aprovada." }]) };
    }));
    setChecked(new Set());
    flash(ok && skip ? "warn" : ok ? "ok" : "warn",
      ok && skip ? `${ok} aprovada(s). ${skip} com erro bloqueante ignorada(s).`
      : ok ? `${ok} movimentação(ões) aprovada(s).` : "Nenhuma aprovada — há erro bloqueante.");
  };

  const doReject = (ids, motivo) => {
    setRecords(prev => prev.map(r => ids.includes(r.id) && r.status === "pendente"
      ? { ...r, status: "rejeitado", timeline: r.timeline.concat([{ id: r.id + Date.now(), origem: "humano", tipo: "estado", autor: ANALISTA, quando: now(), texto: "Rejeitada. Motivo: " + motivo }]) }
      : r
    ));
    setChecked(new Set()); setModal(null); setRejectCtx(null);
    flash("ok", ids.length + " movimentação(ões) rejeitada(s).");
  };

  const desabilitar = id => {
    patch(id, { status: "desabilitado" }, [{ id: id + Date.now(), origem: "humano", tipo: "estado", autor: ANALISTA, quando: now(), texto: "Movimentação desabilitada (soft-delete). Fora das exportações." }]);
    flash("ok", "Desabilitada. Permanece no histórico.");
  };

  const confirmarRetorno = (id, ok) => {
    const r = records.find(x => x.id === id);
    if (ok) patch(id, { status: "confirmado", coreApplied: true }, [
      { id: id + Date.now() + "a", origem: "sistema", tipo: "estado", autor: "Operadora/Seguradora", quando: now(), texto: "Retorno recebido: confirmado." },
      { id: id + Date.now() + "b", origem: "sistema", tipo: "core",   autor: "Alper Core",          quando: now(), texto: "Emitido ao Alper Core: " + r.coreEffect + "." }
    ]);
    else patch(id, { status: "recusado" }, [{ id: id + Date.now(), origem: "sistema", tipo: "estado", autor: "Operadora/Seguradora", quando: now(), texto: "Retorno recebido: recusado." }]);
    flash(ok ? "ok" : "warn", ok ? "Confirmada e aplicada ao Alper Core." : "Recusada pela operadora/seguradora.");
  };

  const compensar = id => {
    const r   = records.find(x => x.id === id);
    const nid = "R" + (90 + records.length);
    const novo = { ...r, id: nid, status: "pendente", validacoes: [], compensaDe: r.id, campos: { ...r.campos },
      timeline: [{ id: nid + "-t0", origem: "sistema", tipo: "estado", autor: "Atlas", quando: now(), texto: `Movimentação compensatória gerada a partir de ${r.id} (recusada).` }]
    };
    setRecords(prev => [novo, ...prev]);
    setSel(nid);
    flash("ok", `Movimentação compensatória ${nid} criada. O evento original permanece imutável.`);
  };

  const exportar = cpNome => {
    const el = brecs.filter(r => r.destino.nome === cpNome && r.status === "aprovado");
    if (!el.length) { flash("warn", "Nenhuma aprovada para " + cpNome + "."); return; }
    const art = { id: "ARQ-" + (artifacts.length + 1), cp: cpNome, layout: layoutV(cpNome), quando: now(), arquivo: cpNome.replace(/\s/g, "_").toUpperCase() + "_" + selBatch + ".csv", n: el.length };
    setArtifacts(p => [art, ...p]);
    setRecords(prev => prev.map(r => el.find(e => e.id === r.id)
      ? { ...r, status: "exportado", timeline: r.timeline.concat([{ id: r.id + Date.now(), origem: "sistema", tipo: "estado", autor: "Exportação", quando: now(), texto: `Incluída no arquivo ${art.arquivo} (layout ${art.layout}).` }]) }
      : r
    ));
    setModal(null);
    flash("ok", `Arquivo gerado: ${art.arquivo} · ${el.length} vida(s).`);
  };

  return (
    <div className="app app--slim">
      {/* ===== Batch rail ===== */}
      <aside className="rail">
        <div className="rail-lbl"><I n="layers" s={13} /> Lotes</div>
        <div className="rail-list">
          {batches.map(b => (
            <button key={b.id} onClick={() => { setSelBatch(b.id); setSel(null); setChecked(new Set()); }}
              className={"lote" + (b.id === selBatch ? " active" : "")}>
              <div className="lote-top">
                <span className="mono lote-id">{b.id}</span>
                {b.erros > 0 && <span className="lote-err"><I n="alert" s={12} />{b.erros}</span>}
              </div>
              <div className="lote-name">{b.cliente}</div>
              <div className="lote-meta">{b.fonte} · {b.pend} pendente(s)</div>
            </button>
          ))}
        </div>
        <div className="rail-foot">{ANALISTA}</div>
      </aside>

      {/* ===== Main content ===== */}
      <main className="main">
        <div className="m-head">
          <div className="m-head-row">
            <div>
              <div className="eyebrow"><I n="building" s={13} /> Cliente · competência</div>
              <h1>{batch.cliente}</h1>
              <div className="m-sub">
                <span className="mono">{batch.id}</span>
                <span className="dot">·</span>
                Competência {batch.competencia}
                <span className="dot">·</span>
                Origem: {batch.fonte}
              </div>
            </div>
            <div className="m-actions">
              <button className="btn btn-ghost" onClick={() => setModal("diary")}>
                <I n="book" s={16} /> Diário do lote
              </button>
              <button className="btn btn-primary" onClick={() => setModal("export")}>
                <I n="download" s={16} /> Exportar
              </button>
            </div>
          </div>
          <Progress recs={brecs} />
        </div>

        <div className="filterbar">
          <span className="inp-wrap">
            <I n="search" s={16} cls="inp-ic" />
            <input value={filters.q} onChange={e => setFilters(s => ({ ...s, q: e.target.value }))} placeholder="Buscar nome ou CPF" />
          </span>
          <Sel value={filters.cp}   onChange={v => setFilters(s => ({ ...s, cp: v }))}   options={["Todas",  "Bradesco Saúde", "CNU", "Seguros Unimed", "GNDI", "MetLife"]} />
          <Sel value={filters.tipo} onChange={v => setFilters(s => ({ ...s, tipo: v }))} options={["Todos", "Inclusão", "Exclusão", "Alteração"]} />
          <Tog on={filters.pend}    onClick={() => setFilters(s => ({ ...s, pend: !s.pend }))}       label="Só pendências" />
          <Tog on={filters.ocultar} onClick={() => setFilters(s => ({ ...s, ocultar: !s.ocultar }))} label="Ocultar conformes" />
          <span className="fcount">{view.rs.length} em conferência</span>
        </div>

        {checked.size > 0 && (
          <div className="batchbar">
            <span className="bb-count">{checked.size} selecionada(s)</span>
            <button className="bb-app" onClick={() => approve(Array.from(checked))}><I n="checkCircle" s={14} /> Aprovar</button>
            <button className="bb-rej" onClick={() => { setRejectCtx({ ids: Array.from(checked) }); setModal("reject"); }}><I n="xCircle" s={14} /> Rejeitar</button>
            <button className="bb-clear" onClick={() => setChecked(new Set())}>Limpar</button>
          </div>
        )}

        {view.oc > 0 && (
          <div className="banner">
            <I n="shield" s={14} />{view.oc} movimentação(ões) conformes ocultas.
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
                <th className="w-chk" /><th>Tipo</th><th>Beneficiário</th><th>CPF</th>
                <th>Operadora / Seguradora</th><th>Plano</th><th>Conferência</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {view.rs.map(r => (
                <Row key={r.id} r={r} checked={checked.has(r.id)}
                  onCheck={() => setChecked(s => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}
                  onOpen={() => setSel(r.id)} />
              ))}
              {view.rs.length === 0 && (
                <tr><td colSpan={9} className="empty"><I n="list" s={24} /><div>Nada para conferir com os filtros atuais.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-legend">
          <span><span className="sw sw-err" />Erro</span>
          <span><span className="sw sw-warn" />Aviso</span>
          <span><span className="sw sw-teal" />Origem da captura</span>
          <span><span className="sw sw-navy" />Efeito no Core</span>
        </div>
        <div className="legend">
          <span className="legend-rt">2026 Alper Seguros · Uso Interno - Confidencial · Atlas mantém o evento / Core mantém o vínculo</span>
        </div>
      </main>

      {/* ===== Overlays ===== */}
      {sel && (
        <Drawer r={records.find(x => x.id === sel)} onClose={() => setSel(null)} patch={patch}
          onApprove={() => approve([sel])}
          onReject={() => { setRejectCtx({ ids: [sel] }); setModal("reject"); }}
          onDisable={() => desabilitar(sel)}
          onReturn={ok => confirmarRetorno(sel, ok)}
          onCompensate={() => compensar(sel)}
          flash={flash} />
      )}
      {modal === "export" && <ExportModal brecs={brecs} artifacts={artifacts} onExport={exportar} onClose={() => setModal(null)} />}
      {modal === "reject" && <RejectModal count={rejectCtx.ids.length} onConfirm={m => doReject(rejectCtx.ids, m)} onClose={() => { setModal(null); setRejectCtx(null); }} />}
      {modal === "diary"  && <DiaryModal batch={batch} onClose={() => setModal(null)} />}
      {toast && <Toast k={toast.k} m={toast.m} />}
    </div>
  );
}
