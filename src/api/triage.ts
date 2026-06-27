import { httpClient } from './client';
import type { ApiTriageResponse } from './types';

export const triageApi = {
  list: (params?: {
    operationTypeKey?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.operationTypeKey) q.set('operationTypeKey', params.operationTypeKey);
    if (params?.page)             q.set('page', String(params.page));
    if (params?.pageSize)         q.set('pageSize', String(params.pageSize));
    const qs = q.toString();
    return httpClient.get<ApiTriageResponse>(`/api/triage${qs ? '?' + qs : ''}`);
  },
};
