export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue | undefined }
  | JsonValue[];

export type EmailAnswer = "Yes" | "No";
export type FormEmailRecipientFormType =
  | "agreementSigned"
  | "pending"
  | "closed"
  | "appointmentSet"
  | "appointmentMet";
export type FormEmailDynamicRecipientFieldKey =
  | "pendingIsa"
  | "pendingOtherAgent"
  | "pendingClosingAttorney"
  | "pendingMortgageCompany";

export type AgreementSignedSubmission = {
  id: number;
  created_at: Date;
  lead_fub_id: number | null;
  deal_fub_id: number | null;
  form_data: JsonValue | null;
  successful: boolean | null;
};

export type AgreementSignedSubmissionInsert = {
  created_at?: Date | string;
  lead_fub_id?: number | null;
  deal_fub_id?: number | null;
  form_data?: JsonValue | null;
  successful?: boolean | null;
};

export type ClosedFormSubmission = {
  id: number;
  created_at: Date;
  lead_fub_id: number | null;
  deal_fub_id: number | null;
  form_data: JsonValue | null;
  lead_type: string | null;
  successful: boolean | null;
};

export type ClosedFormSubmissionInsert = {
  created_at?: Date | string;
  lead_fub_id?: number | null;
  deal_fub_id?: number | null;
  form_data?: JsonValue | null;
  lead_type?: string | null;
  successful?: boolean | null;
};

export type LowGciData = {
  agent_name: string | null;
  agent_email: string | null;
  address: string | null;
  gci: number | null;
  asana_url: string | null;
  email_responded: boolean;
  email_answer: EmailAnswer | null;
  id: number;
  asana_id: string;
};

export type LowGciDataInsert = {
  id: number;
  asana_id: string;
  agent_name?: string | null;
  agent_email?: string | null;
  address?: string | null;
  gci?: number | null;
  asana_url?: string | null;
  email_responded?: boolean;
  email_answer?: EmailAnswer | null;
};

export type LowGciEmailLog = {
  id: number;
  email: string | null;
  asana_id: string | null;
  response: boolean | null;
};

export type LowGciEmailLogInsert = {
  email?: string | null;
  asana_id?: string | null;
  response?: boolean | null;
};

export type LowGciMissedAgent = {
  id: number;
  address: string | null;
  agent_name: string | null;
  asana_id: string | null;
  gci: string | null;
  asana_url: string | null;
};

export type LowGciMissedAgentInsert = {
  address?: string | null;
  agent_name?: string | null;
  asana_id?: string | null;
  gci?: string | null;
  asana_url?: string | null;
};

export type LowGciAsanaProject = {
  id: number;
  created_at: Date;
  asana_project_gid: string;
  name: string | null;
  active: boolean;
};

export type LowGciAsanaProjectInsert = {
  created_at?: Date | string;
  asana_project_gid: string;
  name?: string | null;
  active?: boolean;
};

export type PendingFormSubmission = {
  id: number;
  created_at: Date;
  lead_fub_id: number | null;
  deal_fub_id: number | null;
  form_data: JsonValue | null;
  lead_type: string | null;
  stage: string | null;
  successful: boolean | null;
};

export type PendingFormSubmissionInsert = {
  created_at?: Date | string;
  lead_fub_id?: number | null;
  deal_fub_id?: number | null;
  form_data?: JsonValue | null;
  lead_type?: string | null;
  stage?: string | null;
  successful?: boolean | null;
};

export type AppointmentSetSubmission = {
  id: number;
  created_at: Date;
  lead_fub_id: number | null;
  deal_fub_id: number | null;
  appointment_id: string | null;
  form_data: JsonValue | null;
  lead_type: string | null;
  stage: string | null;
  successful: boolean | null;
};

export type AppointmentSetSubmissionInsert = {
  created_at?: Date | string;
  lead_fub_id?: number | null;
  deal_fub_id?: number | null;
  appointment_id?: string | null;
  form_data?: JsonValue | null;
  lead_type?: string | null;
  stage?: string | null;
  successful?: boolean | null;
};

export type AppointmentMetSubmission = {
  id: number;
  created_at: Date;
  lead_fub_id: number | null;
  deal_fub_id: number | null;
  form_data: JsonValue | null;
  lead_type: string | null;
  stage: string | null;
  successful: boolean | null;
};

export type AppointmentMetSubmissionInsert = {
  created_at?: Date | string;
  lead_fub_id?: number | null;
  deal_fub_id?: number | null;
  form_data?: JsonValue | null;
  lead_type?: string | null;
  stage?: string | null;
  successful?: boolean | null;
};

export type FormEmailRecipient = {
  id: number;
  created_at: Date;
  name: string | null;
  email: string;
  form_type: FormEmailRecipientFormType;
  form_types: FormEmailRecipientFormType[];
  active: boolean;
};

export type FormEmailRecipientInsert = {
  created_at?: Date | string;
  name?: string | null;
  email: string;
  form_type: FormEmailRecipientFormType;
  form_types?: FormEmailRecipientFormType[];
  active?: boolean;
};

export type FormEmailDynamicRecipient = {
  id: number;
  created_at: Date;
  form_type: FormEmailRecipientFormType;
  field_key: FormEmailDynamicRecipientFieldKey;
  active: boolean;
};

export type FormEmailDynamicRecipientInsert = {
  created_at?: Date | string;
  form_type: FormEmailRecipientFormType;
  field_key: FormEmailDynamicRecipientFieldKey;
  active?: boolean;
};

export type GmailAccountCredential = {
  id: number;
  created_at: Date;
  updated_at: Date;
  email: string;
  refresh_token: string;
  access_token: string | null;
  expiry_date: Date | null;
  active: boolean;
};

export type GmailAccountCredentialInsert = {
  created_at?: Date | string;
  updated_at?: Date | string;
  email: string;
  refresh_token: string;
  access_token?: string | null;
  expiry_date?: Date | string | null;
  active?: boolean;
};

export type DatabaseTables = {
  agreement_signed_submissions: {
    Row: AgreementSignedSubmission;
    Insert: AgreementSignedSubmissionInsert;
    Update: Partial<AgreementSignedSubmissionInsert>;
  };
  closed_form_submissions: {
    Row: ClosedFormSubmission;
    Insert: ClosedFormSubmissionInsert;
    Update: Partial<ClosedFormSubmissionInsert>;
  };
  low_gci_data: {
    Row: LowGciData;
    Insert: LowGciDataInsert;
    Update: Partial<LowGciDataInsert>;
  };
  low_gci_email_log: {
    Row: LowGciEmailLog;
    Insert: LowGciEmailLogInsert;
    Update: Partial<LowGciEmailLogInsert>;
  };
  low_gci_missed_agents: {
    Row: LowGciMissedAgent;
    Insert: LowGciMissedAgentInsert;
    Update: Partial<LowGciMissedAgentInsert>;
  };
  low_gci_asana_projects: {
    Row: LowGciAsanaProject;
    Insert: LowGciAsanaProjectInsert;
    Update: Partial<LowGciAsanaProjectInsert>;
  };
  pending_form_submissions: {
    Row: PendingFormSubmission;
    Insert: PendingFormSubmissionInsert;
    Update: Partial<PendingFormSubmissionInsert>;
  };
  appointment_set_submissions: {
    Row: AppointmentSetSubmission;
    Insert: AppointmentSetSubmissionInsert;
    Update: Partial<AppointmentSetSubmissionInsert>;
  };
  appointment_met_submissions: {
    Row: AppointmentMetSubmission;
    Insert: AppointmentMetSubmissionInsert;
    Update: Partial<AppointmentMetSubmissionInsert>;
  };
  form_email_recipients: {
    Row: FormEmailRecipient;
    Insert: FormEmailRecipientInsert;
    Update: Partial<FormEmailRecipientInsert>;
  };
  form_email_dynamic_recipients: {
    Row: FormEmailDynamicRecipient;
    Insert: FormEmailDynamicRecipientInsert;
    Update: Partial<FormEmailDynamicRecipientInsert>;
  };
  gmail_account_credentials: {
    Row: GmailAccountCredential;
    Insert: GmailAccountCredentialInsert;
    Update: Partial<GmailAccountCredentialInsert>;
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
    Enums: {
      email_answer_enum_60e94e0c: EmailAnswer;
    };
  };
};
