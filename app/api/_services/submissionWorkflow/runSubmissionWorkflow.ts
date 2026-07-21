import type {
  FormFubStage,
  FormFubTag,
  JsonValue,
} from "@/app/types/storage";
import type { FUBDeal, FUBPerson } from "@/app/types/fub";
import type { SISUCreateTransactionResponse } from "@/app/types/sisu";
import {
  FORM_SUBMIT_SIDE_EFFECT_TIMEOUT_MESSAGE,
  POST_SUBMISSION_SIDE_EFFECT_TIMEOUT_MS,
  isSubmissionDebugEnvironment,
} from "@/app/forms/_core/submissionUtils";
import { normalizeSettingsEnvironment } from "@/app/forms/_core/formIdentity";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
import { isSisuApiEnabled } from "@/app/api/_services/sisuApiMode";
import {
  createLiveFubDeal,
  createLiveFubNote,
  updateLiveFubDeal,
  updateLiveFubPerson,
} from "@/app/api/_services/fubLiveClient";
import { createOrUpdateLiveSisuTransaction } from "@/app/api/_services/sisuLiveClient";
import { sendSummaryEmail } from "@/app/api/_services/gmailSendService";
import {
  insertFormSubmission,
  updateFormSubmission,
} from "@/app/api/_services/formSubmissionQueries";
import {
  getGmailCredentialForEnvironment,
  listDealMappings,
  listEmailRecipients,
  listFubStages,
  listFubTags,
  listPersonMappings,
  listSisuMappings,
} from "@/app/api/_services/settingsQueries";
import { applyFubFieldMappings, applySisuFieldMappings } from "./applyFieldMappings";
import { applyResolvedSisuAgentId } from "./applyResolvedSisuAgentId";
import { buildFormSubmissionSummary } from "./buildFormSubmissionSummary";
import { resolveSisuAgentIdForFubAgentId } from "./resolveSisuAgentId";
import type {
  RunSubmissionWorkflowInput,
  RunSubmissionWorkflowResult,
  SubmissionSummaryEmailPayload,
  SubmissionWorkflowContext,
  SubmissionWorkflowHooks,
  WorkflowStepResult,
} from "./types";

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function resolveClientType(formState: Record<string, unknown>): string | null {
  for (const key of ["clientType", "leadType"]) {
    const value = formState[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function pickEnabledStage(
  stages: FormFubStage[],
  target: "person" | "deal",
  clientType: string | null,
): FormFubStage | null {
  const enabled = stages.filter(
    (stage) => stage.enabled && stage.target === target,
  );
  if (enabled.length === 0) {
    return null;
  }

  if (clientType) {
    const exact = enabled.find(
      (stage) =>
        stage.client_type &&
        stage.client_type.trim().toLowerCase() === clientType.toLowerCase(),
    );
    if (exact) {
      return exact;
    }
  }

  return (
    enabled.find((stage) => stage.client_type === null || stage.client_type === "") ??
    enabled[0] ??
    null
  );
}

function recordStep(
  steps: WorkflowStepResult[],
  step: WorkflowStepResult,
): void {
  steps.push(step);
}

function pushWarning(ctx: SubmissionWorkflowContext, message: string): void {
  if (message.trim()) {
    ctx.warnings.push(message.trim());
  }
}

async function runHook(
  hooks: SubmissionWorkflowHooks | undefined,
  name: keyof SubmissionWorkflowHooks,
  ctx: SubmissionWorkflowContext,
): Promise<void> {
  const hook = hooks?.[name];
  if (!hook) {
    return;
  }
  try {
    await hook(ctx);
  } catch (error) {
    pushWarning(
      ctx,
      `Hook ${name} failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

function budgetExhausted(deadlineMs: number): boolean {
  return Date.now() >= deadlineMs;
}

function extractDealId(deal: FUBDeal | null, fallback: number | null): number | null {
  if (deal) {
    const fromDeal = parsePositiveInteger(deal.id);
    if (fromDeal) {
      return fromDeal;
    }
  }
  return fallback;
}

function extractTransactionPayload(
  transaction: SISUCreateTransactionResponse | null,
  sisuTransactionId: number | null,
  personId: number,
  dealId: number | null,
): SISUCreateTransactionResponse | undefined {
  if (transaction) {
    return transaction;
  }
  if (!sisuTransactionId) {
    return undefined;
  }
  return {
    transaction_id: sisuTransactionId,
    client_id: sisuTransactionId,
    id: sisuTransactionId,
    fub_id: String(personId),
    ...(dealId ? { fub_deal_id: String(dealId) } : {}),
  };
}

/**
 * Shared hybrid submission orchestrator for all forms.
 *
 * Order: persist → note+email (parallel) → deal → person → SISU → patch.
 * Skips live calls when keys/settings are missing (no fake fixture ids).
 * Best-effort: continues after step failures.
 *
 * Form-specific extras (e.g. FUB appointment create) go in `hooks.extraSideEffects`.
 */
export async function runSubmissionWorkflow(
  input: RunSubmissionWorkflowInput,
): Promise<RunSubmissionWorkflowResult> {
  const deadlineMs = Date.now() + POST_SUBMISSION_SIDE_EFFECT_TIMEOUT_MS;
  let timeoutWarning: string | undefined;

  const personId = parsePositiveInteger(input.personId);
  if (!personId) {
    throw new Error("A valid FUB person id is required.");
  }

  const initialDealId = parsePositiveInteger(input.dealId);
  const initialSisuId = parsePositiveInteger(input.sisuTransactionId);
  const agentId =
    input.agentId === null || input.agentId === undefined
      ? null
      : String(input.agentId).trim() || null;

  const formState = { ...input.formState };
  const summary = buildFormSubmissionSummary({
    form: input.form,
    formLabel: input.formLabel,
    formState,
  });

  const ctx: SubmissionWorkflowContext = {
    form: input.form,
    formLabel: input.formLabel,
    formState,
    personId,
    dealId: initialDealId,
    sisuTransactionId: initialSisuId,
    agentId,
    submissionId: null,
    appointmentId: null,
    summarySubject: summary.subject,
    summaryBody: summary.body,
    dealPayload: {},
    personPayload: {},
    sisuPayload: {},
    note: null,
    deal: null,
    person: null,
    transaction: null,
    email: { sent: false, reason: "pending" },
    steps: [],
    warnings: [],
  };

  const environment = normalizeSettingsEnvironment();
  const clientType =
    (typeof input.leadType === "string" && input.leadType.trim()) ||
    resolveClientType(formState);

  // --- 1. Persist submission first ---
  const insertResult = await insertFormSubmission({
    form: input.form,
    lead_fub_id: personId,
    deal_fub_id: initialDealId,
    form_data: formState as JsonValue,
    lead_type: clientType,
    appointment_id: null,
    successful: null,
  });

  if (insertResult.error || !insertResult.data) {
    recordStep(ctx.steps, {
      step: "persist",
      status: "skipped",
      message: insertResult.error ?? "Database unavailable.",
    });
  } else {
    ctx.submissionId = insertResult.data.id;
    recordStep(ctx.steps, {
      step: "persist",
      status: "ok",
      data: { submissionId: insertResult.data.id },
    });
  }

  // Load settings (best-effort; empty when DB unavailable)
  const [
    recipientsResult,
    gmailResult,
    personMapsResult,
    dealMapsResult,
    sisuMapsResult,
    stagesResult,
    tagsResult,
  ] = await Promise.all([
    listEmailRecipients(environment, input.form),
    getGmailCredentialForEnvironment(environment),
    listPersonMappings(input.form),
    listDealMappings(input.form),
    listSisuMappings(input.form),
    listFubStages(input.form),
    listFubTags(input.form),
  ]);

  const recipients = (recipientsResult.data ?? []).filter((row) => row.active);
  const gmailCredential = gmailResult.data;
  const personMappings = personMapsResult.data ?? [];
  const dealMappings = dealMapsResult.data ?? [];
  const sisuMappings = sisuMapsResult.data ?? [];
  const stages = stagesResult.data ?? [];
  const tags = (tagsResult.data ?? []).filter((tag: FormFubTag) => tag.enabled);

  ctx.personPayload = applyFubFieldMappings(
    formState,
    personMappings,
  ) as Partial<FUBPerson>;
  ctx.dealPayload = applyFubFieldMappings(
    formState,
    dealMappings,
  ) as Partial<FUBDeal>;
  ctx.sisuPayload = applySisuFieldMappings(formState, sisuMappings);

  const personStage = pickEnabledStage(stages, "person", clientType);
  const dealStage = pickEnabledStage(stages, "deal", clientType);

  if (personStage) {
    if (personStage.stage_name?.trim()) {
      ctx.personPayload.stage = personStage.stage_name.trim();
    }
    ctx.personPayload.stageId = personStage.stage_id;
  }

  if (tags.length > 0) {
    ctx.personPayload.tags = tags.map((tag) => tag.tag);
  }

  if (dealStage) {
    ctx.dealPayload.stageId = dealStage.stage_id;
    if (dealStage.stage_name?.trim()) {
      ctx.dealPayload.stage = dealStage.stage_name.trim();
    }
  }

  ctx.dealPayload.personId = personId;
  if (!ctx.dealPayload.peopleIds) {
    ctx.dealPayload.peopleIds = [personId];
  }

  // Ensure SISU payload has FUB linkage when creating
  if (!ctx.sisuPayload.fub_id) {
    ctx.sisuPayload.fub_id = String(personId);
  }

  const markTimeout = () => {
    timeoutWarning = FORM_SUBMIT_SIDE_EFFECT_TIMEOUT_MESSAGE;
  };

  // --- 2. Note + email in parallel ---
  await runHook(input.hooks, "beforeNotifications", ctx);

  if (budgetExhausted(deadlineMs)) {
    markTimeout();
    ctx.email = {
      sent: false,
      reason: "timeout",
      message: FORM_SUBMIT_SIDE_EFFECT_TIMEOUT_MESSAGE,
    };
    recordStep(ctx.steps, {
      step: "notifications",
      status: "skipped",
      message: "Side-effect budget exhausted.",
    });
  } else {
    const notePromise = (async (): Promise<WorkflowStepResult> => {
      if (!isFubApiEnabled()) {
        return {
          step: "fub_note",
          status: "skipped",
          message: "FUB_API_KEY is not configured.",
        };
      }
      const result = await createLiveFubNote({
        personId,
        subject: ctx.summarySubject,
        body: ctx.summaryBody,
        isHtml: false,
      });
      if (result.error || !result.data) {
        return {
          step: "fub_note",
          status: "failed",
          message: result.error ?? "Failed to create FUB note.",
        };
      }
      ctx.note = result.data;
      return { step: "fub_note", status: "ok", data: { id: result.data.id } };
    })();

    const emailPromise = (async (): Promise<{
      step: WorkflowStepResult;
      email: SubmissionSummaryEmailPayload;
    }> => {
      if (recipients.length === 0) {
        const email: SubmissionSummaryEmailPayload = {
          sent: false,
          reason: "no_recipients",
          message: "No email recipients are configured for this form.",
        };
        return {
          step: {
            step: "summary_email",
            status: "skipped",
            message: email.message,
          },
          email,
        };
      }

      if (!gmailCredential?.active || !gmailCredential.refresh_token) {
        const email: SubmissionSummaryEmailPayload = {
          sent: false,
          reason: "gmail_not_connected",
          message: "Gmail is not connected for this environment.",
        };
        return {
          step: {
            step: "summary_email",
            status: "skipped",
            message: email.message,
          },
          email,
        };
      }

      const sendResult = await sendSummaryEmail({
        credential: gmailCredential,
        to: recipients.map((row) => row.email),
        subject: ctx.summarySubject,
        bodyText: ctx.summaryBody,
      });

      if (sendResult.sent) {
        return {
          step: {
            step: "summary_email",
            status: "ok",
            data: { messageId: sendResult.messageId },
          },
          email: {
            sent: true,
            messageId: sendResult.messageId,
          },
        };
      }

      return {
        step: {
          step: "summary_email",
          status: "failed",
          message: sendResult.message,
        },
        email: {
          sent: false,
          reason: sendResult.reason,
          message: sendResult.message,
        },
      };
    })();

    const [noteSettled, emailSettled] = await Promise.allSettled([
      notePromise,
      emailPromise,
    ]);

    if (noteSettled.status === "fulfilled") {
      recordStep(ctx.steps, noteSettled.value);
      if (noteSettled.value.status === "failed" && noteSettled.value.message) {
        pushWarning(ctx, noteSettled.value.message);
      }
    } else {
      recordStep(ctx.steps, {
        step: "fub_note",
        status: "failed",
        message:
          noteSettled.reason instanceof Error
            ? noteSettled.reason.message
            : "FUB note failed.",
      });
    }

    if (emailSettled.status === "fulfilled") {
      recordStep(ctx.steps, emailSettled.value.step);
      ctx.email = emailSettled.value.email;
      if (
        emailSettled.value.step.status === "failed" &&
        emailSettled.value.step.message
      ) {
        pushWarning(ctx, emailSettled.value.step.message);
      }
    } else {
      ctx.email = {
        sent: false,
        reason: "send_failed",
        message:
          emailSettled.reason instanceof Error
            ? emailSettled.reason.message
            : "Summary email failed.",
      };
      recordStep(ctx.steps, {
        step: "summary_email",
        status: "failed",
        message: ctx.email.message,
      });
    }
  }

  await runHook(input.hooks, "afterNotifications", ctx);

  // --- 3. Create/Update FUB Deal ---
  await runHook(input.hooks, "beforeDeal", ctx);

  if (budgetExhausted(deadlineMs)) {
    markTimeout();
    recordStep(ctx.steps, {
      step: "fub_deal",
      status: "skipped",
      message: "Side-effect budget exhausted.",
    });
  } else if (!isFubApiEnabled()) {
    recordStep(ctx.steps, {
      step: "fub_deal",
      status: "skipped",
      message: "FUB_API_KEY is not configured.",
    });
  } else {
    try {
      if (ctx.dealId) {
        const result = await updateLiveFubDeal(ctx.dealId, ctx.dealPayload);
        if (result.error || !result.data) {
          recordStep(ctx.steps, {
            step: "fub_deal",
            status: "failed",
            message: result.error ?? "Failed to update FUB deal.",
          });
          pushWarning(ctx, result.error ?? "Failed to update FUB deal.");
        } else {
          ctx.deal = result.data;
          ctx.dealId = extractDealId(result.data, ctx.dealId);
          recordStep(ctx.steps, {
            step: "fub_deal",
            status: "ok",
            data: { id: ctx.dealId, action: "update" },
          });
        }
      } else {
        const result = await createLiveFubDeal(ctx.dealPayload);
        if (result.error || !result.data) {
          recordStep(ctx.steps, {
            step: "fub_deal",
            status: "failed",
            message: result.error ?? "Failed to create FUB deal.",
          });
          pushWarning(ctx, result.error ?? "Failed to create FUB deal.");
        } else {
          ctx.deal = result.data;
          ctx.dealId = extractDealId(result.data, null);
          recordStep(ctx.steps, {
            step: "fub_deal",
            status: "ok",
            data: { id: ctx.dealId, action: "create" },
          });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "FUB deal step failed.";
      recordStep(ctx.steps, {
        step: "fub_deal",
        status: "failed",
        message,
      });
      pushWarning(ctx, message);
    }
  }

  await runHook(input.hooks, "afterDeal", ctx);

  // --- 4. Update FUB Person ---
  await runHook(input.hooks, "beforePerson", ctx);

  if (budgetExhausted(deadlineMs)) {
    markTimeout();
    recordStep(ctx.steps, {
      step: "fub_person",
      status: "skipped",
      message: "Side-effect budget exhausted.",
    });
  } else if (!isFubApiEnabled()) {
    recordStep(ctx.steps, {
      step: "fub_person",
      status: "skipped",
      message: "FUB_API_KEY is not configured.",
    });
  } else {
    try {
      const result = await updateLiveFubPerson(personId, ctx.personPayload);
      if (result.error || !result.data) {
        recordStep(ctx.steps, {
          step: "fub_person",
          status: "failed",
          message: result.error ?? "Failed to update FUB person.",
        });
        pushWarning(ctx, result.error ?? "Failed to update FUB person.");
      } else {
        ctx.person = result.data;
        recordStep(ctx.steps, {
          step: "fub_person",
          status: "ok",
          data: { id: personId },
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "FUB person step failed.";
      recordStep(ctx.steps, {
        step: "fub_person",
        status: "failed",
        message,
      });
      pushWarning(ctx, message);
    }
  }

  await runHook(input.hooks, "afterPerson", ctx);

  // --- 5. Create/Update SISU Transaction ---
  await runHook(input.hooks, "beforeSisu", ctx);

  const enabledSisuMappings = sisuMappings.filter(
    (mapping) => mapping.enabled && mapping.sisu_field_name?.trim(),
  );

  if (budgetExhausted(deadlineMs)) {
    markTimeout();
    recordStep(ctx.steps, {
      step: "sisu_transaction",
      status: "skipped",
      message: "Side-effect budget exhausted.",
    });
  } else if (!isSisuApiEnabled()) {
    recordStep(ctx.steps, {
      step: "sisu_transaction",
      status: "skipped",
      message: "SISU_API_KEY is not configured.",
    });
  } else if (enabledSisuMappings.length === 0) {
    recordStep(ctx.steps, {
      step: "sisu_transaction",
      status: "skipped",
      message: "No enabled SISU mappings configured.",
    });
  } else {
    try {
      if (ctx.dealId && !ctx.sisuPayload.fub_deal_id) {
        ctx.sisuPayload.fub_deal_id = String(ctx.dealId);
      }

      if (ctx.agentId) {
        const sisuAgentId = await resolveSisuAgentIdForFubAgentId(ctx.agentId);
        applyResolvedSisuAgentId(ctx.sisuPayload, sisuAgentId);
      }

      const result = await createOrUpdateLiveSisuTransaction(
        ctx.sisuPayload,
        ctx.sisuTransactionId ?? undefined,
      );

      if (result.error || !result.data) {
        recordStep(ctx.steps, {
          step: "sisu_transaction",
          status: "failed",
          message: result.error ?? "Failed to write SISU transaction.",
        });
        pushWarning(ctx, result.error ?? "Failed to write SISU transaction.");
      } else {
        ctx.transaction = result.data;
        const newId =
          parsePositiveInteger(result.data.client_id) ??
          parsePositiveInteger(result.data.transaction_id) ??
          parsePositiveInteger(result.data.id);
        if (newId) {
          ctx.sisuTransactionId = newId;
        }
        recordStep(ctx.steps, {
          step: "sisu_transaction",
          status: "ok",
          data: {
            id: ctx.sisuTransactionId,
            action: initialSisuId ? "update" : "create",
          },
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "SISU transaction step failed.";
      recordStep(ctx.steps, {
        step: "sisu_transaction",
        status: "failed",
        message,
      });
      pushWarning(ctx, message);
    }
  }

  await runHook(input.hooks, "afterSisu", ctx);

  // --- Form-specific extras (stub hook) ---
  if (!budgetExhausted(deadlineMs)) {
    await runHook(input.hooks, "extraSideEffects", ctx);
  } else {
    markTimeout();
  }

  // --- 6. Patch submission ---
  if (ctx.submissionId) {
    const patchResult = await updateFormSubmission(ctx.submissionId, {
      deal_fub_id: ctx.dealId,
      appointment_id: ctx.appointmentId,
      successful: true,
    });
    if (patchResult.error) {
      recordStep(ctx.steps, {
        step: "persist_patch",
        status: "failed",
        message: patchResult.error,
      });
      pushWarning(ctx, patchResult.error);
    } else {
      recordStep(ctx.steps, {
        step: "persist_patch",
        status: "ok",
      });
    }
  }

  const transaction = extractTransactionPayload(
    ctx.transaction,
    ctx.sisuTransactionId,
    personId,
    ctx.dealId,
  );

  const debugEnabled = isSubmissionDebugEnvironment(process.env.ENVIRONMENT);

  const result: RunSubmissionWorkflowResult = {
    formType: input.form,
    message: `${input.formLabel} workflow complete.`,
    email: ctx.email,
    steps: ctx.steps,
    ...(ctx.dealId ? { dealId: ctx.dealId } : {}),
    ...(ctx.appointmentId ? { appointmentId: ctx.appointmentId } : {}),
    ...(transaction ? { transaction } : {}),
    ...(ctx.warnings.length > 0 ? { warnings: ctx.warnings } : {}),
    ...(timeoutWarning ? { timeoutWarning } : {}),
    ...(ctx.submissionId ? { submissionId: ctx.submissionId } : {}),
    ...(debugEnabled
      ? {
          debug: {
            ...(ctx.dealId || ctx.deal
              ? { deal: { id: ctx.dealId ?? ctx.deal?.id } }
              : {}),
            ...(transaction ? { transaction } : {}),
            ...(ctx.appointmentId
              ? { appointment: { id: ctx.appointmentId } }
              : {}),
          },
        }
      : {}),
  };

  return result;
}
