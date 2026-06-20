const {
  useState,
  useMemo
} = React;

/* ===== ícones (SVG inline, MIT/Feather) ===== */
const ICONS = {
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  xCircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  chevR: '<polyline points="9 18 15 12 9 6"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  ban: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>',
  arrowR: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  swap: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  package: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  list: '<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  corner: '<polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>',
  branch: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'
};
function I({
  n,
  s = 16,
  cls = ""
}) {
  return /*#__PURE__*/React.createElement("svg", {
    className: cls,
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "inline-block",
      verticalAlign: "middle",
      flexShrink: 0
    },
    dangerouslySetInnerHTML: {
      __html: ICONS[n]
    }
  });
}

/* ===== catálogo canônico ===== */
const CATALOG = [{
  group: "Movimentação",
  fields: ["tipo", "competencia", "motivo", "destino"]
}, {
  group: "Beneficiário",
  fields: ["cnpj", "matricula", "nome", "cpf", "dtNasc", "nomeMae", "admissao"]
}, {
  group: "Vínculo & plano",
  fields: ["parentesco", "titularCpf", "plano"]
}];
const LABEL = {
  tipo: "Tipo",
  competencia: "Competência",
  motivo: "Motivo",
  destino: "Operadora / Seguradora",
  cnpj: "CNPJ",
  matricula: "Matrícula",
  nome: "Nome",
  cpf: "CPF",
  dtNasc: "Data de Nascimento",
  nomeMae: "Nome da Mãe",
  admissao: "Data de Admissão",
  parentesco: "Parentesco",
  titularCpf: "CPF do Titular",
  plano: "Plano"
};
const MONO = new Set(["cnpj", "cpf", "titularCpf", "matricula", "competencia", "dtNasc", "admissao"]);
const f = (value, coluna, transform = "Direta", linha = 42, candidatos = null) => ({
  value,
  origem: {
    coluna,
    transform,
    linha,
    candidatos
  }
});
const ANALISTA = "Você (Analista)";
const batches = [{
  id: "LT-2026-0619-A",
  cliente: "Construtora Vega S/A",
  competencia: "06/2026",
  fonte: "Planilha (e-mail)",
  pend: 6,
  erros: 3,
  diario: [{
    id: "bd1",
    origem: "sistema",
    autor: "Captura",
    quando: "19/06 08:12",
    texto: "Lote normalizado ao canônico · 14 movimentações · 11 com proveniência direta, 3 inferidas."
  }, {
    id: "bd2",
    origem: "humano",
    autor: ANALISTA,
    quando: "19/06 08:40",
    texto: "Cliente confirmou por telefone a exclusão do titular Marcos (demissão 17/06)."
  }]
}, {
  id: "LT-2026-0619-B",
  cliente: "Rede Saúde Vita",
  competencia: "06/2026",
  fonte: "API (SFTP)",
  pend: 9,
  erros: 1,
  diario: []
}];
const CP = {
  brad: {
    nome: "Bradesco Saúde",
    kind: "operadora"
  },
  cnu: {
    nome: "CNU",
    kind: "operadora"
  },
  unimed: {
    nome: "Seguros Unimed",
    kind: "operadora"
  },
  gndi: {
    nome: "GNDI",
    kind: "operadora"
  },
  metlife: {
    nome: "MetLife",
    kind: "seguradora"
  }
};
function rec(id, tipo, status, cpKey, vida, campos, validacoes, extra) {
  extra = extra || {};
  const base = {
    cnpj: f("12.345.678/0001-90", "CNPJ"),
    matricula: f("0" + id.slice(1) + "45", "Chapa"),
    admissao: f("12/03/2022", "Admissão"),
    nomeMae: f("Maria das Dores", "Mãe"),
    competencia: f("06/2026", "—", "Derivada"),
    motivo: f("—", "—"),
    parentesco: f("Titular", "Vínculo"),
    titularCpf: f("—", "—")
  };
  return {
    id,
    batchId: "LT-2026-0619-A",
    tipo,
    status,
    destino: CP[cpKey],
    vida,
    campos: Object.assign({}, base, campos, {
      tipo: f(tipo, "—", "Derivada"),
      destino: f(CP[cpKey].nome, CP[cpKey].kind === "seguradora" ? "Seguradora" : "Operadora")
    }),
    validacoes,
    timeline: [{
      id: id + "-t0",
      origem: "sistema",
      tipo: "estado",
      autor: "Captura",
      quando: "19/06 08:12",
      texto: "Movimentação capturada e normalizada ao modelo canônico."
    }].concat(status === "aprovado" ? [{
      id: id + "-t1",
      origem: "humano",
      tipo: "estado",
      autor: ANALISTA,
      quando: "19/06 08:30",
      texto: "Movimentação aprovada."
    }] : []),
    coreEffect: extra.coreEffect,
    delta: extra.delta
  };
}
const vCpf = {
  dim: "captura",
  sev: "erro",
  msg: "CPF inválido — falhou no dígito verificador.",
  campo: "cpf"
};
const vMae = {
  dim: "captura",
  sev: "aviso",
  msg: "Nome da Mãe ausente na origem.",
  campo: "nomeMae"
};
const vAmbig = {
  dim: "captura",
  sev: "aviso",
  msg: "Data de Nascimento inferida de coluna ambígua — confirme a origem.",
  campo: "dtNasc"
};
const vTitularCore = {
  dim: "movimentacao",
  sev: "erro",
  msg: "Titular não localizado como ativo.",
  core: "Consulta ao Core: VIDA do titular não encontrada como vínculo ativo."
};
const vExclCore = {
  dim: "movimentacao",
  sev: "erro",
  msg: "Vida não localizada como ativa para exclusão.",
  core: "Consulta ao Core: VIDA-00831 sem vínculo ativo na operadora."
};
const vPlano = {
  dim: "movimentacao",
  sev: "erro",
  msg: "Plano não habilitado para este CNPJ no contrato vigente."
};
const vIdade = {
  dim: "movimentacao",
  sev: "aviso",
  msg: "Dependente com 25 anos — dentro do limite por regra do cliente.",
  regra: {
    nome: "Limite de idade de dependente",
    camadas: [{
      nivel: "Base · Corretora",
      valor: "21 anos",
      estado: "sobreposta"
    }, {
      nivel: "Operadora · Bradesco Saúde",
      valor: "24 anos",
      estado: "sobreposta"
    }, {
      nivel: "Cliente · Construtora Vega",
      valor: "26 anos",
      estado: "vigente"
    }],
    resultado: "26 anos · dependente tem 25 → elegível (override de cliente aplicado)"
  }
};
const seed = [rec("R03", "Inclusão", "pendente", "cnu", "VIDA-—", {
  nome: f("Patrícia Lemos", "Funcionário"),
  cpf: f("330.456.781-22", "CPF"),
  parentesco: f("Cônjuge", "Vínculo"),
  titularCpf: f("777.111.000-99", "CPF Titular"),
  dtNasc: f("08/02/1991", "Dt Nasc"),
  plano: f("CNU Coletivo Plus", "Plano Contratado")
}, [vTitularCore], {
  coreEffect: "Criar vínculo ativo · dependente (cônjuge)"
}), rec("R05", "Exclusão", "pendente", "gndi", "VIDA-00831", {
  nome: f("Roberto Fagundes", "Funcionário"),
  cpf: f("888.222.111-30", "CPF"),
  motivo: f("A pedido", "Motivo"),
  dtNasc: f("19/07/1979", "Dt Nasc"),
  plano: f("GNDI Smart 200", "Plano Contratado")
}, [vExclCore], {
  coreEffect: "Desativar vínculo · VIDA-00831"
}), rec("R07", "Inclusão", "pendente", "cnu", "VIDA-—", {
  nome: f("Eduardo Pires", "Funcionário"),
  cpf: f("000.111.222-XX", "CPF"),
  nomeMae: f("", "—", "Ausente"),
  dtNasc: f("30/01/1988", "Dt Nasc"),
  plano: f("CNU Coletivo Plus", "Plano Contratado")
}, [vCpf, vMae], {
  coreEffect: "Criar vínculo ativo · titular"
}), rec("R13", "Inclusão", "pendente", "unimed", "VIDA-—", {
  nome: f("Bianca Rocha", "Funcionário"),
  cpf: f("123.456.789-09", "CPF"),
  dtNasc: f("12/12/1990", "Dt Nasc"),
  plano: f("Seguros Unimed Premium", "Plano Contratado")
}, [vPlano], {
  coreEffect: "Criar vínculo ativo · titular"
}), rec("R02", "Inclusão", "pendente", "brad", "VIDA-—", {
  nome: f("Lucas Soares", "Funcionário"),
  cpf: f("509.220.117-40", "CPF"),
  parentesco: f("Filho(a)", "Vínculo"),
  titularCpf: f("412.889.330-12", "CPF Titular"),
  dtNasc: f("03/05/2001", "Dt Nasc"),
  plano: f("Bradesco Saúde Top Nacional", "Plano Contratado")
}, [vIdade], {
  coreEffect: "Criar vínculo ativo · dependente de VIDA-00412"
}), rec("R12", "Inclusão", "pendente", "gndi", "VIDA-—", {
  nome: f("Rafael Nogueira", "Funcionário"),
  cpf: f("998.776.554-32", "CPF"),
  dtNasc: f("11/09/1985", "Nascimento?", "Ambígua", 57, ["Nascimento", "Dt. Admissão"]),
  plano: f("GNDI Smart 200", "Plano Contratado")
}, [vAmbig], {
  coreEffect: "Criar vínculo ativo · titular"
}), rec("R06", "Alteração", "pendente", "metlife", "VIDA-00145", {
  nome: f("Camila Duarte", "Funcionário"),
  cpf: f("145.987.220-08", "CPF"),
  dtNasc: f("22/06/1987", "Dt Nasc"),
  plano: f("MetLife Vida Pleno", "Plano Contratado")
}, [{
  dim: "movimentacao",
  sev: "aviso",
  msg: "Beneficiária com utilização recente no plano de origem — confirmar o upgrade."
}], {
  delta: {
    campo: "Plano",
    de: "MetLife Vida Básico",
    para: "MetLife Vida Pleno"
  },
  coreEffect: "Atualizar plano · Básico → Pleno (VIDA-00145)"
}), rec("R14", "Inclusão", "aprovado", "brad", "VIDA-—", {
  nome: f("Gustavo Henrique Alves", "Funcionário"),
  cpf: f("741.852.963-10", "CPF"),
  dtNasc: f("05/03/1992", "Dt Nasc"),
  plano: f("Bradesco Saúde Top Nacional", "Plano Contratado")
}, [], {
  coreEffect: "Criar vínculo ativo · titular"
})];
const tipoCls = {
  "Inclusão": "tipo-inc",
  "Exclusão": "tipo-exc",
  "Alteração": "tipo-alt"
};
const stMeta = {
  pendente: {
    l: "Pendente",
    c: "st-pend"
  },
  aprovado: {
    l: "Aprovado",
    c: "st-apr"
  },
  rejeitado: {
    l: "Rejeitado",
    c: "st-rej"
  },
  exportado: {
    l: "Exportado",
    c: "st-exp"
  },
  confirmado: {
    l: "Confirmado",
    c: "st-conf"
  },
  recusado: {
    l: "Recusado",
    c: "st-rej"
  },
  desabilitado: {
    l: "Desabilitado",
    c: "st-dis"
  }
};
const hasErro = r => r.validacoes.some(v => v.sev === "erro");
const hasAviso = r => r.validacoes.some(v => v.sev === "aviso");
const now = () => "19/06 " + new Date().toTimeString().slice(0, 5);

/* ============================== APP =============================== */
function App() {
  const [entered, setEntered] = useState(false);
  const [records, setRecords] = useState(seed);
  const [selBatch, setSelBatch] = useState("LT-2026-0619-A");
  const [sel, setSel] = useState(null);
  const [checked, setChecked] = useState(() => new Set());
  const [filters, setFilters] = useState({
    q: "",
    cp: "Todas",
    tipo: "Todos",
    pend: true,
    ocultar: true
  });
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [rejectCtx, setRejectCtx] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const batch = batches.find(b => b.id === selBatch);
  const brecs = records.filter(r => r.batchId === selBatch);
  const flash = (k, m) => {
    setToast({
      k,
      m
    });
    setTimeout(() => setToast(null), 3400);
  };
  const view = useMemo(() => {
    let rs = brecs;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      rs = rs.filter(r => r.campos.nome.value.toLowerCase().includes(q) || r.campos.cpf.value.includes(q));
    }
    if (filters.cp !== "Todas") rs = rs.filter(r => r.destino.nome === filters.cp);
    if (filters.tipo !== "Todos") rs = rs.filter(r => r.tipo === filters.tipo);
    if (filters.pend) rs = rs.filter(r => r.status === "pendente");
    const oc = filters.ocultar ? rs.filter(r => r.status === "pendente" && !hasErro(r) && !hasAviso(r)).length : 0;
    if (filters.ocultar) rs = rs.filter(r => !(r.status === "pendente" && !hasErro(r) && !hasAviso(r)));
    const rank = r => hasErro(r) ? 0 : hasAviso(r) ? 1 : 2;
    return {
      rs: rs.slice().sort((a, b) => rank(a) - rank(b)),
      oc
    };
  }, [brecs, filters]);
  const patch = (id, p, ev) => {
    ev = ev || [];
    setRecords(prev => prev.map(r => r.id === id ? Object.assign({}, r, p, {
      timeline: r.timeline.concat(ev)
    }) : r));
  };
  const approve = ids => {
    let ok = 0,
      skip = 0;
    setRecords(prev => prev.map(r => {
      if (ids.indexOf(r.id) < 0 || r.status !== "pendente") return r;
      if (hasErro(r)) {
        skip++;
        return r;
      }
      ok++;
      return Object.assign({}, r, {
        status: "aprovado",
        timeline: r.timeline.concat([{
          id: r.id + Date.now(),
          origem: "humano",
          tipo: "estado",
          autor: ANALISTA,
          quando: now(),
          texto: "Movimentação aprovada."
        }])
      });
    }));
    setChecked(new Set());
    flash(ok && skip ? "warn" : ok ? "ok" : "warn", ok && skip ? ok + " aprovada(s). " + skip + " com erro bloqueante ignorada(s)." : ok ? ok + " movimentação(ões) aprovada(s)." : "Nenhuma aprovada — há erro bloqueante.");
  };
  const doReject = (ids, motivo) => {
    setRecords(prev => prev.map(r => ids.indexOf(r.id) >= 0 && r.status === "pendente" ? Object.assign({}, r, {
      status: "rejeitado",
      timeline: r.timeline.concat([{
        id: r.id + Date.now(),
        origem: "humano",
        tipo: "estado",
        autor: ANALISTA,
        quando: now(),
        texto: "Rejeitada. Motivo: " + motivo
      }])
    }) : r));
    setChecked(new Set());
    setModal(null);
    setRejectCtx(null);
    flash("ok", ids.length + " movimentação(ões) rejeitada(s).");
  };
  const desabilitar = id => {
    patch(id, {
      status: "desabilitado"
    }, [{
      id: id + Date.now(),
      origem: "humano",
      tipo: "estado",
      autor: ANALISTA,
      quando: now(),
      texto: "Movimentação desabilitada (soft-delete). Fora das exportações."
    }]);
    flash("ok", "Desabilitada. Permanece no histórico.");
  };
  const confirmarRetorno = (id, ok) => {
    const r = records.find(x => x.id === id);
    if (ok) patch(id, {
      status: "confirmado",
      coreApplied: true
    }, [{
      id: id + Date.now() + "a",
      origem: "sistema",
      tipo: "estado",
      autor: "Operadora/Seguradora",
      quando: now(),
      texto: "Retorno recebido: confirmado."
    }, {
      id: id + Date.now() + "b",
      origem: "sistema",
      tipo: "core",
      autor: "Alper Core",
      quando: now(),
      texto: "Emitido ao Alper Core: " + r.coreEffect + "."
    }]);else patch(id, {
      status: "recusado"
    }, [{
      id: id + Date.now(),
      origem: "sistema",
      tipo: "estado",
      autor: "Operadora/Seguradora",
      quando: now(),
      texto: "Retorno recebido: recusado."
    }]);
    flash(ok ? "ok" : "warn", ok ? "Confirmada e aplicada ao Alper Core." : "Recusada pela operadora/seguradora.");
  };
  const compensar = id => {
    const r = records.find(x => x.id === id);
    const nid = "R" + (90 + records.length);
    const novo = Object.assign({}, r, {
      id: nid,
      status: "pendente",
      validacoes: [],
      compensaDe: r.id,
      campos: Object.assign({}, r.campos),
      timeline: [{
        id: nid + "-t0",
        origem: "sistema",
        tipo: "estado",
        autor: "Atlas",
        quando: now(),
        texto: "Movimentação compensatória gerada a partir de " + r.id + " (recusada)."
      }]
    });
    setRecords(prev => [novo].concat(prev));
    setSel(nid);
    flash("ok", "Movimentação compensatória " + nid + " criada. O evento original permanece imutável.");
  };
  const exportar = cpNome => {
    const el = brecs.filter(r => r.destino.nome === cpNome && r.status === "aprovado");
    if (!el.length) {
      flash("warn", "Nenhuma aprovada para " + cpNome + ".");
      return;
    }
    const art = {
      id: "ARQ-" + (artifacts.length + 1),
      cp: cpNome,
      layout: layoutV(cpNome),
      quando: now(),
      arquivo: cpNome.replace(/\s/g, "_").toUpperCase() + "_" + selBatch + ".csv",
      n: el.length
    };
    setArtifacts(p => [art].concat(p));
    setRecords(prev => prev.map(r => el.find(e => e.id === r.id) ? Object.assign({}, r, {
      status: "exportado",
      timeline: r.timeline.concat([{
        id: r.id + Date.now(),
        origem: "sistema",
        tipo: "estado",
        autor: "Exportação",
        quando: now(),
        texto: "Incluída no arquivo " + art.arquivo + " (layout " + art.layout + ")."
      }])
    }) : r));
    setModal(null);
    flash("ok", "Arquivo gerado: " + art.arquivo + " · " + el.length + " vida(s).");
  };
  if (!entered) return /*#__PURE__*/React.createElement(Splash, {
    onEnter: () => setEntered(true)
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "rail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rail-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "brand-mark"
  }, /*#__PURE__*/React.createElement(I, {
    n: "compass",
    s: 20
  })), /*#__PURE__*/React.createElement("span", {
    className: "brand-tx"
  }, /*#__PURE__*/React.createElement("b", null, "alper atlas"), /*#__PURE__*/React.createElement("i", null, "Movimentação"))), /*#__PURE__*/React.createElement("div", {
    className: "flow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flow-a"
  }, "Atlas · evento"), /*#__PURE__*/React.createElement(I, {
    n: "arrowR",
    s: 11,
    cls: "flow-arr"
  }), /*#__PURE__*/React.createElement("span", {
    className: "flow-c"
  }, "Core · vínculo"))), /*#__PURE__*/React.createElement("div", {
    className: "rail-lbl"
  }, /*#__PURE__*/React.createElement(I, {
    n: "layers",
    s: 13
  }), " Lotes"), /*#__PURE__*/React.createElement("div", {
    className: "rail-list"
  }, batches.map(b => /*#__PURE__*/React.createElement("button", {
    key: b.id,
    onClick: () => {
      setSelBatch(b.id);
      setSel(null);
      setChecked(new Set());
    },
    className: "lote" + (b.id === selBatch ? " active" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "lote-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono lote-id"
  }, b.id), b.erros > 0 && /*#__PURE__*/React.createElement("span", {
    className: "lote-err"
  }, /*#__PURE__*/React.createElement(I, {
    n: "alert",
    s: 12
  }), b.erros)), /*#__PURE__*/React.createElement("div", {
    className: "lote-name"
  }, b.cliente), /*#__PURE__*/React.createElement("div", {
    className: "lote-meta"
  }, b.fonte, " · ", b.pend, " pendente(s)")))), /*#__PURE__*/React.createElement("div", {
    className: "rail-foot"
  }, ANALISTA)), /*#__PURE__*/React.createElement("main", {
    className: "main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "m-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "m-head-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, /*#__PURE__*/React.createElement(I, {
    n: "building",
    s: 13
  }), " Cliente · competência"), /*#__PURE__*/React.createElement("h1", null, batch.cliente), /*#__PURE__*/React.createElement("div", {
    className: "m-sub"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, batch.id), /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "·"), "Competência ", batch.competencia, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "·"), "Origem: ", batch.fonte)), /*#__PURE__*/React.createElement("div", {
    className: "m-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => setModal("diary")
  }, /*#__PURE__*/React.createElement(I, {
    n: "book",
    s: 16
  }), " Diário do lote"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => setModal("export")
  }, /*#__PURE__*/React.createElement(I, {
    n: "download",
    s: 16
  }), " Exportar"))), /*#__PURE__*/React.createElement(Progress, {
    recs: brecs
  })), /*#__PURE__*/React.createElement("div", {
    className: "filterbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inp-wrap"
  }, /*#__PURE__*/React.createElement(I, {
    n: "search",
    s: 16,
    cls: "inp-ic"
  }), /*#__PURE__*/React.createElement("input", {
    value: filters.q,
    onChange: e => setFilters(s => Object.assign({}, s, {
      q: e.target.value
    })),
    placeholder: "Buscar nome ou CPF"
  })), /*#__PURE__*/React.createElement(Sel, {
    value: filters.cp,
    onChange: v => setFilters(s => Object.assign({}, s, {
      cp: v
    })),
    options: ["Todas", "Bradesco Saúde", "CNU", "Seguros Unimed", "GNDI", "MetLife"]
  }), /*#__PURE__*/React.createElement(Sel, {
    value: filters.tipo,
    onChange: v => setFilters(s => Object.assign({}, s, {
      tipo: v
    })),
    options: ["Todos", "Inclusão", "Exclusão", "Alteração"]
  }), /*#__PURE__*/React.createElement(Tog, {
    on: filters.pend,
    onClick: () => setFilters(s => Object.assign({}, s, {
      pend: !s.pend
    })),
    label: "Só pendências"
  }), /*#__PURE__*/React.createElement(Tog, {
    on: filters.ocultar,
    onClick: () => setFilters(s => Object.assign({}, s, {
      ocultar: !s.ocultar
    })),
    label: "Ocultar conformes"
  }), /*#__PURE__*/React.createElement("span", {
    className: "fcount"
  }, view.rs.length, " em conferência")), checked.size > 0 && /*#__PURE__*/React.createElement("div", {
    className: "batchbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bb-count"
  }, checked.size, " selecionada(s)"), /*#__PURE__*/React.createElement("button", {
    className: "bb-app",
    onClick: () => approve(Array.from(checked))
  }, /*#__PURE__*/React.createElement(I, {
    n: "checkCircle",
    s: 14
  }), " Aprovar"), /*#__PURE__*/React.createElement("button", {
    className: "bb-rej",
    onClick: () => {
      setRejectCtx({
        ids: Array.from(checked)
      });
      setModal("reject");
    }
  }, /*#__PURE__*/React.createElement(I, {
    n: "xCircle",
    s: 14
  }), " Rejeitar"), /*#__PURE__*/React.createElement("button", {
    className: "bb-clear",
    onClick: () => setChecked(new Set())
  }, "Limpar")), view.oc > 0 && /*#__PURE__*/React.createElement("div", {
    className: "banner"
  }, /*#__PURE__*/React.createElement(I, {
    n: "shield",
    s: 14
  }), view.oc, " movimentação(ões) conformes ocultas.", /*#__PURE__*/React.createElement("button", {
    onClick: () => setFilters(s => Object.assign({}, s, {
      ocultar: false
    }))
  }, "Mostrar")), /*#__PURE__*/React.createElement("div", {
    className: "grid-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "grid"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "w-chk"
  }), /*#__PURE__*/React.createElement("th", null, "Tipo"), /*#__PURE__*/React.createElement("th", null, "Beneficiário"), /*#__PURE__*/React.createElement("th", null, "CPF"), /*#__PURE__*/React.createElement("th", null, "Operadora / Seguradora"), /*#__PURE__*/React.createElement("th", null, "Plano"), /*#__PURE__*/React.createElement("th", null, "Conferência"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, view.rs.map(r => /*#__PURE__*/React.createElement(Row, {
    key: r.id,
    r: r,
    checked: checked.has(r.id),
    onCheck: () => setChecked(s => {
      const n = new Set(s);
      n.has(r.id) ? n.delete(r.id) : n.add(r.id);
      return n;
    }),
    onOpen: () => setSel(r.id)
  })), view.rs.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 9,
    className: "empty"
  }, /*#__PURE__*/React.createElement(I, {
    n: "list",
    s: 24
  }), /*#__PURE__*/React.createElement("div", null, "Nada para conferir com os filtros atuais.")))))), /*#__PURE__*/React.createElement("div", {
    className: "table-legend"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "sw sw-err"
  }), "Erro"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "sw sw-warn"
  }), "Aviso"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "sw sw-teal"
  }), "Origem da captura"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "sw sw-navy"
  }), "Efeito no Core")), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("span", {
    className: "legend-rt"
  }, "2026 Alper Seguros · Uso Interno - Confidencial · Atlas mantém o evento / Core mantém o vínculo"))), sel && /*#__PURE__*/React.createElement(Drawer, {
    r: records.find(x => x.id === sel),
    onClose: () => setSel(null),
    patch: patch,
    onApprove: () => approve([sel]),
    onReject: () => {
      setRejectCtx({
        ids: [sel]
      });
      setModal("reject");
    },
    onDisable: () => desabilitar(sel),
    onReturn: ok => confirmarRetorno(sel, ok),
    onCompensate: () => compensar(sel),
    flash: flash
  }), modal === "export" && /*#__PURE__*/React.createElement(ExportModal, {
    brecs: brecs,
    artifacts: artifacts,
    onExport: exportar,
    onClose: () => setModal(null)
  }), modal === "reject" && /*#__PURE__*/React.createElement(RejectModal, {
    count: rejectCtx.ids.length,
    onConfirm: m => doReject(rejectCtx.ids, m),
    onClose: () => {
      setModal(null);
      setRejectCtx(null);
    }
  }), modal === "diary" && /*#__PURE__*/React.createElement(DiaryModal, {
    batch: batch,
    onClose: () => setModal(null)
  }), toast && /*#__PURE__*/React.createElement(Toast, {
    k: toast.k,
    m: toast.m
  }));
}

/* ===== Splash ===== */
function Splash({
  onEnter
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "splash"
  }, /*#__PURE__*/React.createElement("div", {
    className: "splash-card"
  }, /*#__PURE__*/React.createElement("img", {
    src: "alper-atlas-logo.png",
    alt: "Alper Atlas",
    className: "splash-logo"
  }), /*#__PURE__*/React.createElement("div", {
    className: "splash-sub"
  }, "Cockpit de Movimentação Cadastral"), /*#__PURE__*/React.createElement("p", {
    className: "splash-desc"
  }, "Plataforma de tradução de movimentações de qualquer fonte para conferência humana — operadoras e seguradoras."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary splash-btn",
    onClick: onEnter
  }, "Entrar no cockpit ", /*#__PURE__*/React.createElement(I, {
    n: "arrowR",
    s: 16
  })), /*#__PURE__*/React.createElement("div", {
    className: "splash-foot"
  }, "Protótipo · dados simulados para validação")));
}

/* ===== Row ===== */
function Row({
  r,
  checked,
  onCheck,
  onOpen
}) {
  const cls = hasErro(r) ? "row-err" : hasAviso(r) ? "row-warn" : "";
  const er = r.validacoes.filter(v => v.sev === "erro").length;
  const av = r.validacoes.filter(v => v.sev === "aviso").length;
  const dim = r.status === "desabilitado";
  const tit = r.campos.parentesco.value === "Titular";
  return /*#__PURE__*/React.createElement("tr", {
    onClick: onOpen,
    className: "row " + cls + (dim ? " dimmed" : "")
  }, /*#__PURE__*/React.createElement("td", {
    className: "w-chk",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    onChange: onCheck
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge " + tipoCls[r.tipo]
  }, r.tipo)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "ben"
  }, /*#__PURE__*/React.createElement(I, {
    n: tit ? "user" : "users",
    s: 14,
    cls: "ben-ic"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ben-name" + (dim ? " struck" : "")
  }, r.campos.nome.value), r.compensaDe && /*#__PURE__*/React.createElement("span", {
    className: "comp-tag"
  }, "compensa ", r.compensaDe)), /*#__PURE__*/React.createElement("div", {
    className: "ben-sub"
  }, r.campos.parentesco.value, r.vida && r.vida !== "VIDA-—" ? /*#__PURE__*/React.createElement("span", {
    className: "vida"
  }, " · ", r.vida) : "")), /*#__PURE__*/React.createElement("td", {
    className: "mono small"
  }, r.campos.cpf.value), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "cp-name"
  }, r.destino.nome), " ", /*#__PURE__*/React.createElement("span", {
    className: "kind " + (r.destino.kind === "seguradora" ? "kind-seg" : "kind-op")
  }, r.destino.kind)), /*#__PURE__*/React.createElement("td", {
    className: "plano"
  }, r.campos.plano.value), /*#__PURE__*/React.createElement("td", null, er > 0 && /*#__PURE__*/React.createElement("span", {
    className: "chip chip-err"
  }, er, " erro", er > 1 ? "s" : ""), av > 0 && /*#__PURE__*/React.createElement("span", {
    className: "chip chip-warn"
  }, av, " aviso", av > 1 ? "s" : ""), er + av === 0 && /*#__PURE__*/React.createElement("span", {
    className: "chip chip-ok"
  }, "conforme")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge " + stMeta[r.status].c
  }, stMeta[r.status].l)), /*#__PURE__*/React.createElement("td", {
    className: "chevcell"
  }, /*#__PURE__*/React.createElement(I, {
    n: "chevR",
    s: 16,
    cls: "chev"
  })));
}

/* ===== Drawer ===== */
function Drawer({
  r,
  onClose,
  patch,
  onApprove,
  onReject,
  onDisable,
  onReturn,
  onCompensate,
  flash
}) {
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
        id: r.id + Date.now() + k,
        origem: "sistema",
        tipo: "campo",
        autor: ANALISTA,
        quando: now(),
        texto: 'Campo "' + (LABEL[k] || k) + '" alterado.',
        de: r.campos[k].value || "—",
        para: draft[k] || "—"
      });
    });
    if (!ev.length) {
      flash("warn", "Nenhuma alteração.");
      return;
    }
    const novos = {};
    Object.keys(r.campos).forEach(k => novos[k] = Object.assign({}, r.campos[k], {
      value: draft[k],
      origem: draft[k] !== r.campos[k].value ? {
        coluna: "edição manual",
        transform: "Manual",
        linha: null
      } : r.campos[k].origem
    }));
    patch(r.id, {
      campos: novos
    }, ev);
    flash("ok", ev.length + " alteração(ões) salva(s) na auditoria.");
  };
  const addNota = () => {
    if (!nota.trim()) return;
    patch(r.id, {}, [{
      id: r.id + "n" + Date.now(),
      origem: "humano",
      tipo: "nota",
      autor: ANALISTA,
      quando: now(),
      texto: nota.trim()
    }]);
    setNota("");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "drawer-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "drawer-bg",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "drawer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dr-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "dr-badges"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge " + tipoCls[r.tipo]
  }, r.tipo), /*#__PURE__*/React.createElement("span", {
    className: "badge " + stMeta[r.status].c
  }, stMeta[r.status].l), r.compensaDe && /*#__PURE__*/React.createElement("span", {
    className: "comp-tag"
  }, "compensa ", r.compensaDe)), /*#__PURE__*/React.createElement("h2", null, r.campos.nome.value), /*#__PURE__*/React.createElement("div", {
    className: "mono dr-id"
  }, r.id, " · ", r.destino.nome, " (", r.destino.kind, ") · competência ", r.campos.competencia.value)), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(I, {
    n: "x",
    s: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dr-body"
  }, r.delta && /*#__PURE__*/React.createElement("div", {
    className: "delta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "delta-lbl"
  }, "O que mudou"), /*#__PURE__*/React.createElement("div", {
    className: "delta-row"
  }, /*#__PURE__*/React.createElement("b", null, r.delta.campo, ":"), " ", /*#__PURE__*/React.createElement("span", {
    className: "old"
  }, r.delta.de), /*#__PURE__*/React.createElement(I, {
    n: "arrowR",
    s: 14,
    cls: "delta-arr"
  }), /*#__PURE__*/React.createElement("b", null, r.delta.para))), /*#__PURE__*/React.createElement("div", {
    className: "core-box" + (r.coreApplied ? " applied" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "core-lbl"
  }, /*#__PURE__*/React.createElement(I, {
    n: "database",
    s: 14
  }), " ", r.coreApplied ? "Aplicado ao Alper Core" : "Efeito previsto no Alper Core"), /*#__PURE__*/React.createElement("div", {
    className: "core-eff"
  }, r.coreApplied && /*#__PURE__*/React.createElement(I, {
    n: "checkCircle",
    s: 16,
    cls: "core-check"
  }), r.coreEffect), !r.coreApplied && /*#__PURE__*/React.createElement("div", {
    className: "core-note"
  }, "Será gravado quando a operadora/seguradora confirmar a movimentação.")), /*#__PURE__*/React.createElement(Dimension, {
    title: "Conformidade da captura",
    hint: "A tradução de entrada foi fiel?",
    items: r.validacoes.filter(v => v.dim === "captura")
  }), /*#__PURE__*/React.createElement(Dimension, {
    title: "Validade da movimentação",
    hint: "O evento faz sentido?",
    items: r.validacoes.filter(v => v.dim === "movimentacao")
  }), /*#__PURE__*/React.createElement("div", {
    className: "fields"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fields-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-lbl"
  }, /*#__PURE__*/React.createElement(I, {
    n: "pencil",
    s: 13
  }), " Campos canônicos"), /*#__PURE__*/React.createElement("button", {
    className: "origbtn" + (showOrig ? " on" : ""),
    onClick: () => setShowOrig(s => !s)
  }, /*#__PURE__*/React.createElement(I, {
    n: showOrig ? "eyeOff" : "eye",
    s: 13
  }), " Origem da captura")), CATALOG.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.group,
    className: "fgroup"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fgroup-lbl"
  }, g.group), /*#__PURE__*/React.createElement("div", {
    className: "fgrid"
  }, g.fields.map(k => /*#__PURE__*/React.createElement(Field, {
    key: k,
    k: k,
    cell: r.campos[k],
    value: draft[k],
    onChange: v => setDraft(d => Object.assign({}, d, {
      [k]: v
    })),
    showOrig: showOrig
  }))))), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost save-btn",
    onClick: save
  }, /*#__PURE__*/React.createElement(I, {
    n: "check",
    s: 16
  }), " Salvar alterações")), /*#__PURE__*/React.createElement("div", {
    className: "tl-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-lbl"
  }, /*#__PURE__*/React.createElement(I, {
    n: "clock",
    s: 13
  }), " Histórico · auditoria e diário"), /*#__PURE__*/React.createElement("div", {
    className: "nota-row"
  }, /*#__PURE__*/React.createElement("input", {
    value: nota,
    onChange: e => setNota(e.target.value),
    onKeyDown: e => e.key === "Enter" && addNota(),
    placeholder: "Adicionar observação…"
  }), /*#__PURE__*/React.createElement("button", {
    className: "nota-btn",
    onClick: addNota
  }, /*#__PURE__*/React.createElement(I, {
    n: "msg",
    s: 16
  }))), /*#__PURE__*/React.createElement("ol", {
    className: "tl"
  }, r.timeline.slice().reverse().map(ev => /*#__PURE__*/React.createElement(TLItem, {
    key: ev.id,
    ev: ev
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "dr-foot"
  }, r.status === "pendente" && /*#__PURE__*/React.createElement("div", {
    className: "foot-row"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: blocked,
    className: "btn btn-app" + (blocked ? " disabled" : ""),
    onClick: blocked ? null : onApprove
  }, /*#__PURE__*/React.createElement(I, {
    n: "checkCircle",
    s: 16
  }), " Aprovar"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-rejo",
    onClick: onReject
  }, /*#__PURE__*/React.createElement(I, {
    n: "xCircle",
    s: 16
  }), " Rejeitar"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost foot-dis",
    onClick: onDisable
  }, /*#__PURE__*/React.createElement(I, {
    n: "ban",
    s: 16
  }), " Desabilitar")), (r.status === "aprovado" || r.status === "exportado") && /*#__PURE__*/React.createElement("div", {
    className: "foot-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "foot-hint"
  }, "Simular retorno:"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-core",
    onClick: () => onReturn(true)
  }, /*#__PURE__*/React.createElement(I, {
    n: "database",
    s: 16
  }), " Confirmar → Core"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-rejo",
    onClick: () => onReturn(false)
  }, /*#__PURE__*/React.createElement(I, {
    n: "xCircle",
    s: 16
  }), " Recusar")), r.status === "confirmado" && /*#__PURE__*/React.createElement("div", {
    className: "foot-done"
  }, /*#__PURE__*/React.createElement(I, {
    n: "checkCircle",
    s: 16
  }), " Vínculo aplicado ao Alper Core. Evento encerrado."), r.status === "recusado" && /*#__PURE__*/React.createElement("div", {
    className: "foot-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "foot-hint"
  }, "Recusada."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: onCompensate
  }, /*#__PURE__*/React.createElement(I, {
    n: "branch",
    s: 16
  }), " Gerar movimentação compensatória")), blocked && r.status === "pendente" && /*#__PURE__*/React.createElement("div", {
    className: "foot-err"
  }, "Há erro bloqueante. Resolva a pendência antes de aprovar."))));
}
function Dimension({
  title,
  hint,
  items
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "dim"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dim-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-lbl"
  }, title), /*#__PURE__*/React.createElement("span", {
    className: "dim-hint"
  }, hint)), items.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "dim-ok"
  }, /*#__PURE__*/React.createElement(I, {
    n: "shield",
    s: 16
  }), " Sem apontamentos.") : items.map((v, i) => {
    const k = v.sev === "erro" ? "v-err" : v.sev === "aviso" ? "v-warn" : "v-info";
    const ic = v.sev === "erro" ? "xCircle" : v.sev === "aviso" ? "alert" : "info";
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "vitem " + k
    }, /*#__PURE__*/React.createElement("div", {
      className: "vitem-msg"
    }, /*#__PURE__*/React.createElement(I, {
      n: ic,
      s: 16,
      cls: "vitem-ic"
    }), /*#__PURE__*/React.createElement("span", null, v.msg)), v.core && /*#__PURE__*/React.createElement("div", {
      className: "vcore"
    }, /*#__PURE__*/React.createElement(I, {
      n: "database",
      s: 14
    }), /*#__PURE__*/React.createElement("span", null, v.core)), v.regra && /*#__PURE__*/React.createElement("div", {
      className: "cascade"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cascade-lbl"
    }, "Regra: ", v.regra.nome), v.regra.camadas.map((c, j) => /*#__PURE__*/React.createElement("div", {
      key: j,
      className: "crow"
    }, /*#__PURE__*/React.createElement("span", {
      className: "cdot " + (c.estado === "vigente" ? "on" : "off")
    }), /*#__PURE__*/React.createElement("span", {
      className: c.estado === "vigente" ? "cvig-tx" : "coff"
    }, c.nivel, ": ", c.valor), c.estado === "vigente" && /*#__PURE__*/React.createElement("span", {
      className: "cvig"
    }, "vigente"))), /*#__PURE__*/React.createElement("div", {
      className: "cres"
    }, /*#__PURE__*/React.createElement(I, {
      n: "corner",
      s: 14
    }), v.regra.resultado)));
  }));
}
function Field({
  k,
  cell,
  value,
  onChange,
  showOrig
}) {
  const full = k === "nome" || k === "plano";
  const ambig = cell.origem.transform === "Ambígua";
  const tr = cell.origem.transform;
  const o = cell.origem;
  return /*#__PURE__*/React.createElement("label", {
    className: "fld" + (full ? " full" : "")
  }, /*#__PURE__*/React.createElement("span", {
    className: "fl"
  }, LABEL[k] || k, ambig && /*#__PURE__*/React.createElement("span", {
    className: "ambig-tag"
  }, "origem ambígua")), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    className: (MONO.has(k) ? "mono small " : "") + (ambig ? "amb" : "")
  }), showOrig && /*#__PURE__*/React.createElement("span", {
    className: "orig" + (ambig ? " amber" : "") + (o.coluna === "—" ? " grey" : "")
  }, /*#__PURE__*/React.createElement(I, {
    n: "swap",
    s: 11
  }), o.coluna === "—" ? /*#__PURE__*/React.createElement("span", null, "sem origem (derivado)") : /*#__PURE__*/React.createElement("span", null, "← ", /*#__PURE__*/React.createElement("b", {
    className: "mono"
  }, o.coluna), o.linha ? " · linha " + o.linha : "", " · ", tr), o.candidatos && /*#__PURE__*/React.createElement("span", {
    className: "cand"
  }, " · candidatos: ", o.candidatos.join(", "))));
}
function TLItem({
  ev
}) {
  const core = ev.tipo === "core",
    human = ev.origem === "humano";
  const kind = core ? "Core" : human ? "Diário" : "Auditoria";
  return /*#__PURE__*/React.createElement("li", {
    className: "tli"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tli-rail"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tli-dot " + (core ? "d-core" : human ? "d-hum" : "d-sys")
  }), /*#__PURE__*/React.createElement("span", {
    className: "tli-line"
  })), /*#__PURE__*/React.createElement("div", {
    className: "tli-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tli-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tli-kind " + (core ? "k-core" : human ? "k-hum" : "k-sys")
  }, kind), /*#__PURE__*/React.createElement("span", null, "·"), /*#__PURE__*/React.createElement("span", null, ev.autor), /*#__PURE__*/React.createElement("span", null, "·"), /*#__PURE__*/React.createElement("span", null, ev.quando)), /*#__PURE__*/React.createElement("div", {
    className: "tli-tx"
  }, ev.texto), ev.tipo === "campo" && /*#__PURE__*/React.createElement("div", {
    className: "tli-delta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "old"
  }, ev.de), /*#__PURE__*/React.createElement(I, {
    n: "arrowR",
    s: 12
  }), /*#__PURE__*/React.createElement("span", null, ev.para))));
}
function Progress({
  recs
}) {
  const total = recs.length;
  const done = recs.filter(r => ["aprovado", "rejeitado", "exportado", "confirmado", "recusado", "desabilitado"].indexOf(r.status) >= 0).length;
  const conf = recs.filter(r => r.status === "confirmado").length;
  const er = recs.filter(hasErro).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "prog"
  }, /*#__PURE__*/React.createElement("div", {
    className: "prog-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "prog-fill",
    style: {
      width: pct + "%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "prog-tx"
  }, done, " de ", total, " conferidas · ", pct, "%"), conf > 0 && /*#__PURE__*/React.createElement("div", {
    className: "prog-core"
  }, /*#__PURE__*/React.createElement(I, {
    n: "database",
    s: 13
  }), conf, " no Core"), er > 0 && /*#__PURE__*/React.createElement("div", {
    className: "prog-err"
  }, /*#__PURE__*/React.createElement(I, {
    n: "alert",
    s: 13
  }), er, " com erro"));
}
function Sel({
  value,
  onChange,
  options
}) {
  return /*#__PURE__*/React.createElement("select", {
    className: "sel",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o)));
}
function Tog({
  on,
  onClick,
  label
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: "tog" + (on ? " on" : "")
  }, /*#__PURE__*/React.createElement("span", {
    className: "tog-mark"
  }, on && /*#__PURE__*/React.createElement(I, {
    n: "check",
    s: 10
  })), label);
}
function layoutV(cp) {
  return {
    "Bradesco Saúde": "v3.2",
    "CNU": "v1.7",
    "Seguros Unimed": "v2.0",
    "GNDI": "v4.1",
    "MetLife": "v1.0"
  }[cp] || "v1.0";
}
function ExportModal({
  brecs,
  artifacts,
  onExport,
  onClose
}) {
  const cps = ["Bradesco Saúde", "CNU", "Seguros Unimed", "GNDI", "MetLife"];
  return /*#__PURE__*/React.createElement(Modal, {
    onClose: onClose,
    title: "Exportar por operadora / seguradora",
    icon: "download"
  }, /*#__PURE__*/React.createElement("p", {
    className: "modal-p"
  }, "Cada exportação gera um ", /*#__PURE__*/React.createElement("b", null, "artefato versionado"), " (arquivo + layout + vidas). Só entram movimentações aprovadas."), /*#__PURE__*/React.createElement("div", {
    className: "exp-list"
  }, cps.map(cp => {
    const ap = brecs.filter(r => r.destino.nome === cp && r.status === "aprovado").length;
    const pd = brecs.filter(r => r.destino.nome === cp && r.status === "pendente").length;
    return /*#__PURE__*/React.createElement("div", {
      key: cp,
      className: "exp-row"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "exp-name"
    }, cp, " ", /*#__PURE__*/React.createElement("span", {
      className: "mono exp-layout"
    }, "layout ", layoutV(cp))), /*#__PURE__*/React.createElement("div", {
      className: "exp-meta"
    }, ap, " aprovada(s) · ", pd, " pendente(s)")), /*#__PURE__*/React.createElement("button", {
      disabled: !ap,
      className: "btn " + (ap ? "btn-primary" : "btn-disabled"),
      onClick: ap ? () => onExport(cp) : null
    }, /*#__PURE__*/React.createElement(I, {
      n: "download",
      s: 16
    }), " Gerar"));
  })), artifacts.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "exp-arts"
  }, /*#__PURE__*/React.createElement("div", {
    className: "exp-arts-lbl"
  }, "Arquivos gerados"), artifacts.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "art"
  }, /*#__PURE__*/React.createElement(I, {
    n: "package",
    s: 16,
    cls: "art-ic"
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono small"
  }, a.arquivo), /*#__PURE__*/React.createElement("span", {
    className: "art-meta"
  }, a.n, " vida(s) · ", a.quando)))));
}
function RejectModal({
  count,
  onConfirm,
  onClose
}) {
  const [m, setM] = useState("");
  return /*#__PURE__*/React.createElement(Modal, {
    onClose: onClose,
    title: "Rejeitar " + count + " movimentação(ões)",
    icon: "xCircle"
  }, /*#__PURE__*/React.createElement("p", {
    className: "modal-p"
  }, "O motivo é obrigatório e fica registrado no diário de cada movimentação."), /*#__PURE__*/React.createElement("textarea", {
    value: m,
    onChange: e => setM(e.target.value),
    rows: 3,
    placeholder: "Ex.: CPF divergente, aguardando correção do cliente."
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    disabled: !m.trim(),
    className: "btn " + (m.trim() ? "btn-rejo-solid" : "btn-disabled"),
    onClick: m.trim() ? () => onConfirm(m.trim()) : null
  }, "Confirmar rejeição")));
}
function DiaryModal({
  batch,
  onClose
}) {
  return /*#__PURE__*/React.createElement(Modal, {
    onClose: onClose,
    title: "Diário do lote " + batch.id,
    icon: "book"
  }, /*#__PURE__*/React.createElement("p", {
    className: "modal-p"
  }, "Histórico compartilhado do lote — qualquer analista acompanha o que aconteceu e por quê."), /*#__PURE__*/React.createElement("ol", {
    className: "tl"
  }, batch.diario.length === 0 ? /*#__PURE__*/React.createElement("li", {
    className: "muted"
  }, "Sem anotações ainda.") : batch.diario.slice().reverse().map(ev => /*#__PURE__*/React.createElement(TLItem, {
    key: ev.id,
    ev: ev
  }))));
}
function Modal({
  title,
  icon,
  children,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-bg",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title"
  }, /*#__PURE__*/React.createElement(I, {
    n: icon,
    s: 18
  }), " ", title), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(I, {
    n: "x",
    s: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, children)));
}
function Toast({
  k,
  m
}) {
  const ic = k === "ok" ? "checkCircle" : k === "warn" ? "alert" : "info";
  return /*#__PURE__*/React.createElement("div", {
    className: "toast toast-" + k
  }, /*#__PURE__*/React.createElement(I, {
    n: ic,
    s: 16
  }), " ", m);
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
