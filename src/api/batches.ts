import { httpClient } from './client';
import type {
  ApiBatchListResponse,
  ApiBatchDetail,
  ApiBatchSummary,
  ApiBatchAuditEntry,
  ApiDispatchResult,
} from './types';

function qs(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? '?' + s : '';
}

export const batchesApi = {
  list: (params?: {
    state?: string;
    operationTypeKey?: string;
    page?: number;
    pageSize?: number;
  }) =>
    httpClient.get<ApiBatchListResponse>(
      `/api/batches${qs({ ...params })}`,
    ),

  detail: (
    batchId: string,
    params?: { occurrenceState?: string; page?: number; pageSize?: number },
  ) =>
    httpClient.get<ApiBatchDetail>(
      `/api/batches/${batchId}${qs({ ...params })}`,
    ),

  summary: (batchId: string) =>
    httpClient.get<ApiBatchSummary>(`/api/batches/${batchId}/summary`),

  export: (batchId: string, template = 'defaultxlsx') =>
    httpClient.blob(`/api/batches/${batchId}/export${qs({ template })}`),

  dispatch: (batchId: string) =>
    httpClient.post<ApiDispatchResult>(`/api/batches/${batchId}/dispatch`),

  audit: (batchId: string) =>
    httpClient.get<ApiBatchAuditEntry[]>(`/api/batches/${batchId}/audit`),
};
