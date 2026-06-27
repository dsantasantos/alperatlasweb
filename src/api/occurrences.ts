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
};
