import { httpClient } from './client';
import type { ApiSchema } from './types';

export const schemasApi = {
  get: (operationTypeKey: string) =>
    httpClient.get<ApiSchema>(`/api/schemas/${operationTypeKey}`),
};
