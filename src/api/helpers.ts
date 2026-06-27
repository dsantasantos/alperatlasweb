import type { ApiOccurrenceField, ApiBatchSchemaField } from './types';

export function getField(fields: ApiOccurrenceField[], key: string): string {
  return fields.find(f => f.key === key)?.value ?? '—';
}

export function makeLabel(fields: ApiBatchSchemaField[]): Record<string, string> {
  return Object.fromEntries(fields.map(f => [f.key, f.displayLabel]));
}

export function mapSev(severity: string): 'erro' | 'aviso' | 'info' {
  if (severity === 'Error')   return 'erro';
  if (severity === 'Warning') return 'aviso';
  return 'info';
}

const STATE_META: Record<string, { l: string; c: string }> = {
  Pending:  { l: 'Pendente',     c: 'st-pend' },
  Approved: { l: 'Aprovado',     c: 'st-apr'  },
  Rejected: { l: 'Rejeitado',    c: 'st-rej'  },
  Disabled: { l: 'Desabilitado', c: 'st-dis'  },
};

export function stateMeta(state: string): { l: string; c: string } {
  return STATE_META[state] ?? { l: state, c: 'st-pend' };
}
