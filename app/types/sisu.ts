// SISU API Types
// Provides TypeScript interfaces for SISU API responses

/**
 * Represents a single lead source from SISU
 * Key is the numeric ID, value is the display name
 */
export type SISULeadSourcesMap = Record<string, string>;

export type SISUFindAgentRequest = {
  email: string;
};

export type SISUAgent = {
  agent_id: number;
  email: string;
  archived_email?: string;
  first_name: string;
  last_name: string;
  mobile_phone?: string;
  status?: string;
  current_team_id?: number | null;
  external_ids?: {
    fub?: string;
    [key: string]: unknown;
  };
  team_ids?: number[];
  is_admin?: boolean | null;
  is_isa?: boolean;
  is_superuser?: boolean | null;
  timezone?: string;
  start_dt?: string;
  created_ts?: string;
  updated_ts?: string;
  last_access_ts?: string;
  [key: string]: unknown;
};

export type SISUFindAgentResponse = {
  agents: SISUAgent[];
  host?: string;
  log_id?: number;
  process_ms?: number;
  server_time?: string;
  status: string;
  status_code: number;
  trace_id?: number;
};

export type SISUTeamAgentsResponse = {
  agents: SISUAgent[];
  host?: string;
  log_id?: number;
  process_ms?: number;
  server_time?: string;
  status: string;
  status_code: number;
  trace_id?: number;
};

export type SISUCreateTransactionRequest = Record<string, unknown>;

export type SISUCreateTransactionResponse = {
  id?: number | string;
  transaction_id?: number | string;
  client_id?: number | string;
  [key: string]: unknown;
};

export type SISUTransaction = {
  // Transaction data
  id?: number | string;
  transaction_id?: number | string;
  client_id?: number | string;
  agent_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_phone?: string;
  second_contact_name?: string;
  second_contact_email?: string;
  second_contact_phone?: string;
  lead_type_id?: string;
  type_id?: string;
  mls_id?: string;
  trans_amt?: number;
  tc_agent_id?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  property_type?: string;
  hoa_info?: string;
  financing?: string;
  commission_pct?: number;
  commission_amt?: number;
  uc_dt?: string;
  forecasted_closed_dt?: string;
  dotloop_loop_id?: string;
  mortgage_company_vid?: number;
  mortgage_company_name?: string;
  mortgage_company_phone?: string;
  loan_officer_name?: string;
  title_company_vid?: number;
  title_name?: string;
  escrow_officer_email?: string;
  escrow_officer_phone?: string;
  note?: string;
  referral?: string;
  referral_pct?: number;
  referral_amt?: number;
  custom?: Record<string, unknown>;
  [key: string]: unknown;
};

export type SISUTransactionSearchResponse = {
  // SISU Response metadata
  status_code?: number;
  status?: string;
  log_id?: string;
  process_ms?: number;
  server_time?: string;
  api_client_id?: string;
  api_client_name?: string;
  team_id?: number;
  environment?: string;
  host?: string;

  // Transaction data is nested in "client" property
  clients: SISUTransaction[];
  [key: string]: unknown;
};

export type SISUTransactionResponse = {
  // SISU Response metadata
  status_code?: number;
  status?: string;
  log_id?: string;
  process_ms?: number;
  server_time?: string;
  api_client_id?: string;
  api_client_name?: string;
  team_id?: number;
  environment?: string;
  host?: string;

  // Transaction data is nested in "client" property
  client?: SISUTransaction;
  [key: string]: unknown;
};
/**
 * SISU Lead Sources API Response
 * Contains a map of lead source IDs to names
 */
export interface SISULeadSourcesResponse {
  count: number;
  host: string;
  lead_sources: SISULeadSourcesMap;
  log_id: number;
  process_ms: number;
  server_time: string;
  status: string;
  status_code: number;
  trace_id: number;
}

/**
 * Transformed dropdown option for use in form UI
 */
export interface SISUDropdownOption {
  value: string | number;
  label: string;
  key?: string | number;
}

/**
 * SISU API Error response
 */
export interface SISUApiError {
  status: number;
  message: string;
  code?: string;
}

/**
 * Transformed lead sources response for the frontend
 * Maps raw SISU data to dropdown-friendly format
 */
export interface SISULeadSourcesTransformed {
  options: SISUDropdownOption[];
  count: number;
}

/**
 * SISU Dropdown Options API Response
 * Contains a list of dropdown options
 */
export interface SISUDropdownOptionsResponse {
  count: number;
  host: string;
  options: SISUDropdownOption[];
  log_id: number;
  process_ms: number;
  server_time: string;
  status: string;
  status_code: number;
  trace_id: number;
}

/**
 * Transformed dropdown options response for the frontend
 * Maps raw SISU data to dropdown-friendly format
 */
export interface SISUDropdownOptionsTransformed {
  options: SISUDropdownOption[];
  count: number;
}

/**
 * Represents a single team field with its configuration
 * Can have options (for dropdowns/selects) or be a simple text/number field
 */
export interface SISUTeamField {
  name: string;
  field_name?: string;
  label?: string;
  field_label?: string;
  type?: string;
  field_type?: string;
  options?: Record<string, string> | SISUDropdownOption[];
  required?: boolean;
  custom?: boolean;
  is_custom?: boolean;
  isCustom?: boolean;
}

/**
 * Raw SISU Team Fields API Response
 * Contains metadata about all fields available for the team
 */
export interface SISUTeamFieldsResponse {
  host: string;
  fields: Record<string, SISUTeamField | Record<string, string>>;
  log_id: number;
  process_ms: number;
  server_time: string;
  status: string;
  server_code: number;
  trace_id: number;
}

/**
 * Transformed team fields for the frontend
 * Maps field names to their dropdown options
 */
export interface SISUTeamFieldsTransformed {
  [fieldName: string]: SISUDropdownOption[];
}

export interface SISUTeamFieldCatalogEntry {
  name: string;
  label: string;
  type: string | null;
  custom: boolean;
  options: SISUDropdownOption[];
}

export interface SISUTeamFieldsCatalogResponse {
  fields: Record<string, SISUTeamFieldCatalogEntry>;
}

/**
 * Complete transformed team fields response
 * Contains all field options keyed by field name
 */
export interface SISUTeamFieldsTransformedResponse {
  fields: SISUTeamFieldsTransformed;
  count: number;
}

/**
 * Represents a single vendor from SISU
 */
export interface SISUVendor {
  id: string;
  name: string;
  type: string; // "T" for Title Company, "M" for Mortgage Company, etc.
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postal_code: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  [key: string]: unknown;
}

/**
 * Raw SISU Vendors API Response
 * Contains vendor data with various fields
 */
export interface SISUVendorsResponse {
  host: string;
  vendors: Record<string, SISUVendor | Record<string, string>>;
  log_id: number;
  process_ms: number;
  server_time: string;
  status: string;
  server_code: number;
  trace_id: number;
}

/**
 * Transformed vendor data for frontend
 * Maps vendor type to array of dropdown options
 */
export interface SISUVendorsByType {
  titleCompany: SISUDropdownOption[];
  mortgageCompany: SISUDropdownOption[];
  attorney: SISUDropdownOption[];
  homeWarranty: SISUDropdownOption[];
  [key: string]: SISUDropdownOption[];
}

export interface SISUVendorsTransformed {
  [vendor_id: string]: SISUDropdownOption[];
}

export interface SISUVendorsTransformedResponse {
  vendors: SISUVendorsTransformed;
  count: number;
}

export interface SISUDocumentData {
  client_id: string;
  filename: string;
  data: string;
  file_extension: string;
  file_type: string;
  content_type: string;
}

export interface SISUResponse {
  process_ms: number;
  server_time: string;
  status: number;
  status_code: string;
  client_document_id: number;
  [key: string]: unknown;
}
