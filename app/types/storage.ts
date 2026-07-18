export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue | undefined }
  | JsonValue[];

/** Discriminator for form_submissions.form and form_sisu_mappings.form */
export type FormKind =
  | "agreementSigned"
  | "pending"
  | "closed"
  | "appointmentSet"
  | "appointmentMet";

export type FormSubmission = {
  id: number;
  created_at: Date;
  form: FormKind;
  lead_fub_id: number | null;
  deal_fub_id: number | null;
  form_data: JsonValue | null;
  lead_type: string | null;
  appointment_id: string | null;
  successful: boolean | null;
};

export type FormSubmissionInsert = {
  created_at?: Date | string;
  form: FormKind;
  lead_fub_id?: number | null;
  deal_fub_id?: number | null;
  form_data?: JsonValue | null;
  lead_type?: string | null;
  appointment_id?: string | null;
  successful?: boolean | null;
};

export type FormSisuMapping = {
  id: number;
  form: FormKind;
  field_name: string;
  sisu_field_name: string | null;
  sisu_field_type: string | null;
  custom: boolean;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

export type FormSisuMappingInsert = {
  form: FormKind;
  field_name: string;
  sisu_field_name?: string | null;
  sisu_field_type?: string | null;
  custom?: boolean;
  enabled?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

export type AuditLogSeverity = "info" | "warn" | "error";

export type AppAuditLog = {
  id: number;
  created_at: Date;
  event_type: string;
  severity: AuditLogSeverity;
  deal_fub_id: number | null;
  lead_fub_id: number | null;
  submission_id: number | null;
  message: string;
  metadata: JsonValue | null;
};

export type AppAuditLogInsert = {
  created_at?: Date | string;
  event_type: string;
  severity?: AuditLogSeverity;
  deal_fub_id?: number | null;
  lead_fub_id?: number | null;
  submission_id?: number | null;
  message: string;
  metadata?: JsonValue | null;
};

export type RouterForm = {
  slug: string;
  name: string;
  visible: boolean;
};

export type RouterFormInsert = {
  slug: string;
  name: string;
  visible?: boolean;
};

export type GmailAccountCredential = {
  id: number;
  created_at: Date;
  updated_at: Date;
  environment: string;
  email: string;
  refresh_token: string;
  access_token: string | null;
  expiry_date: Date | null;
  active: boolean;
};

export type GmailAccountCredentialInsert = {
  environment: string;
  email: string;
  refresh_token: string;
  access_token?: string | null;
  expiry_date?: Date | string | null;
  active?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

export type FormEmailRecipient = {
  id: number;
  created_at: Date;
  email: string;
  form_type: string;
  active: boolean;
  environment: string;
};

export type FormEmailRecipientInsert = {
  email: string;
  form_type: string;
  active?: boolean;
  environment: string;
  created_at?: Date | string;
};

export type FubStageTarget = "person" | "deal";

export type FormFubStage = {
  id: number;
  form: FormKind;
  target: FubStageTarget;
  client_type: string | null;
  stage_id: number;
  stage_name: string | null;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

export type FormFubStageInsert = {
  form: FormKind;
  target: FubStageTarget;
  client_type?: string | null;
  stage_id: number;
  stage_name?: string | null;
  enabled?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

export type FormFubTag = {
  id: number;
  form: FormKind;
  tag: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

export type FormFubTagInsert = {
  form: FormKind;
  tag: string;
  enabled?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

export type FormFubPersonMapping = {
  id: number;
  form: FormKind;
  field_name: string;
  fub_field_name: string | null;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

export type FormFubPersonMappingInsert = {
  form: FormKind;
  field_name: string;
  fub_field_name?: string | null;
  enabled?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

export type FormFubDealMapping = {
  id: number;
  form: FormKind;
  field_name: string;
  fub_field_name: string | null;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

export type FormFubDealMappingInsert = {
  form: FormKind;
  field_name: string;
  fub_field_name?: string | null;
  enabled?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

export type DatabaseTables = {
  form_submissions: {
    Row: FormSubmission;
    Insert: FormSubmissionInsert;
    Update: Partial<FormSubmissionInsert>;
  };
  form_sisu_mappings: {
    Row: FormSisuMapping;
    Insert: FormSisuMappingInsert;
    Update: Partial<FormSisuMappingInsert>;
  };
  app_audit_log: {
    Row: AppAuditLog;
    Insert: AppAuditLogInsert;
    Update: Partial<AppAuditLogInsert>;
  };
  router_forms: {
    Row: RouterForm;
    Insert: RouterFormInsert;
    Update: Partial<RouterFormInsert>;
  };
  gmail_account_credentials: {
    Row: GmailAccountCredential;
    Insert: GmailAccountCredentialInsert;
    Update: Partial<GmailAccountCredentialInsert>;
  };
  form_email_recipients: {
    Row: FormEmailRecipient;
    Insert: FormEmailRecipientInsert;
    Update: Partial<FormEmailRecipientInsert>;
  };
  form_fub_stages: {
    Row: FormFubStage;
    Insert: FormFubStageInsert;
    Update: Partial<FormFubStageInsert>;
  };
  form_fub_tags: {
    Row: FormFubTag;
    Insert: FormFubTagInsert;
    Update: Partial<FormFubTagInsert>;
  };
  form_fub_person_mappings: {
    Row: FormFubPersonMapping;
    Insert: FormFubPersonMappingInsert;
    Update: Partial<FormFubPersonMappingInsert>;
  };
  form_fub_deal_mappings: {
    Row: FormFubDealMapping;
    Insert: FormFubDealMappingInsert;
    Update: Partial<FormFubDealMappingInsert>;
  };
};

export type DatabaseTableName = keyof DatabaseTables;
export type TableRow<TTable extends DatabaseTableName> = DatabaseTables[TTable]["Row"];
export type TableInsert<TTable extends DatabaseTableName> =
  DatabaseTables[TTable]["Insert"];
export type TableUpdate<TTable extends DatabaseTableName> =
  DatabaseTables[TTable]["Update"];

export type DatabaseSchema = {
  public: {
    Tables: DatabaseTables;
  };
};
