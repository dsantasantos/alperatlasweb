import type { ApiOccurrenceField, ApiSchemaField } from './types';

export function getField(fields: ApiOccurrenceField[], key: string): string {
  return fields.find(f => f.key === key)?.value ?? '—';
}

export function makeLabel(fields: ApiSchemaField[]): Record<string, string> {
  return Object.fromEntries(fields.map(f => [f.key, f.displayLabel]));
}

export function resolveInputType(dataType: string): 'text' | 'date' | 'datetime-local' {
  if (dataType === 'date') return 'date';
  if (dataType === 'datetime') return 'datetime-local';
  return 'text';
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
