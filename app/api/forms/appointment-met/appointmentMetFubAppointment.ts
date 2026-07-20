import type { SubmissionWorkflowContext } from "@/app/api/_services/submissionWorkflow";
import {
  createLiveFubAppointment,
  fetchLiveFubAppointmentOutcomes,
  getLiveFubAppointment,
  updateLiveFubAppointment,
  updateLiveFubAppointmentOutcome,
} from "@/app/api/_services/fubLiveClient";
import { findLatestAppointmentIdByDealFubId } from "@/app/api/_services/formSubmissionQueries";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
import type { AppointmentMetFormState } from "@/app/forms/appointment-met/appointmentMetFormUtils";
import {
  isMetDisposition,
  isRescheduledDisposition,
} from "@/app/forms/appointment-met/appointmentMetFormUtils";
import {
  APPOINTMENT_MET_FUB_OUTCOME_FALLBACK,
  buildFubRescheduledAppointmentPayload,
  resolveFubAppointmentOutcomeId,
} from "./buildFubAppointmentMetPayload";

function formatAppointmentId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

async function resolveLinkedAppointmentId(
  ctx: SubmissionWorkflowContext,
): Promise<string | null> {
  if (ctx.appointmentId) {
    return ctx.appointmentId;
  }

  if (!ctx.dealId) {
    return null;
  }

  const prior = await findLatestAppointmentIdByDealFubId(ctx.dealId);
  if (prior.error || !prior.data) {
    return null;
  }
  return prior.data;
}

/**
 * Appointment Met FUB appointment side effects:
 * - Met with Customer → update outcome on linked appointment
 * - Rescheduled → update (or create) appointment with new schedule
 * - Cancelled / No Show → no appointment write
 */
export async function runAppointmentMetFubAppointmentSideEffect(
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

  const state = ctx.formState as unknown as AppointmentMetFormState;

  if (
    !isMetDisposition(state.apptDisposition) &&
    !isRescheduledDisposition(state.apptDisposition)
  ) {
    ctx.steps.push({
      step: "fub_appointment",
      status: "skipped",
      message: `No FUB appointment update for disposition: ${state.apptDisposition || "(empty)"}`,
    });
    return;
  }

  const linkedAppointmentId = await resolveLinkedAppointmentId(ctx);

  if (isRescheduledDisposition(state.apptDisposition)) {
    const payload = buildFubRescheduledAppointmentPayload(state);

    if (linkedAppointmentId) {
      const existing = await getLiveFubAppointment(linkedAppointmentId);
      if (existing.data && !existing.error) {
        const updated = await updateLiveFubAppointment(
          linkedAppointmentId,
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
          formatAppointmentId(updated.data.id) ?? linkedAppointmentId;
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
        message: created.error ?? "Failed to create rescheduled FUB appointment.",
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
    return;
  }

  // Met with Customer → outcome update
  if (!linkedAppointmentId) {
    ctx.steps.push({
      step: "fub_appointment",
      status: "failed",
      message:
        "Unable to find the linked Follow Up Boss appointment for outcome update.",
    });
    ctx.warnings.push(
      "Unable to find the linked Follow Up Boss appointment for outcome update.",
    );
    return;
  }

  const liveOutcomes = await fetchLiveFubAppointmentOutcomes();
  const outcomes =
    liveOutcomes.data && liveOutcomes.data.length > 0
      ? liveOutcomes.data
      : APPOINTMENT_MET_FUB_OUTCOME_FALLBACK;

  const outcomeId = resolveFubAppointmentOutcomeId(
    outcomes,
    state.apptOutcome,
  );

  if (outcomeId === null) {
    const message = `FUB appointment outcome not found: ${state.apptOutcome}`;
    ctx.steps.push({
      step: "fub_appointment",
      status: "failed",
      message,
    });
    ctx.warnings.push(message);
    return;
  }

  const updated = await updateLiveFubAppointmentOutcome(
    linkedAppointmentId,
    outcomeId,
  );

  if (updated.error || !updated.data) {
    ctx.steps.push({
      step: "fub_appointment",
      status: "failed",
      message: updated.error ?? "Failed to update FUB appointment outcome.",
    });
    if (updated.error) {
      ctx.warnings.push(updated.error);
    }
    return;
  }

  ctx.appointmentId =
    formatAppointmentId(updated.data.id) ?? linkedAppointmentId;
  ctx.steps.push({
    step: "fub_appointment",
    status: "ok",
    data: { id: ctx.appointmentId, action: "update_outcome", outcomeId },
  });
}
