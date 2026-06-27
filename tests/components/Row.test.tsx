import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Row } from '../../src/pages/moviment/CadastralMovimentDefaut';
import type { ApiOccurrenceListItem } from '../../src/api/types';

const prov = { state: 'Automatic', description: '' };

const makeField = (key: string, value: string) => ({
  key, value, originalValue: null, lastEditedBy: null, lastEditedAt: null, provenance: prov,
});

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
  it('renders field values from ApiOccurrenceField[] (not hardcoded strings)', () => {
    render(
      <table><tbody>
        <Row r={mockOccurrence} checked={false} onCheck={() => {}} onOpen={() => {}} />
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
        <Row r={mockOccurrence} checked={false} onCheck={() => {}} onOpen={() => {}} />
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
        <Row r={errOcc} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    expect(screen.getByText(/2 erros/)).toBeInTheDocument();
  });

  it('renders Pendente state badge for Pending occurrences', () => {
    render(
      <table><tbody>
        <Row r={mockOccurrence} checked={false} onCheck={() => {}} onOpen={() => {}} />
      </tbody></table>
    );
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });
});
