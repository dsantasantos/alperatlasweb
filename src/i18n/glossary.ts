// Glossário de tradução: mapeia valores em inglês retornados pela API para PT-BR.
// Para adicionar novos termos, edite os mapas abaixo — não é necessário alterar o código dos componentes.

// ===== Diário do lote: changeType =====

export const CHANGE_TYPE_MAP: Record<string, string> = {
  Created:    'Criado',
  Updated:    'Atualizado',
  Dispatched: 'Enviado',
  Approved:   'Aprovado',
  Rejected:   'Rejeitado',
  Exported:   'Exportado',
  Confirmed:  'Confirmado',
  Disabled:   'Desabilitado',
  Reopened:   'Reaberto',
  Cancelled:  'Cancelado',
};

export function translateChangeType(ct: string): string {
  return CHANGE_TYPE_MAP[ct] ?? ct;
}

// ===== Nomes de campos usados em mensagens de validação =====

const FIELD_NAME_MAP: Record<string, string> = {
  full_name:        'Nome completo',
  name:             'Nome',
  cpf:              'CPF',
  birth_date:       'Data de nascimento',
  admission_date:   'Data de admissão',
  mother_name:      'Nome da mãe',
  kinship:          'Parentesco',
  holder_cpf:       'CPF do titular',
  plan:             'Plano',
  registration:     'Matrícula',
  cnpj:             'CNPJ',
  destination:      'Operadora / Seguradora',
  reason:           'Motivo',
  competence:       'Competência',
};

// ===== Padrões de mensagens de validação do backend =====

const VALIDATION_PATTERNS: Array<{
  pattern: RegExp;
  replace: (...args: string[]) => string;
}> = [
  {
    pattern: /Required field ['"]?(\w+)['"]? is missing/i,
    replace: (_, field) => `Campo obrigatório: ${FIELD_NAME_MAP[field] ?? field}`,
  },
  {
    pattern: /Field ['"]?(\w+)['"]? must be a valid date/i,
    replace: (_, field) => `${FIELD_NAME_MAP[field] ?? field}: data inválida`,
  },
  {
    pattern: /Field ['"]?(\w+)['"]? is required/i,
    replace: (_, field) => `Campo obrigatório: ${FIELD_NAME_MAP[field] ?? field}`,
  },
  {
    pattern: /Invalid value for field ['"]?(\w+)['"]?/i,
    replace: (_, field) => `Valor inválido para: ${FIELD_NAME_MAP[field] ?? field}`,
  },
  {
    pattern: /Field ['"]?(\w+)['"]? exceeds maximum length/i,
    replace: (_, field) => `${FIELD_NAME_MAP[field] ?? field}: tamanho máximo excedido`,
  },
  {
    pattern: /^Required fields? missing$/i,
    replace: () => 'Campo(s) obrigatório(s) ausente(s)',
  },
];

export function translateValidationMessage(msg: string): string {
  for (const { pattern, replace } of VALIDATION_PATTERNS) {
    const m = msg.match(pattern);
    if (m) return replace(...m);
  }
  return msg;
}
