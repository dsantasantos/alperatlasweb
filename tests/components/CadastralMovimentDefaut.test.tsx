import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CadastralMovimentDefaut from '../../src/pages/moviment/CadastralMovimentDefaut';
import { batchesApi } from '../../src/api/batches';
import type { ApiBatchListResponse, ApiBatchDetail, ApiBatchSummary } from '../../src/api/types';

vi.mock('../../src/api/batches', () => ({
  batchesApi: {
    list:     vi.fn(),
    detail:   vi.fn(),
    summary:  vi.fn(),
    export:   vi.fn(),
    dispatch: vi.fn(),
  },
}));

vi.mock('../../src/api/occurrences', () => ({
  occurrencesApi: {
    approve:   vi.fn(),
    reject:    vi.fn(),
    disable:   vi.fn(),
    editField: vi.fn(),
    detail:    vi.fn(),
  },
}));

const MOCK_BATCH_LIST: ApiBatchListResponse = {
  items: [{
    batchId: 'b-1',
    operationTypeKey: 'cadastral-movement',
    sourceType: 'CSV',
    sourceId: 'importacao.csv',
    sourceChannel: 'sftp',
    state: 'Processing',
    receivedAt: '2026-01-15T10:00:00Z',
    occurrenceCount: 5,
    pendingCount: 3,
    approvedCount: 1,
    rejectedCount: 1,
  }],
  totalCount: 1, page: 1, pageSize: 50,
};

const MOCK_BATCH_DETAIL: ApiBatchDetail = {
  batchId: 'b-1',
  operationTypeKey: 'cadastral-movement',
  sourceType: 'CSV',
  sourceId: 'importacao.csv',
  sourceChannel: 'sftp',
  state: 'Processing',
  receivedAt: '2026-01-15T10:00:00Z',
  schema: {
    displayName: 'Movimentação Cadastral API Test',
    fields: [
      { key: 'nome',    displayLabel: 'Nome do Beneficiário API', displayOrder: 1 },
      { key: 'cpf',     displayLabel: 'CPF / CNPJ API',           displayOrder: 2 },
      { key: 'destino', displayLabel: 'Operadora de Saúde API',   displayOrder: 3 },
      { key: 'plano',   displayLabel: 'Plano Contratado API',     displayOrder: 4 },
    ],
  },
  occurrences: { items: [], totalCount: 0, page: 1, pageSize: 200 },
};

const MOCK_SUMMARY: ApiBatchSummary = {
  batchId: 'b-1', pending: 3, approved: 1, rejected: 1, disabled: 0, error: 0, warning: 0,
};

describe('CadastralMovimentDefaut — table header labels (T018)', () => {
  beforeEach(() => {
    vi.mocked(batchesApi.list).mockResolvedValue(MOCK_BATCH_LIST);
    vi.mocked(batchesApi.detail).mockResolvedValue(MOCK_BATCH_DETAIL);
    vi.mocked(batchesApi.summary).mockResolvedValue(MOCK_SUMMARY);
  });

  it('table <th> content comes from schema displayLabel, not hardcoded strings', async () => {
    render(<CadastralMovimentDefaut />);
    await waitFor(() => {
      expect(screen.getByText('Nome do Beneficiário API')).toBeInTheDocument();
      expect(screen.getByText('CPF / CNPJ API')).toBeInTheDocument();
      expect(screen.getByText('Operadora de Saúde API')).toBeInTheDocument();
      expect(screen.getByText('Plano Contratado API')).toBeInTheDocument();
    });
  });

  it('renders the batch schema displayName as the page title', async () => {
    render(<CadastralMovimentDefaut />);
    await waitFor(() => {
      expect(screen.getByText('Movimentação Cadastral API Test')).toBeInTheDocument();
    });
  });

  it('does not render hardcoded Portuguese column labels', async () => {
    render(<CadastralMovimentDefaut />);
    await waitFor(() => {
      expect(screen.queryByText('Beneficiário')).not.toBeInTheDocument();
      expect(screen.queryByText('Operadora / Seguradora')).not.toBeInTheDocument();
    });
  });
});
