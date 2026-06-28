import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Drawer } from '../../src/pages/moviment/CadastralMovimentDefaut';
import type { ApiOccurrenceDetail, ApiSchemaField } from '../../src/api/types';

vi.mock('../../src/api/occurrences', () => ({
  occurrencesApi: {
    approve:   vi.fn(),
    reject:    vi.fn(),
    disable:   vi.fn(),
    editField: vi.fn(),
    detail:    vi.fn(),
  },
}));

const prov = { state: 'Automatic', description: '' };

const makeSchemaField = (key: string, displayLabel: string, displayOrder: number, dataType = 'text'): ApiSchemaField => ({
  key, displayLabel, displayOrder, dataType, isRequired: false,
});

const schema: ApiSchemaField[] = [
  makeSchemaField('nome', 'Nome Completo',  1),
  makeSchemaField('cpf',  'CPF / CNPJ',    2, 'cpf'),
  makeSchemaField('tipo', 'Tipo de Evento', 3),
  makeSchemaField('data', 'Data do Evento', 4, 'date'),
];

const makeDetail = (hasBlockingError: boolean): ApiOccurrenceDetail => ({
  occurrenceId: 'occ-1',
  batchId: 'batch-1',
  sourceRecordId: 'src-1',
  state: 'Pending',
  rejectionReason: null,
  fields: [
    { key: 'nome', value: 'Maria Oliveira', originalValue: null, lastEditedBy: null, lastEditedAt: null, provenance: prov },
    { key: 'cpf',  value: '987.654.321-00', originalValue: null, lastEditedBy: null, lastEditedAt: null, provenance: prov },
    { key: 'tipo', value: 'Inclusão',       originalValue: null, lastEditedBy: null, lastEditedAt: null, provenance: prov },
    { key: 'data', value: '2026-01-15',     originalValue: null, lastEditedBy: null, lastEditedAt: null, provenance: prov },
  ],
  validations: hasBlockingError
    ? [{ ruleKey: 'r1', dimension: 'Capture', severity: 'Error', message: 'Erro bloqueante no CPF', fieldKey: 'cpf' }]
    : [],
});

describe('Drawer — blocking error guard', () => {
  it('disables Approve button when there is a blocking Capture error', () => {
    render(
      <Drawer
        detail={makeDetail(true)}
        schema={schema}
        onClose={() => {}}
        onUpdate={() => {}}
        flash={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /Aprovar/i })).toBeDisabled();
  });

  it('enables Approve button when there are no blocking errors', () => {
    render(
      <Drawer
        detail={makeDetail(false)}
        schema={schema}
        onClose={() => {}}
        onUpdate={() => {}}
        flash={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /Aprovar/i })).not.toBeDisabled();
  });
});

describe('Drawer — schema-driven field labels', () => {
  it('renders field labels from schema displayLabel, not raw field key', () => {
    render(
      <Drawer
        detail={makeDetail(false)}
        schema={schema}
        onClose={() => {}}
        onUpdate={() => {}}
        flash={() => {}}
      />
    );
    expect(screen.getByText('Nome Completo')).toBeInTheDocument();
    expect(screen.getByText('CPF / CNPJ')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Evento')).toBeInTheDocument();
    expect(screen.getByText('Data do Evento')).toBeInTheDocument();
  });

  it('does not render raw field keys as labels', () => {
    render(
      <Drawer
        detail={makeDetail(false)}
        schema={schema}
        onClose={() => {}}
        onUpdate={() => {}}
        flash={() => {}}
      />
    );
    const labels = document.querySelectorAll('.fl');
    const labelTexts = Array.from(labels).map(el => el.textContent?.trim());
    expect(labelTexts).not.toContain('nome');
    expect(labelTexts).not.toContain('cpf');
    expect(labelTexts).not.toContain('tipo');
  });
});

describe('Drawer — shows all schema fields regardless of table column cap', () => {
  it('renders all 8 field labels when schema has 8 fields (no cap in modal)', () => {
    const schema8: ApiSchemaField[] = [1, 2, 3, 4, 5, 6, 7, 8].map(n =>
      makeSchemaField(`f${n}`, `Campo ${n}`, n)
    );
    const detail8: ApiOccurrenceDetail = {
      occurrenceId: 'occ-8',
      batchId: 'batch-1',
      sourceRecordId: 'src-1',
      state: 'Pending',
      rejectionReason: null,
      fields: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
        key: `f${n}`,
        value: `valor${n}`,
        originalValue: null,
        lastEditedBy: null,
        lastEditedAt: null,
        provenance: { state: 'Automatic', description: '' },
      })),
      validations: [],
      notes: [],
    };
    render(
      <Drawer detail={detail8} schema={schema8} onClose={() => {}} onUpdate={() => {}} flash={() => {}} />
    );
    for (let n = 1; n <= 8; n++) {
      expect(screen.getByText(`Campo ${n}`)).toBeInTheDocument();
    }
  });
});

describe('Drawer — input type mapping (resolveInputType)', () => {
  it('renders a date picker for fields with dataType "date"', () => {
    render(
      <Drawer
        detail={makeDetail(false)}
        schema={schema}
        onClose={() => {}}
        onUpdate={() => {}}
        flash={() => {}}
      />
    );
    // The 'data' field has dataType 'date' → should render type="date"
    const inputs = document.querySelectorAll('input[type="date"]');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders text inputs for fields with dataType other than date/datetime', () => {
    render(
      <Drawer
        detail={makeDetail(false)}
        schema={schema}
        onClose={() => {}}
        onUpdate={() => {}}
        flash={() => {}}
      />
    );
    // 'nome', 'cpf', 'tipo' have dataType 'text'/'cpf' → type="text"
    const textInputs = document.querySelectorAll('input[type="text"]');
    expect(textInputs.length).toBe(3);
  });
});
