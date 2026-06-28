import { httpClient } from './client';
import type { ApiOccurrenceDetail } from './types';

export const occurrencesApi = {
  detail: (occurrenceId: string) =>
    httpClient.get<ApiOccurrenceDetail>(`/api/occurrences/${occurrenceId}`),

  editField: (occurrenceId: string, fieldKey: string, value: string) =>
    httpClient.patch<ApiOccurrenceDetail>(
      `/api/occurrences/${occurrenceId}/fields/${fieldKey}`,
      { value },
    ),

  approve: (occurrenceId: string) =>
    httpClient.post<ApiOccurrenceDetail>(
      `/api/occurrences/${occurrenceId}/approve`,
    ),

  reject: (occurrenceId: string, reason: string) =>
    httpClient.post<ApiOccurrenceDetail>(
      `/api/occurrences/${occurrenceId}/reject`,
      { reason },
    ),

  disable: (occurrenceId: string) =>
    httpClient.post<ApiOccurrenceDetail>(
      `/api/occurrences/${occurrenceId}/disable`,
    ),

  postNote: (occurrenceId: string, text: string) =>
    httpClient.post<void>(`/api/occurrences/${occurrenceId}/notes`, { text }),

  batchApprove: (occurrenceIds: string[]) =>
    httpClient.post<unknown>('/api/occurrences/batch/approve', { occurrenceIds }),

  batchReject: (occurrenceIds: string[], reason: string) =>
    httpClient.post<unknown>('/api/occurrences/batch/reject', { occurrenceIds, reason }),

  batchDisable: (occurrenceIds: string[]) =>
    httpClient.post<unknown>('/api/occurrences/batch/disable', { occurrenceIds }),
};
