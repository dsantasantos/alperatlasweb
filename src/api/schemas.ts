import { httpClient } from './client';
import type { ApiSchemaFull } from './types';

export const schemasApi = {
  get: (operationTypeKey: string) =>
    httpClient.get<ApiSchemaFull>(`/api/schemas/${operationTypeKey}`),
};
