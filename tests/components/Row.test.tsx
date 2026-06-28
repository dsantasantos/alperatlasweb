import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Row } from '../../src/pages/moviment/CadastralMovimentDefaut';
import type { ApiOccurrenceListItem, ApiSchemaField } from '../../src/api/types';

const prov = { state: 'Automatic', description: '' };

const makeField = (key: string, value: string) => ({
  key, value, originalValue: null, lastEditedBy: null, lastEditedAt: null, provenance: prov,
});

const makeSchemaField = (key: string, displayLabel: string, displayOrder: number): ApiSchemaField => ({
  key, displayLabel, displayOrder, dataType: 'text', isRequired: false,
});

const mockSchema: ApiSchemaField[] = [
  makeSchemaField('tipo',       'Tipo de Evento',    1),
  makeSchemaField('nome',       'Beneficiário',      2),
  makeSchemaField('cpf',        'CPF',               3),
  makeSchemaField('destino',    'Operadora',         4),
  makeSchemaField('plano',      'Plano',             5),
  makeSchemaField('parentesco', 'Tipo de Titular',   6),
];

const mockOccurrence: ApiOccurrenceListItem = {
  occurrenceId: 'occ-1',
  sourceRecordId: 'src-1',
  state: 'Pending',
  hasBlockingErrors: false,
  fields: [
    makeField('tipo',       'Inclusão'),
    makeField('nome',       'João da Silva'),
    makeField('cpf',        '123.456.789-00'),
    makeField('destino',    'Bradesco Saúde'),
    makeField('plano',      'Diamante'),
    makeField('parentesco', 'Titular'),
  ],
  validationSummary: { errorCount: 0, warningCount: 0 },
};

describe('Row', () => {
  it('renders field values from schema in displayOrder (not hardcoded columns)', () => {
    render(
      <table><tbody>
        <Row r={mockOccurrence} schema={mockSchema} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    expect(screen.getByText('João da Silva')).toBeInTheDocument();
    expect(screen.getByText('123.456.789-00')).toBeInTheDocument();
    expect(screen.getByText('Bradesco Saúde')).toBeInTheDocument();
    expect(screen.getByText('Diamante')).toBeInTheDocument();
  });

  it('shows "conforme" chip when there are no validation errors or warnings', () => {
    render(
      <table><tbody>
        <Row r={mockOccurrence} schema={mockSchema} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    expect(screen.getByText('conforme')).toBeInTheDocument();
  });

  it('shows error chip count when hasBlockingErrors is true', () => {
    const errOcc: ApiOccurrenceListItem = {
      ...mockOccurrence,
      hasBlockingErrors: true,
      validationSummary: { errorCount: 2, warningCount: 0 },
    };
    render(
      <table><tbody>
        <Row r={errOcc} schema={mockSchema} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    expect(screen.getByText(/2 erros/)).toBeInTheDocument();
  });

  it('renders Pendente state badge for Pending occurrences', () => {
    render(
      <table><tbody>
        <Row r={mockOccurrence} schema={mockSchema} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('renders one cell per schema field (dynamic column count)', () => {
    const smallSchema: ApiSchemaField[] = [
      makeSchemaField('nome', 'Nome', 1),
      makeSchemaField('cpf',  'CPF',  2),
    ];
    const { container } = render(
      <table><tbody>
        <Row r={mockOccurrence} schema={smallSchema} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    // checkbox + Tipo + 2 dynamic + Conferência + Status + chevron = 7 cells
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(7);
  });
});

describe('Row — column cap (table shows ≤ 5 dynamic columns)', () => {
  const make8FieldSchema = (): ApiSchemaField[] => [
    makeSchemaField('f1', 'Campo 1', 1),
    makeSchemaField('f2', 'Campo 2', 2),
    makeSchemaField('f3', 'Campo 3', 3),
    makeSchemaField('f4', 'Campo 4', 4),
    makeSchemaField('f5', 'Campo 5', 5),
    makeSchemaField('f6', 'Campo 6', 6),
    makeSchemaField('f7', 'Campo 7', 7),
    makeSchemaField('f8', 'Campo 8', 8),
  ];

  const makeOccurrenceWith8Fields = (): ApiOccurrenceListItem => ({
    occurrenceId: 'occ-cap',
    sourceRecordId: 'src-cap',
    state: 'Pending',
    hasBlockingErrors: false,
    fields: [1, 2, 3, 4, 5, 6, 7, 8].map(n => makeField(`f${n}`, `valor${n}`)),
    validationSummary: { errorCount: 0, warningCount: 0 },
  });

  it('renders exactly 5 dynamic cells when schema has 8 fields (5-column cap applied upstream)', () => {
    // The page passes tableSchema = orderedSchema.slice(0, 5) to Row
    const tableSchema = make8FieldSchema().slice(0, 5);
    const { container } = render(
      <table><tbody>
        <Row r={makeOccurrenceWith8Fields()} schema={tableSchema} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    // checkbox + Tipo + 5 dynamic + Conferência + Status + chevron = 10 cells
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(10);
  });

  it('renders all 3 dynamic cells when schema has 3 fields (under the cap)', () => {
    const schema3: ApiSchemaField[] = [
      makeSchemaField('f1', 'Campo 1', 1),
      makeSchemaField('f2', 'Campo 2', 2),
      makeSchemaField('f3', 'Campo 3', 3),
    ];
    const { container } = render(
      <table><tbody>
        <Row r={makeOccurrenceWith8Fields()} schema={schema3} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    // checkbox + Tipo + 3 dynamic + Conferência + Status + chevron = 8 cells
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(8);
  });

  it('renders 0 dynamic cells when schema is empty', () => {
    const { container } = render(
      <table><tbody>
        <Row r={makeOccurrenceWith8Fields()} schema={[]} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    // checkbox + Tipo + 0 dynamic + Conferência + Status + chevron = 5 cells
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(5);
  });

  it('renders columns in ascending displayOrder (first 5 by order are visible)', () => {
    // tableSchema is orderedSchema.slice(0,5): fields f1-f5 (displayOrder 1-5)
    const tableSchema = make8FieldSchema().slice(0, 5);
    render(
      <table><tbody>
        <Row r={makeOccurrenceWith8Fields()} schema={tableSchema} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    // Fields 1-5 appear; fields 6-8 are not in tableSchema so not rendered
    expect(screen.getByText('valor1')).toBeInTheDocument();
    expect(screen.getByText('valor5')).toBeInTheDocument();
    expect(screen.queryByText('valor6')).not.toBeInTheDocument();
    expect(screen.queryByText('valor8')).not.toBeInTheDocument();
  });
});
