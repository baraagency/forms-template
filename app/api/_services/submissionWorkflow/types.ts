import type { FormKind } from "@/app/types/storage";
import type { FUBDeal, FUBNote, FUBPerson } from "@/app/types/fub";
import type {
  SISUCreateTransactionRequest,
  SISUCreateTransactionResponse,
} from "@/app/types/sisu";
import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";

export type WorkflowStepStatus = "ok" | "skipped" | "failed";

export type WorkflowStepResult = {
  step: string;
  status: WorkflowStepStatus;
  message?: string;
  data?: unknown;
};

export type SubmissionSummaryEmailPayload = {
  sent: boolean;
  reason?: string;
  message?: string;
  messageId?: string;
};

export type SubmissionWorkflowContext = {
  form: SettingsFormKind;
  formLabel: string;
  formState: Record<string, unknown>;
  personId: number;
  dealId: number | null;
  sisuTransactionId: number | null;
  agentId: string | null;
  submissionId: number | null;
  appointmentId: string | null;
  summarySubject: string;
  summaryBody: string;
  summaryHtmlBody: string;
  dealPayload: Partial<FUBDeal>;
  personPayload: Partial<FUBPerson>;
  sisuPayload: SISUCreateTransactionRequest;
  note: FUBNote | null;
  deal: FUBDeal | null;
  person: FUBPerson | null;
  transaction: SISUCreateTransactionResponse | null;
  email: SubmissionSummaryEmailPayload;
  steps: WorkflowStepResult[];
  warnings: string[];
};

export type SubmissionWorkflowHooks = {
  beforeNotifications?: (
    ctx: SubmissionWorkflowContext,
  ) => void | Promise<void>;
  afterNotifications?: (
    ctx: SubmissionWorkflowContext,
  ) => void | Promise<void>;
  beforeDeal?: (ctx: SubmissionWorkflowContext) => void | Promise<void>;
  afterDeal?: (ctx: SubmissionWorkflowContext) => void | Promise<void>;
  beforePerson?: (ctx: SubmissionWorkflowContext) => void | Promise<void>;
  afterPerson?: (ctx: SubmissionWorkflowContext) => void | Promise<void>;
  beforeSisu?: (ctx: SubmissionWorkflowContext) => void | Promise<void>;
  afterSisu?: (ctx: SubmissionWorkflowContext) => void | Promise<void>;
  /**
   * Form-specific side effects (e.g. FUB appointment create for appointment-set).
   * Stubbed in the base pass — wire per-form later.
   */
  extraSideEffects?: (ctx: SubmissionWorkflowContext) => void | Promise<void>;
};

export type RunSubmissionWorkflowInput = {
  form: SettingsFormKind;
  formLabel: string;
  formState: Record<string, unknown>;
  personId: string | number;
  dealId?: string | number | null;
  sisuTransactionId?: string | number | null;
  agentId?: string | number | null;
  leadType?: string | null;
  hooks?: SubmissionWorkflowHooks;
};

export type RunSubmissionWorkflowResult = {
  formType: FormKind;
  message: string;
  dealId?: number;
  dealName?: string;
  appointmentId?: string;
  transaction?: SISUCreateTransactionResponse;
  email: SubmissionSummaryEmailPayload;
  steps: WorkflowStepResult[];
  warnings?: string[];
  timeoutWarning?: string;
  submissionId?: number;
  debug?: {
    deal?: { id?: number | string };
    transaction?: SISUCreateTransactionResponse;
    appointment?: { id?: string };
  };
};
