import type {
  FUBAppointmentInput,
  FUBAppointmentInvitee,
  FUBAppointmentOutcome,
} from "@/app/types/fub";
import type { AppointmentMetFormState } from "@/app/forms/appointment-met/appointmentMetFormUtils";
import { APPT_OUTCOME_OPTIONS } from "@/app/forms/appointment-met/appointmentMetFormUtils";
import {
  buildAppointmentDateTimeIso,
  toFubAppointmentTypeId,
} from "@/app/forms/appointment-set/appointmentSetFormUtils";

/** Fallback outcome ids when live FUB outcomes are unavailable. */
export const APPOINTMENT_MET_FUB_OUTCOME_FALLBACK: FUBAppointmentOutcome[] =
  APPT_OUTCOME_OPTIONS.map((name, index) => ({
    id: index + 1,
    name,
  }));

function parsePositiveInteger(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function formatClientDisplayName(state: AppointmentMetFormState): string {
  return [state.clientFirstName, state.clientLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function resolveRescheduledAppointmentType(
  state: AppointmentMetFormState,
): string {
  const leadType = state.leadType.trim().toLowerCase();
  if (leadType === "seller") {
    return "Listing";
  }
  return "Buyer Consultation";
}

export function resolveFubAppointmentOutcomeId(
  outcomes: FUBAppointmentOutcome[],
  outcomeName: string,
): number | null {
  const normalized = outcomeName.trim().toLowerCase();
  const match = outcomes.find(
    (candidate) => candidate.name.trim().toLowerCase() === normalized,
  );
  if (!match) {
    return null;
  }
  const outcomeId = Number(match.id);
  return Number.isFinite(outcomeId) ? outcomeId : null;
}

export function buildFubRescheduledAppointmentPayload(
  state: AppointmentMetFormState,
): FUBAppointmentInput {
  const clientName = formatClientDisplayName(state);
  const appointmentType = resolveRescheduledAppointmentType(state);
  const invitees: FUBAppointmentInvitee[] = [];
  const personId = parsePositiveInteger(state.personId);
  const submittingAgentId = state.agentSubmitting || state.agentId;
  const userId = parsePositiveInteger(submittingAgentId);

  if (personId !== undefined) {
    invitees.push({
      personId,
      ...(clientName ? { name: clientName } : {}),
      ...(state.clientEmail.trim() ? { email: state.clientEmail.trim() } : {}),
    });
  }

  if (userId !== undefined) {
    invitees.push({ userId });
  }

  const typeId = toFubAppointmentTypeId(appointmentType);

  return {
    title: `${appointmentType} - ${clientName}`.trim(),
    start: buildAppointmentDateTimeIso(
      state.rescheduledDate,
      state.rescheduledStartTime,
    ),
    end: buildAppointmentDateTimeIso(
      state.rescheduledDate,
      state.rescheduledEndTime,
    ),
    description: "Rescheduled via Appointment Met form.",
    ...(typeId !== undefined ? { typeId } : {}),
    ...(invitees.length > 0 ? { invitees } : {}),
  };
}
