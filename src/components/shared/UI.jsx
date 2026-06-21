import React from 'react';
import { I } from './Icons';
import { LABEL, MONO, hasErro } from '../../data/seed';

export function Sel({ value, onChange, options }) {
  return (
    <select className="sel" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export function Tog({ on, onClick, label }) {
  return (
    <button onClick={onClick} className={"tog" + (on ? " on" : "")}>
      <span className="tog-mark">{on && <I n="check" s={10} />}</span>
      {label}
    </button>
  );
}

export function Progress({ recs }) {
  const total = recs.length;
  const done  = recs.filter(r => ["aprovado","rejeitado","exportado","confirmado","recusado","desabilitado"].includes(r.status)).length;
  const conf  = recs.filter(r => r.status === "confirmado").length;
  const er    = recs.filter(hasErro).length;
  const pct   = total ? Math.round(done / total * 100) : 0;
  return (
    <div className="prog">
      <div className="prog-bar"><div className="prog-fill" style={{ width: pct + "%" }} /></div>
      <div className="prog-tx">{done} de {total} conferidas · {pct}%</div>
      {conf > 0 && <div className="prog-core"><I n="database" s={13} />{conf} no Core</div>}
      {er   > 0 && <div className="prog-err"><I n="alert" s={13} />{er} com erro</div>}
    </div>
  );
}

export function Toast({ k, m }) {
  const ic = k === "ok" ? "checkCircle" : k === "warn" ? "alert" : "info";
  return (
    <div className={"toast toast-" + k}>
      <I n={ic} s={16} /> {m}
    </div>
  );
}

export function Modal({ title, icon, children, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-bg" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <div className="modal-title"><I n={icon} s={18} /> {title}</div>
          <button className="iconbtn" onClick={onClose}><I n="x" s={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function TLItem({ ev }) {
  const core  = ev.tipo === "core";
  const human = ev.origem === "humano";
  const kind  = core ? "Core" : human ? "Diário" : "Auditoria";
  return (
    <li className="tli">
      <div className="tli-rail">
        <span className={"tli-dot " + (core ? "d-core" : human ? "d-hum" : "d-sys")} />
        <span className="tli-line" />
      </div>
      <div className="tli-body">
        <div className="tli-meta">
          <span className={"tli-kind " + (core ? "k-core" : human ? "k-hum" : "k-sys")}>{kind}</span>
          <span>·</span><span>{ev.autor}</span><span>·</span><span>{ev.quando}</span>
        </div>
        <div className="tli-tx">{ev.texto}</div>
        {ev.tipo === "campo" && (
          <div className="tli-delta">
            <span className="old">{ev.de}</span>
            <I n="arrowR" s={12} />
            <span>{ev.para}</span>
          </div>
        )}
      </div>
    </li>
  );
}

export function Field({ k, cell, value, onChange, showOrig }) {
  const full  = k === "nome" || k === "plano";
  const ambig = cell.origem.transform === "Ambígua";
  const o     = cell.origem;
  return (
    <label className={"fld" + (full ? " full" : "")}>
      <span className="fl">
        {LABEL[k] || k}
        {ambig && <span className="ambig-tag">origem ambígua</span>}
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className={(MONO.has(k) ? "mono small " : "") + (ambig ? "amb" : "")}
      />
      {showOrig && (
        <span className={"orig" + (ambig ? " amber" : "") + (o.coluna === "—" ? " grey" : "")}>
          <I n="swap" s={11} />
          {o.coluna === "—"
            ? <span>sem origem (derivado)</span>
            : <span>← <b className="mono">{o.coluna}</b>{o.linha ? " · linha " + o.linha : ""} · {o.transform}</span>
          }
          {o.candidatos && <span className="cand"> · candidatos: {o.candidatos.join(", ")}</span>}
        </span>
      )}
    </label>
  );
}

export function Dimension({ title, hint, items }) {
  return (
    <div className="dim">
      <div className="dim-head">
        <span className="sec-lbl">{title}</span>
        <span className="dim-hint">{hint}</span>
      </div>
      {items.length === 0
        ? <div className="dim-ok"><I n="shield" s={16} /> Sem apontamentos.</div>
        : items.map((v, i) => {
            const k  = v.sev === "erro" ? "v-err" : v.sev === "aviso" ? "v-warn" : "v-info";
            const ic = v.sev === "erro" ? "xCircle" : v.sev === "aviso" ? "alert" : "info";
            return (
              <div key={i} className={"vitem " + k}>
                <div className="vitem-msg">
                  <I n={ic} s={16} cls="vitem-ic" />
                  <span>{v.msg}</span>
                </div>
                {v.core && (
                  <div className="vcore">
                    <I n="database" s={14} />
                    <span>{v.core}</span>
                  </div>
                )}
                {v.regra && (
                  <div className="cascade">
                    <div className="cascade-lbl">Regra: {v.regra.nome}</div>
                    {v.regra.camadas.map((c, j) => (
                      <div key={j} className="crow">
                        <span className={"cdot " + (c.estado === "vigente" ? "on" : "off")} />
                        <span className={c.estado === "vigente" ? "cvig-tx" : "coff"}>{c.nivel}: {c.valor}</span>
                        {c.estado === "vigente" && <span className="cvig">vigente</span>}
                      </div>
                    ))}
                    <div className="cres"><I n="corner" s={14} />{v.regra.resultado}</div>
                  </div>
                )}
              </div>
            );
          })
      }
    </div>
  );
}
