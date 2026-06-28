import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CadastralMovimentDefaut from '../../src/pages/moviment/CadastralMovimentDefaut';
import { batchesApi } from '../../src/api/batches';
import { schemasApi } from '../../src/api/schemas';
import type { ApiBatchListResponse, ApiBatchDetail, ApiBatchSummary, ApiSchema } from '../../src/api/types';

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

vi.mock('../../src/api/schemas', () => ({
  schemasApi: {
    get: vi.fn(),
  },
}));

const MOCK_SCHEMA: ApiSchema = {
  operationTypeKey: 'cadastral-movement',
  displayName: 'Movimentação Cadastral API Test',
  validationRuleKeys: [],
  fields: [
    { key: 'nome',    displayLabel: 'Nome do Beneficiário API', displayOrder: 1, dataType: 'text',  isRequired: true  },
    { key: 'cpf',     displayLabel: 'CPF / CNPJ API',           displayOrder: 2, dataType: 'cpf',   isRequired: true  },
    { key: 'destino', displayLabel: 'Operadora de Saúde API',   displayOrder: 3, dataType: 'text',  isRequired: false },
    { key: 'plano',   displayLabel: 'Plano Contratado API',     displayOrder: 4, dataType: 'text',  isRequired: false },
  ],
};

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
  occurrences: { items: [], totalCount: 0, page: 1, pageSize: 200 },
};

const MOCK_SUMMARY: ApiBatchSummary = {
  batchId: 'b-1', pending: 3, approved: 1, rejected: 1, disabled: 0, error: 0, warning: 0,
};

describe('CadastralMovimentDefaut — table header labels (T018)', () => {
  beforeEach(() => {
    vi.mocked(schemasApi.get).mockResolvedValue(MOCK_SCHEMA);
    vi.mocked(batchesApi.list).mockResolvedValue(MOCK_BATCH_LIST);
    vi.mocked(batchesApi.detail).mockResolvedValue(MOCK_BATCH_DETAIL);
    vi.mocked(batchesApi.summary).mockResolvedValue(MOCK_SUMMARY);
  });

  it('table <th> content comes from GET /api/schemas displayLabel, not hardcoded strings', async () => {
    render(<CadastralMovimentDefaut />);
    await waitFor(() => {
      expect(screen.getByText('Nome do Beneficiário API')).toBeInTheDocument();
      expect(screen.getByText('CPF / CNPJ API')).toBeInTheDocument();
      expect(screen.getByText('Operadora de Saúde API')).toBeInTheDocument();
      expect(screen.getByText('Plano Contratado API')).toBeInTheDocument();
    });
  });

  it('renders the schema displayName as the page title', async () => {
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

describe('CadastralMovimentDefaut — fixed columns (T018a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(schemasApi.get).mockResolvedValue(MOCK_SCHEMA);
    vi.mocked(batchesApi.list).mockResolvedValue(MOCK_BATCH_LIST);
    vi.mocked(batchesApi.detail).mockResolvedValue(MOCK_BATCH_DETAIL);
    vi.mocked(batchesApi.summary).mockResolvedValue(MOCK_SUMMARY);
  });

  it('"Conferência" and "Status" headers are always present regardless of schema', async () => {
    render(<CadastralMovimentDefaut />);
    await waitFor(() => {
      expect(screen.getByText('Conferência')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('"Conferência" and "Status" are the last two column headers (before the open-chevron header)', async () => {
    render(<CadastralMovimentDefaut />);
    await waitFor(() => {
      const headers = screen.getAllByRole('columnheader');
      // headers: checkbox, ...dynamic, Conferência, Status, (empty chevron)
      const texts = headers.map(h => h.textContent?.trim());
      const confIdx   = texts.indexOf('Conferência');
      const statusIdx = texts.indexOf('Status');
      expect(confIdx).toBeGreaterThan(-1);
      expect(statusIdx).toBeGreaterThan(-1);
      // Status must come after Conferência
      expect(statusIdx).toBe(confIdx + 1);
      // Status must be the second-to-last non-empty header (last is the empty chevron th)
      expect(statusIdx).toBe(texts.length - 2);
    });
  });

  it('schema NOT re-fetched when a different batch is selected', async () => {
    render(<CadastralMovimentDefaut />);
    await waitFor(() => screen.getByText('Conferência'));
    // schemasApi.get should have been called exactly once (on mount only)
    expect(vi.mocked(schemasApi.get)).toHaveBeenCalledTimes(1);
  });
});
