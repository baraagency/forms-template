import type {
  FUBAppointmentInput,
  FUBAppointmentInvitee,
} from "@/app/types/fub";
import type { AppointmentSetFormState } from "@/app/forms/appointment-set/appointmentSetFormUtils";
import {
  buildAppointmentDateTimeIso,
  formatClientDisplayName,
  isOsaApptSetBy,
  resolveAppointmentSetLocation,
  toFubAppointmentTypeId,
} from "@/app/forms/appointment-set/appointmentSetFormUtils";

function parsePositiveInteger(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function resolveInviteeUserId(state: AppointmentSetFormState): string {
  if (isOsaApptSetBy(state.apptSetBy) && state.assignedOsa.trim()) {
    return state.assignedOsa;
  }
  return state.agentId;
}

export function buildFubAppointmentSetPayload(
  state: AppointmentSetFormState,
): FUBAppointmentInput {
  const clientName = formatClientDisplayName(state);
  const invitees: FUBAppointmentInvitee[] = [];
  const personId = parsePositiveInteger(state.personId);

  if (personId !== undefined) {
    invitees.push({
      personId,
      ...(clientName ? { name: clientName } : {}),
      ...(state.clientEmail.trim() ? { email: state.clientEmail.trim() } : {}),
    });
  }

  const userId = parsePositiveInteger(resolveInviteeUserId(state));
  if (userId !== undefined) {
    invitees.push({ userId });
  }

  const createdById = parsePositiveInteger(state.agentId);
  const typeId = toFubAppointmentTypeId(state.appointmentType);
  const location = resolveAppointmentSetLocation(state);
  const description = state.notes.trim();

  return {
    title: `${state.appointmentType} - ${clientName}`.trim(),
    start: buildAppointmentDateTimeIso(
      state.appointmentDate,
      state.appointmentStartTime,
    ),
    end: buildAppointmentDateTimeIso(
      state.appointmentDate,
      state.appointmentEndTime,
    ),
    ...(location ? { location } : {}),
    ...(description ? { description } : {}),
    ...(typeId !== undefined ? { typeId } : {}),
    ...(createdById !== undefined ? { createdById } : {}),
    ...(invitees.length > 0 ? { invitees } : {}),
  };
}
