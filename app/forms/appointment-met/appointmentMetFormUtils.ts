import type { FUBPerson } from "@/app/types/fub";
import type { JsonValue } from "@/app/types/storage";
import type { SISUTransaction } from "@/app/types/sisu";
import {
  formatPhoneInput,
  getPrimaryContactValue,
  isValidEmail,
  isValidPhone,
  splitPersonName,
} from "../_core/formatUtils";
import {
  formDateOnOrBeforeTodayError,
  isFormDateOnOrBeforeToday,
} from "../_core/formDateValidation";
import {
  formatSisuDateValue,
  readSisuValue,
} from "../_core/sisuTransactionPrefill";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";

export const APPT_DISPOSITION_OPTIONS = [
  "Met with Customer",
  "Customer Cancelled",
  "Rescheduled",
  "Customer No Show",
] as const;

export const APPT_OUTCOME_OPTIONS = [
  "Thinking it Over",
  "Interviewing Other Brokerages",
  "Needs 2nd Appointment",
  "Signed Buyer Agency",
  "Listing Obtained",
] as const;

export const MET_NEXT_STEP_OPTIONS = [
  "Create Follow Up Task",
  "Set Up Additional Appointment",
  "Send to Lender",
  "Set Up MLS Search",
  "Schedule Showings",
  "Start Paperwork",
  "Other",
] as const;

export const CANCELLED_NEXT_STEP_OPTIONS = [
  "Create Follow Up Task",
  "Attempt Another Appointment",
  "Throw Back to the Pond",
  "Throw Back to ISA",
  "Other",
] as const;

export const LEAD_TYPE_OPTIONS = ["Buyer", "Seller"] as const;

export const APPOINTMENT_MET_SISU_CUSTOM_FIELDS = {
  appointmentMetDate: "appt_dt",
  apptOutcome: "appt_outcome",
  rescheduledDate: "rescheduled_appointment_date",
} as const;

export type AppointmentMetFormState = {
  personId: string;
  agentId: string;
  dealId: string;
  sisuTransactionId: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  leadType: string;
  agentSubmitting: string;
  apptDisposition: string;
  appointmentMetDate: string;
  apptOutcome: string;
  nextStep: string;
  notes: string;
  cancelledNextStep: string;
  followUpNotes: string;
  rescheduledDate: string;
  rescheduledStartTime: string;
  rescheduledEndTime: string;
};

export type AppointmentMetFieldErrors = Partial<
  Record<keyof AppointmentMetFormState, string>
>;

function isPresent(value: string): boolean {
  return value.trim().length > 0;
}

function toStringValue(value: unknown): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const stringValue = toStringValue(item);
      if (stringValue) {
        return stringValue;
      }
    }
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
}

function readCustom(transaction: SISUTransaction, keys: string[]): string {
  const custom = transaction.custom ?? {};
  for (const key of keys) {
    const value = custom[key];
    const stringValue = toStringValue(value);
    if (stringValue) {
      return stringValue;
    }
  }
  return "";
}

function deriveLeadTypeFromSisu(transaction: SISUTransaction): string {
  const typeId = readSisuValue(transaction, ["type_id"]).trim().toLowerCase();
  if (typeId === "b" || typeId === "0") {
    return "Buyer";
  }
  if (typeId === "s" || typeId === "1") {
    return "Seller";
  }

  return (
    readCustom(transaction, ["client_type", "lead_type"]) ||
    readSisuValue(transaction, ["client_type", "pipeline", "pipeline_name", "type"])
  );
}

function fromSisuApptOutcomeValue(value: unknown): string {
  const trimmedValue = toStringValue(value);
  if (!trimmedValue) {
    return "";
  }

  const normalized = trimmedValue.toLowerCase();
  for (const option of APPT_OUTCOME_OPTIONS) {
    if (option.toLowerCase() === normalized) {
      return option;
    }
  }

  const SISU_APPT_OUTCOME_KEYS: Record<string, (typeof APPT_OUTCOME_OPTIONS)[number]> = {
    "0": "Thinking it Over",
    "1": "Interviewing Other Brokerages",
    "2": "Needs 2nd Appointment",
    "3": "Signed Buyer Agency",
    "4": "Listing Obtained",
  };

  return SISU_APPT_OUTCOME_KEYS[trimmedValue] ?? trimmedValue;
}

export function addHoursToFormTime(time: string, hours: number): string {
  if (!time.trim()) {
    return "";
  }

  const [hourPart, minutePart] = time.split(":").map(Number);
  if (!Number.isFinite(hourPart) || !Number.isFinite(minutePart)) {
    return "";
  }

  const totalMinutes = hourPart * 60 + minutePart + hours * 60;
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const normalizedHours = Math.floor(normalizedMinutes / 60);
  const normalizedMinute = normalizedMinutes % 60;

  return `${String(normalizedHours).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`;
}

export function isMetDisposition(value: string): boolean {
  return value.trim() === "Met with Customer";
}

export function isCancelledDisposition(value: string): boolean {
  const normalized = value.trim();
  return normalized === "Customer Cancelled" || normalized === "Customer No Show";
}

export function isRescheduledDisposition(value: string): boolean {
  return value.trim() === "Rescheduled";
}

export function getInitialAppointmentMetFormState(values: {
  personId?: string;
  agentId?: string;
  clientName?: string;
  dealId?: string;
  sisuTransactionId?: string;
}): AppointmentMetFormState {
  const splitName = splitPersonName(values.clientName ?? "");

  return {
    personId: values.personId ?? "",
    agentId: values.agentId ?? "",
    dealId: values.dealId ?? "",
    sisuTransactionId: values.sisuTransactionId ?? "",
    clientFirstName: splitName.firstName,
    clientLastName: splitName.lastName,
    clientPhone: "",
    clientEmail: "",
    leadType: "",
    agentSubmitting: "",
    apptDisposition: "",
    appointmentMetDate: "",
    apptOutcome: "",
    nextStep: "",
    notes: "",
    cancelledNextStep: "",
    followUpNotes: "",
    rescheduledDate: "",
    rescheduledStartTime: "",
    rescheduledEndTime: "",
  };
}

export const APPOINTMENT_MET_DATE_MAX_ERROR = formDateOnOrBeforeTodayError(
  "Appointment Met Date",
);

export function clearDispositionDependentFields(
  state: AppointmentMetFormState,
): AppointmentMetFormState {
  const nextState = { ...state };

  if (!isMetDisposition(state.apptDisposition)) {
    nextState.appointmentMetDate = "";
    nextState.apptOutcome = "";
    nextState.nextStep = "";
    nextState.notes = "";
  }

  if (!isCancelledDisposition(state.apptDisposition)) {
    nextState.cancelledNextStep = "";
    nextState.followUpNotes = "";
  }

  if (!isRescheduledDisposition(state.apptDisposition)) {
    nextState.rescheduledDate = "";
    nextState.rescheduledStartTime = "";
    nextState.rescheduledEndTime = "";
  }

  return nextState;
}

export function applyAppointmentMetDispositionFieldClearing(
  current: AppointmentMetFormState,
  field: keyof AppointmentMetFormState,
  value: string,
): AppointmentMetFormState {
  const nextState = { ...current, [field]: value };

  if (field === "apptDisposition") {
    return clearDispositionDependentFields(nextState);
  }

  if (field === "cancelledNextStep" && value !== "Other") {
    nextState.followUpNotes = "";
  }

  if (field === "rescheduledStartTime" && value) {
    nextState.rescheduledEndTime = addHoursToFormTime(value, 1);
  }

  return nextState;
}

export function applyAppointmentMetPersonPrefill(
  current: AppointmentMetFormState,
  person: FUBPerson,
): AppointmentMetFormState {
  const assignedAgentId = person.assignedUserId ? String(person.assignedUserId) : "";

  return {
    ...current,
    personId: String(person.id || current.personId),
    agentId: current.agentId || assignedAgentId,
    agentSubmitting: current.agentSubmitting || assignedAgentId || current.agentId,
    clientFirstName: current.clientFirstName || person.firstName || "",
    clientLastName: current.clientLastName || person.lastName || "",
    clientPhone:
      current.clientPhone || formatPhoneInput(getPrimaryContactValue(person.phones)),
    clientEmail:
      current.clientEmail || getPrimaryContactValue(person.emails) || person.email || "",
  };
}

export function applyAppointmentMetSisuTransactionPrefill(
  current: AppointmentMetFormState,
  transaction: SISUTransaction,
): AppointmentMetFormState {
  const transactionId = readSisuValue(transaction, ["transaction_id", "id"]);
  const agentId = readSisuValue(transaction, ["agent_id"]);

  return {
    ...current,
    sisuTransactionId: current.sisuTransactionId || transactionId,
    agentId: current.agentId || agentId,
    agentSubmitting: current.agentSubmitting || current.agentId || agentId,
    clientFirstName:
      current.clientFirstName || readSisuValue(transaction, ["first_name"]),
    clientLastName:
      current.clientLastName || readSisuValue(transaction, ["last_name"]),
    clientPhone:
      current.clientPhone ||
      formatPhoneInput(readSisuValue(transaction, ["mobile_phone"])),
    clientEmail: current.clientEmail || readSisuValue(transaction, ["email"]),
    personId: current.personId || readSisuValue(transaction, ["fub_id"]),
    dealId: current.dealId || readSisuValue(transaction, ["fub_deal_id"]),
    leadType: current.leadType || deriveLeadTypeFromSisu(transaction),
    appointmentMetDate:
      current.appointmentMetDate ||
      formatSisuDateValue(
        readSisuValue(transaction, [APPOINTMENT_MET_SISU_CUSTOM_FIELDS.appointmentMetDate]),
      ),
    apptOutcome:
      current.apptOutcome ||
      fromSisuApptOutcomeValue(
        readCustom(transaction, [APPOINTMENT_MET_SISU_CUSTOM_FIELDS.apptOutcome]),
      ),
    rescheduledDate:
      current.rescheduledDate ||
      formatSisuDateValue(
        readSisuValue(transaction, [APPOINTMENT_MET_SISU_CUSTOM_FIELDS.rescheduledDate]),
      ),
    notes: current.notes || readSisuValue(transaction, ["note"]),
  };
}

export function applyAppointmentMetPreviousSubmissionPrefill(
  current: AppointmentMetFormState,
  formData: JsonValue | null | undefined,
): AppointmentMetFormState {
  if (typeof formData !== "object" || formData === null || Array.isArray(formData)) {
    return current;
  }

  return applyPreviousSubmissionFormData(current, formData);
}

export function validateAppointmentMetForm(
  state: AppointmentMetFormState,
): AppointmentMetFieldErrors {
  const errors: AppointmentMetFieldErrors = {};

  if (!isPresent(state.clientFirstName)) {
    errors.clientFirstName = "This field is required.";
  }
  if (!isPresent(state.clientLastName)) {
    errors.clientLastName = "This field is required.";
  }
  if (!isPresent(state.clientPhone)) {
    errors.clientPhone = "This field is required.";
  }
  if (!isPresent(state.clientEmail)) {
    errors.clientEmail = "This field is required.";
  }
  if (state.clientEmail && !isValidEmail(state.clientEmail)) {
    errors.clientEmail = "Enter a valid email address.";
  }
  if (state.clientPhone && !isValidPhone(state.clientPhone)) {
    errors.clientPhone = "Enter a valid phone number.";
  }
  if (!isPresent(state.leadType)) {
    errors.leadType = "This field is required.";
  }
  if (!isPresent(state.apptDisposition)) {
    errors.apptDisposition = "This field is required.";
  }

  if (isMetDisposition(state.apptDisposition)) {
    if (!isPresent(state.appointmentMetDate)) {
      errors.appointmentMetDate = "This field is required.";
    } else if (!isFormDateOnOrBeforeToday(state.appointmentMetDate)) {
      errors.appointmentMetDate = APPOINTMENT_MET_DATE_MAX_ERROR;
    }
    if (!isPresent(state.apptOutcome)) {
      errors.apptOutcome = "This field is required.";
    }
    if (!isPresent(state.nextStep)) {
      errors.nextStep = "This field is required.";
    }
  }

  if (isCancelledDisposition(state.apptDisposition)) {
    if (!isPresent(state.cancelledNextStep)) {
      errors.cancelledNextStep = "This field is required.";
    }
    if (state.cancelledNextStep === "Other" && !isPresent(state.followUpNotes)) {
      errors.followUpNotes = "This field is required.";
    }
  }

  if (isRescheduledDisposition(state.apptDisposition)) {
    if (!isPresent(state.rescheduledDate)) {
      errors.rescheduledDate = "This field is required.";
    }
    if (!isPresent(state.rescheduledStartTime)) {
      errors.rescheduledStartTime = "This field is required.";
    }
    if (!isPresent(state.rescheduledEndTime)) {
      errors.rescheduledEndTime = "This field is required.";
    }
  }

  return errors;
}

export function normalizeAppointmentMetPayload(
  payload: Record<string, unknown>,
): AppointmentMetFormState {
  const initialState = getInitialAppointmentMetFormState({});
  const normalizedState = { ...initialState };

  for (const field of Object.keys(initialState) as Array<keyof AppointmentMetFormState>) {
    const value = payload[field];
    normalizedState[field] = typeof value === "string" ? value : "";
  }

  const legacyRescheduledTime =
    typeof payload.rescheduledTime === "string" ? payload.rescheduledTime : "";
  if (legacyRescheduledTime && !normalizedState.rescheduledStartTime) {
    normalizedState.rescheduledStartTime = legacyRescheduledTime;
  }
  if (normalizedState.rescheduledStartTime && !normalizedState.rescheduledEndTime) {
    normalizedState.rescheduledEndTime = addHoursToFormTime(
      normalizedState.rescheduledStartTime,
      1,
    );
  }

  return normalizedState;
}
