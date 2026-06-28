// ===== Field types =====
export interface FieldOrigin {
  coluna: string;
  transform: string;
  linha: number | null;
  candidatos: string[] | null;
}

export interface FieldValue {
  value: string;
  origem: FieldOrigin;
}

// ===== Validation types =====
export interface ValidacaoCamada {
  nivel: string;
  valor: string;
  estado: 'vigente' | 'sobreposta';
}

export interface ValidacaoRegra {
  nome: string;
  camadas: ValidacaoCamada[];
  resultado: string;
}

export interface Validacao {
  dim: 'captura' | 'movimentacao';
  sev: 'erro' | 'aviso' | 'info';
  msg: string;
  campo?: string;
  core?: string;
  regra?: ValidacaoRegra;
}

// ===== Timeline =====
export interface TimelineEvent {
  id: string;
  origem: 'sistema' | 'humano';
  tipo: 'estado' | 'campo' | 'nota' | 'core';
  autor: string;
  quando: string;
  texto: string;
  de?: string;
  para?: string;
}

// ===== Domain =====
export interface Destino {
  nome: string;
  kind: 'operadora' | 'seguradora';
}

export interface Delta {
  campo: string;
  de: string;
  para: string;
}

export type TipoMovimentacao = 'Inclusão' | 'Exclusão' | 'Alteração';

export type StatusMovimentacao =
  | 'pendente'
  | 'aprovado'
  | 'rejeitado'
  | 'exportado'
  | 'confirmado'
  | 'recusado'
  | 'desabilitado';

export interface Movimentacao {
  id: string;
  batchId: string;
  tipo: TipoMovimentacao;
  status: StatusMovimentacao;
  destino: Destino;
  vida: string;
  campos: Record<string, FieldValue>;
  validacoes: Validacao[];
  timeline: TimelineEvent[];
  coreEffect?: string;
  coreApplied?: boolean;
  delta?: Delta;
  compensaDe?: string;
}

export interface DiarioEntry {
  id: string;
  origem: 'sistema' | 'humano';
  autor: string;
  quando: string;
  texto: string;
}

export interface Batch {
  id: string;
  cliente: string;
  competencia: string;
  fonte: string;
  pend: number;
  erros: number;
  diario: DiarioEntry[];
}

// ===== App =====
export interface Session {
  name: string;
  role: string;
  profile: string;
}

export interface Artifact {
  id: string;
  cp: string;
  layout: string;
  quando: string;
  arquivo: string;
  n: number;
}

export interface StMetaEntry {
  l: string;
  c: string;
}
