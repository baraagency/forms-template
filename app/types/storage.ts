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
  created_at: Date;
  updated_at: Date;
};

export type FormSisuMappingInsert = {
  form: FormKind;
  field_name: string;
  sisu_field_name?: string | null;
  sisu_field_type?: string | null;
  custom?: boolean;
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
