// CONTRACT VERSION: 1.0 — mirrors API Atlas v1 endpoints
// DO NOT change without updating the backend contract simultaneously.

// ===== Auth =====

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ===== Schema =====

export interface ApiBatchSchemaField {
  key: string;
  displayLabel: string;
  displayOrder: number;
}

export interface ApiBatchSchema {
  displayName: string;
  fields: ApiBatchSchemaField[];
}

export interface ApiSchemaField extends ApiBatchSchemaField {
  isRequired: boolean;
  typeHint: string;
}

export interface ApiSchemaFull {
  operationTypeKey: string;
  displayName: string;
  validationRuleKeys: string[];
  fields: ApiSchemaField[];
}

// ===== Shared field / provenance =====

export interface ApiFieldProvenance {
  state: string;       // "Automatic" | "Manual"
  description: string;
}

export interface ApiOccurrenceField {
  key: string;
  value: string;
  originalValue: string | null;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
  provenance: ApiFieldProvenance;
}

export interface ApiValidationSummary {
  errorCount: number;
  warningCount: number;
}

// ===== Occurrences =====

export interface ApiOccurrenceListItem {
  occurrenceId: string;
  sourceRecordId: string;
  state: string;         // "Pending" | "Approved" | "Rejected" | "Disabled"
  hasBlockingErrors: boolean;
  fields: ApiOccurrenceField[];
  validationSummary: ApiValidationSummary;
}

export interface ApiValidation {
  ruleKey: string;
  dimension: string;   // "Capture" | "Movement"
  severity: string;    // "Error" | "Warning" | "Info"
  message: string;
  fieldKey: string;
}

export interface ApiOccurrenceDetail {
  occurrenceId: string;
  batchId: string;
  sourceRecordId: string;
  state: string;
  rejectionReason: string | null;
  fields: ApiOccurrenceField[];
  validations: ApiValidation[];
}

// ===== Batches =====

export interface ApiBatchListItem {
  batchId: string;
  operationTypeKey: string;
  sourceType: string;
  sourceId: string;
  sourceChannel: string;
  state: string;
  receivedAt: string;
  occurrenceCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface ApiBatchListResponse {
  items: ApiBatchListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiBatchDetail {
  batchId: string;
  operationTypeKey: string;
  sourceType: string;
  sourceId: string;
  sourceChannel: string;
  state: string;
  receivedAt: string;
  schema: ApiBatchSchema;
  occurrences: {
    items: ApiOccurrenceListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
}

export interface ApiBatchSummary {
  batchId: string;
  pending: number;
  approved: number;
  rejected: number;
  disabled: number;
  error: number;
  warning: number;
}

export interface ApiDispatchResult {
  batchId: string;
  dispatchedCount: number;
  results: {
    occurrenceId: string;
    externalReference: string;
    success: boolean;
  }[];
}

// ===== Triage =====

export interface ApiTriageItem {
  occurrenceId: string;
  batchId: string;
  operationTypeKey: string;
  sourceRecordId: string;
  state: string;
  hasBlockingErrors: boolean;
  fields: ApiOccurrenceField[];
  validationSummary: ApiValidationSummary;
}

export interface ApiTriageResponse {
  items: ApiTriageItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
