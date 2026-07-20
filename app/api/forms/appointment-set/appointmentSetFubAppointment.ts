import type { SubmissionWorkflowContext } from "@/app/api/_services/submissionWorkflow";
import {
  createLiveFubAppointment,
  getLiveFubAppointment,
  updateLiveFubAppointment,
} from "@/app/api/_services/fubLiveClient";
import { findLatestAppointmentIdByDealFubId } from "@/app/api/_services/formSubmissionQueries";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
import type { AppointmentSetFormState } from "@/app/forms/appointment-set/appointmentSetFormUtils";
import { buildFubAppointmentSetPayload } from "./buildFubAppointmentSetPayload";

function formatAppointmentId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

/**
 * Create (or update if a prior appointment-set id exists for the deal)
 * the Follow Up Boss appointment for Appointment Set.
 */
export async function runAppointmentSetFubAppointmentSideEffect(
  ctx: SubmissionWorkflowContext,
): Promise<void> {
  if (!isFubApiEnabled()) {
    ctx.steps.push({
      step: "fub_appointment",
      status: "skipped",
      message: "FUB_API_KEY is not configured.",
    });
    return;
  }

  const state = ctx.formState as unknown as AppointmentSetFormState;
  const payload = buildFubAppointmentSetPayload(state);

  let existingAppointmentId: string | null = null;
  if (ctx.dealId) {
    const prior = await findLatestAppointmentIdByDealFubId(ctx.dealId);
    if (!prior.error && prior.data) {
      existingAppointmentId = prior.data;
    }
  }

  if (existingAppointmentId) {
    const existing = await getLiveFubAppointment(existingAppointmentId);
    if (existing.data && !existing.error) {
      const updated = await updateLiveFubAppointment(
        existingAppointmentId,
        payload,
      );
      if (updated.error || !updated.data) {
        ctx.steps.push({
          step: "fub_appointment",
          status: "failed",
          message: updated.error ?? "Failed to update FUB appointment.",
        });
        if (updated.error) {
          ctx.warnings.push(updated.error);
        }
        return;
      }

      ctx.appointmentId =
        formatAppointmentId(updated.data.id) ?? existingAppointmentId;
      ctx.steps.push({
        step: "fub_appointment",
        status: "ok",
        data: { id: ctx.appointmentId, action: "update" },
      });
      return;
    }
  }

  const created = await createLiveFubAppointment(payload);
  if (created.error || !created.data) {
    ctx.steps.push({
      step: "fub_appointment",
      status: "failed",
      message: created.error ?? "Failed to create FUB appointment.",
    });
    if (created.error) {
      ctx.warnings.push(created.error);
    }
    return;
  }

  ctx.appointmentId = formatAppointmentId(created.data.id);
  ctx.steps.push({
    step: "fub_appointment",
    status: "ok",
    data: { id: ctx.appointmentId, action: "create" },
  });
}
