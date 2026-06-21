import type {
  FieldValue, Validacao, TimelineEvent, Destino, Delta,
  TipoMovimentacao, StatusMovimentacao, Movimentacao, Batch, StMetaEntry
} from '../types';

// ===== Field factory =====
export const f = (
  value: string,
  coluna: string,
  transform = "Direta",
  linha: number | null = 42,
  candidatos: string[] | null = null
): FieldValue => ({
  value,
  origem: { coluna, transform, linha, candidatos }
});

// ===== Canonical catalog =====
export interface CatalogGroup { group: string; fields: string[] }

export const CATALOG: CatalogGroup[] = [
  { group: "Movimentação",    fields: ["tipo", "competencia", "motivo", "destino"] },
  { group: "Beneficiário",    fields: ["cnpj", "matricula", "nome", "cpf", "dtNasc", "nomeMae", "admissao"] },
  { group: "Vínculo & plano", fields: ["parentesco", "titularCpf", "plano"] }
];

export const LABEL: Record<string, string> = {
  tipo: "Tipo", competencia: "Competência", motivo: "Motivo", destino: "Operadora / Seguradora",
  cnpj: "CNPJ", matricula: "Matrícula", nome: "Nome", cpf: "CPF",
  dtNasc: "Data de Nascimento", nomeMae: "Nome da Mãe", admissao: "Data de Admissão",
  parentesco: "Parentesco", titularCpf: "CPF do Titular", plano: "Plano"
};

export const MONO = new Set<string>([
  "cnpj", "cpf", "titularCpf", "matricula", "competencia", "dtNasc", "admissao"
]);

// ===== Reference data =====
export const ANALISTA = "Você (Analista)";

export const CP: Record<string, Destino> = {
  brad:    { nome: "Bradesco Saúde",  kind: "operadora"  },
  cnu:     { nome: "CNU",             kind: "operadora"  },
  unimed:  { nome: "Seguros Unimed",  kind: "operadora"  },
  gndi:    { nome: "GNDI",            kind: "operadora"  },
  metlife: { nome: "MetLife",         kind: "seguradora" }
};

export const batches: Batch[] = [
  {
    id: "LT-2026-0619-A", cliente: "Construtora Vega S/A",
    competencia: "06/2026", fonte: "Planilha (e-mail)", pend: 6, erros: 3,
    diario: [
      { id: "bd1", origem: "sistema", autor: "Captura",  quando: "19/06 08:12", texto: "Lote normalizado ao canônico · 14 movimentações · 11 com proveniência direta, 3 inferidas." },
      { id: "bd2", origem: "humano",  autor: ANALISTA,   quando: "19/06 08:40", texto: "Cliente confirmou por telefone a exclusão do titular Marcos (demissão 17/06)." }
    ]
  },
  {
    id: "LT-2026-0619-B", cliente: "Rede Saúde Vita",
    competencia: "06/2026", fonte: "API (SFTP)", pend: 9, erros: 1, diario: []
  }
];

// ===== Record factory =====
interface RecExtra { coreEffect?: string; delta?: Delta }

export function rec(
  id: string,
  tipo: TipoMovimentacao,
  status: StatusMovimentacao,
  cpKey: string,
  vida: string,
  campos: Record<string, FieldValue>,
  validacoes: Validacao[],
  extra: RecExtra = {}
): Movimentacao {
  const base: Record<string, FieldValue> = {
    cnpj:       f("12.345.678/0001-90", "CNPJ"),
    matricula:  f("0" + id.slice(1) + "45", "Chapa"),
    admissao:   f("12/03/2022", "Admissão"),
    nomeMae:    f("Maria das Dores", "Mãe"),
    competencia:f("06/2026", "—", "Derivada"),
    motivo:     f("—", "—"),
    parentesco: f("Titular", "Vínculo"),
    titularCpf: f("—", "—")
  };
  const destino = CP[cpKey];
  return {
    id, batchId: "LT-2026-0619-A", tipo, status, destino, vida,
    campos: {
      ...base, ...campos,
      tipo:    f(tipo, "—", "Derivada"),
      destino: f(destino.nome, destino.kind === "seguradora" ? "Seguradora" : "Operadora")
    },
    validacoes,
    timeline: [
      { id: id + "-t0", origem: "sistema", tipo: "estado", autor: "Captura", quando: "19/06 08:12", texto: "Movimentação capturada e normalizada ao modelo canônico." } as TimelineEvent,
      ...(status === "aprovado" ? [{ id: id + "-t1", origem: "humano", tipo: "estado", autor: ANALISTA, quando: "19/06 08:30", texto: "Movimentação aprovada." } as TimelineEvent] : [])
    ],
    coreEffect: extra.coreEffect,
    delta: extra.delta
  };
}

// ===== Reusable validations =====
const vCpf: Validacao         = { dim: "captura",      sev: "erro",  msg: "CPF inválido — falhou no dígito verificador.", campo: "cpf" };
const vMae: Validacao         = { dim: "captura",      sev: "aviso", msg: "Nome da Mãe ausente na origem.", campo: "nomeMae" };
const vAmbig: Validacao       = { dim: "captura",      sev: "aviso", msg: "Data de Nascimento inferida de coluna ambígua — confirme a origem.", campo: "dtNasc" };
const vTitularCore: Validacao = { dim: "movimentacao", sev: "erro",  msg: "Titular não localizado como ativo.", core: "Consulta ao Core: VIDA do titular não encontrada como vínculo ativo." };
const vExclCore: Validacao    = { dim: "movimentacao", sev: "erro",  msg: "Vida não localizada como ativa para exclusão.", core: "Consulta ao Core: VIDA-00831 sem vínculo ativo na operadora." };
const vPlano: Validacao       = { dim: "movimentacao", sev: "erro",  msg: "Plano não habilitado para este CNPJ no contrato vigente." };
const vIdade: Validacao       = {
  dim: "movimentacao", sev: "aviso", msg: "Dependente com 25 anos — dentro do limite por regra do cliente.",
  regra: {
    nome: "Limite de idade de dependente",
    camadas: [
      { nivel: "Base · Corretora",           valor: "21 anos", estado: "sobreposta" },
      { nivel: "Operadora · Bradesco Saúde", valor: "24 anos", estado: "sobreposta" },
      { nivel: "Cliente · Construtora Vega", valor: "26 anos", estado: "vigente"   }
    ],
    resultado: "26 anos · dependente tem 25 → elegível (override de cliente aplicado)"
  }
};

// ===== Seed data =====
export const seed: Movimentacao[] = [
  rec("R03", "Inclusão",  "pendente", "cnu",    "VIDA-—",    { nome: f("Patrícia Lemos","Funcionário"), cpf: f("330.456.781-22","CPF"), parentesco: f("Cônjuge","Vínculo"), titularCpf: f("777.111.000-99","CPF Titular"), dtNasc: f("08/02/1991","Dt Nasc"), plano: f("CNU Coletivo Plus","Plano Contratado") }, [vTitularCore], { coreEffect: "Criar vínculo ativo · dependente (cônjuge)" }),
  rec("R05", "Exclusão",  "pendente", "gndi",   "VIDA-00831",{ nome: f("Roberto Fagundes","Funcionário"), cpf: f("888.222.111-30","CPF"), motivo: f("A pedido","Motivo"), dtNasc: f("19/07/1979","Dt Nasc"), plano: f("GNDI Smart 200","Plano Contratado") }, [vExclCore], { coreEffect: "Desativar vínculo · VIDA-00831" }),
  rec("R07", "Inclusão",  "pendente", "cnu",    "VIDA-—",    { nome: f("Eduardo Pires","Funcionário"), cpf: f("000.111.222-XX","CPF"), nomeMae: f("","—","Ausente"), dtNasc: f("30/01/1988","Dt Nasc"), plano: f("CNU Coletivo Plus","Plano Contratado") }, [vCpf, vMae], { coreEffect: "Criar vínculo ativo · titular" }),
  rec("R13", "Inclusão",  "pendente", "unimed", "VIDA-—",    { nome: f("Bianca Rocha","Funcionário"), cpf: f("123.456.789-09","CPF"), dtNasc: f("12/12/1990","Dt Nasc"), plano: f("Seguros Unimed Premium","Plano Contratado") }, [vPlano], { coreEffect: "Criar vínculo ativo · titular" }),
  rec("R02", "Inclusão",  "pendente", "brad",   "VIDA-—",    { nome: f("Lucas Soares","Funcionário"), cpf: f("509.220.117-40","CPF"), parentesco: f("Filho(a)","Vínculo"), titularCpf: f("412.889.330-12","CPF Titular"), dtNasc: f("03/05/2001","Dt Nasc"), plano: f("Bradesco Saúde Top Nacional","Plano Contratado") }, [vIdade], { coreEffect: "Criar vínculo ativo · dependente de VIDA-00412" }),
  rec("R12", "Inclusão",  "pendente", "gndi",   "VIDA-—",    { nome: f("Rafael Nogueira","Funcionário"), cpf: f("998.776.554-32","CPF"), dtNasc: f("11/09/1985","Nascimento?","Ambígua",57,["Nascimento","Dt. Admissão"]), plano: f("GNDI Smart 200","Plano Contratado") }, [vAmbig], { coreEffect: "Criar vínculo ativo · titular" }),
  rec("R06", "Alteração", "pendente", "metlife","VIDA-00145", { nome: f("Camila Duarte","Funcionário"), cpf: f("145.987.220-08","CPF"), dtNasc: f("22/06/1987","Dt Nasc"), plano: f("MetLife Vida Pleno","Plano Contratado") }, [{ dim: "movimentacao", sev: "aviso", msg: "Beneficiária com utilização recente no plano de origem — confirmar o upgrade." }], { delta: { campo: "Plano", de: "MetLife Vida Básico", para: "MetLife Vida Pleno" }, coreEffect: "Atualizar plano · Básico → Pleno (VIDA-00145)" }),
  rec("R14", "Inclusão",  "aprovado", "brad",   "VIDA-—",    { nome: f("Gustavo Henrique Alves","Funcionário"), cpf: f("741.852.963-10","CPF"), dtNasc: f("05/03/1992","Dt Nasc"), plano: f("Bradesco Saúde Top Nacional","Plano Contratado") }, [], { coreEffect: "Criar vínculo ativo · titular" })
];

// ===== Display helpers =====
export const tipoCls: Record<string, string> = {
  "Inclusão": "tipo-inc", "Exclusão": "tipo-exc", "Alteração": "tipo-alt"
};

export const stMeta: Record<string, StMetaEntry> = {
  pendente:    { l: "Pendente",    c: "st-pend" },
  aprovado:    { l: "Aprovado",    c: "st-apr"  },
  rejeitado:   { l: "Rejeitado",   c: "st-rej"  },
  exportado:   { l: "Exportado",   c: "st-exp"  },
  confirmado:  { l: "Confirmado",  c: "st-conf" },
  recusado:    { l: "Recusado",    c: "st-rej"  },
  desabilitado:{ l: "Desabilitado",c: "st-dis"  }
};

export const hasErro  = (r: Movimentacao): boolean => r.validacoes.some(v => v.sev === "erro");
export const hasAviso = (r: Movimentacao): boolean => r.validacoes.some(v => v.sev === "aviso");
export const now      = (): string => "19/06 " + new Date().toTimeString().slice(0, 5);
