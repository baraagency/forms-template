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
  formatSisuDateValue,
  readSisuValue,
} from "../_core/sisuTransactionPrefill";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";
import { buildSubmittedAddress } from "../_core/submissionUtils";

export const APPOINTMENT_SET_SECTIONS = ["client", "appointment"] as const;

export type AppointmentSetSection = (typeof APPOINTMENT_SET_SECTIONS)[number];

export type AppointmentSetFormState = {
  personId: string;
  agentId: string;
  dealId: string;
  sisuTransactionId: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  leadType: string;
  apptSetBy: string;
  assignedIsa: string;
  assignedOsa: string;
  notes: string;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  appointmentLocation: string;
  streetAddress: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  appointmentType: string;
};

export type AppointmentSetFieldErrors = Partial<
  Record<keyof AppointmentSetFormState, string>
>;

export const APPOINTMENT_LOCATION_OPTIONS = [
  "Charleston Office",
  "Greenville Office",
  "Central Carolina Office",
  "Nexton Office",
  "West Ashley Office",
  "Operations Office",
  "Other Address",
  "Video Call",
  "Phone",
] as const;

export const APPOINTMENT_TYPE_OPTIONS = [
  "Buyer Consultation",
  "Listing",
] as const;

const FUB_APPOINTMENT_TYPE_IDS: Record<(typeof APPOINTMENT_TYPE_OPTIONS)[number], number> =
  {
    "Buyer Consultation": 1,
    Listing: 2,
  };

export function toFubAppointmentTypeId(appointmentType: string): number | undefined {
  const trimmedValue = appointmentType.trim();
  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue in FUB_APPOINTMENT_TYPE_IDS) {
    return FUB_APPOINTMENT_TYPE_IDS[trimmedValue as keyof typeof FUB_APPOINTMENT_TYPE_IDS];
  }

  const normalizedValue = trimmedValue.toLowerCase();
  for (const [label, typeId] of Object.entries(FUB_APPOINTMENT_TYPE_IDS)) {
    if (label.toLowerCase() === normalizedValue) {
      return typeId;
    }
  }

  return undefined;
}

export const APPT_SET_BY_OPTIONS = ["ISA", "OSA", "Admin"] as const;

export const LEAD_TYPE_OPTIONS = ["Buyer", "Seller"] as const;

export const APPOINTMENT_TIMEZONE = "America/New_York";
const DEFAULT_APPOINTMENT_DURATION_HOURS = 1;

const requiredFieldsBySection: Record<
  AppointmentSetSection,
  Array<keyof AppointmentSetFormState>
> = {
  client: [
    "clientFirstName",
    "clientLastName",
    "clientPhone",
    "clientEmail",
    "leadType",
  ],
  appointment: [
    "apptSetBy",
    "appointmentDate",
    "appointmentStartTime",
    "appointmentEndTime",
    "appointmentLocation",
    "appointmentType",
  ],
};

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

function normalizeApptSetBy(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (normalized === "ISA" || normalized === "OSA" || normalized === "ADMIN") {
    return normalized === "ADMIN" ? "Admin" : normalized;
  }
  return value.trim();
}

export function isIsaApptSetBy(value: string): boolean {
  return normalizeApptSetBy(value) === "ISA";
}

export function isOsaApptSetBy(value: string): boolean {
  return normalizeApptSetBy(value) === "OSA";
}

export function isOtherAddressLocation(value: string): boolean {
  return value.trim() === "Other Address";
}

export function resolveAppointmentSetLocation(
  state: AppointmentSetFormState,
): string {
  if (isOtherAddressLocation(state.appointmentLocation)) {
    return buildSubmittedAddress(
      state.streetAddress,
      state.addressLine2,
      state.city,
      state.state,
      state.postalCode,
    );
  }

  return state.appointmentLocation.trim();
}

export function resolveAppointmentSetSubmittingAgentId(
  state: AppointmentSetFormState,
): string {
  if (isIsaApptSetBy(state.apptSetBy) && state.assignedIsa.trim()) {
    return state.assignedIsa;
  }

  if (isOsaApptSetBy(state.apptSetBy) && state.assignedOsa.trim()) {
    return state.assignedOsa;
  }

  return state.agentId;
}

export function getInitialAppointmentSetFormState(values: {
  personId?: string;
  agentId?: string;
  clientName?: string;
  dealId?: string;
  sisuTransactionId?: string;
}): AppointmentSetFormState {
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
    apptSetBy: "",
    assignedIsa: "",
    assignedOsa: "",
    notes: "",
    appointmentDate: "",
    appointmentStartTime: "",
    appointmentEndTime: "",
    appointmentLocation: "",
    streetAddress: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    appointmentType: "",
  };
}

export function applyAppointmentSetPersonPrefill(
  current: AppointmentSetFormState,
  person: FUBPerson,
): AppointmentSetFormState {
  return {
    ...current,
    personId: String(person.id || current.personId),
    agentId: current.agentId || (person.assignedUserId ? String(person.assignedUserId) : ""),
    clientFirstName: current.clientFirstName || person.firstName || "",
    clientLastName: current.clientLastName || person.lastName || "",
    clientPhone:
      current.clientPhone || formatPhoneInput(getPrimaryContactValue(person.phones)),
    clientEmail:
      current.clientEmail || getPrimaryContactValue(person.emails) || person.email || "",
  };
}

export function applyAppointmentSetSisuTransactionPrefill(
  current: AppointmentSetFormState,
  transaction: SISUTransaction,
): AppointmentSetFormState {
  const transactionId = readSisuValue(transaction, ["transaction_id", "id"]);

  return {
    ...current,
    sisuTransactionId: current.sisuTransactionId || transactionId,
    agentId: current.agentId || readSisuValue(transaction, ["agent_id"]),
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
    appointmentDate:
      current.appointmentDate ||
      formatSisuDateValue(readSisuValue(transaction, ["appt_set_dt"])),
    assignedIsa:
      current.assignedIsa ||
      readSisuValue(transaction, ["appt_set_by_agent_id", "isa_id"]),
    notes: current.notes || readSisuValue(transaction, ["note"]),
  };
}

export function validateAppointmentSetSection(
  state: AppointmentSetFormState,
  section: AppointmentSetSection,
): AppointmentSetFieldErrors {
  const errors: AppointmentSetFieldErrors = {};

  for (const field of requiredFieldsBySection[section]) {
    if (!isPresent(state[field])) {
      errors[field] = "This field is required.";
    }
  }

  if (section === "client") {
    if (state.clientEmail && !isValidEmail(state.clientEmail)) {
      errors.clientEmail = "Enter a valid email address.";
    }
    if (state.clientPhone && !isValidPhone(state.clientPhone)) {
      errors.clientPhone = "Enter a valid phone number.";
    }
  }

  if (section === "appointment") {
    if (isIsaApptSetBy(state.apptSetBy) && !isPresent(state.assignedIsa)) {
      errors.assignedIsa = "Choose the assigned ISA.";
    }
    if (isOsaApptSetBy(state.apptSetBy) && !isPresent(state.assignedOsa)) {
      errors.assignedOsa = "Choose the assigned OSA.";
    }
    if (isOtherAddressLocation(state.appointmentLocation)) {
      if (!isPresent(state.streetAddress)) {
        errors.streetAddress = "This field is required.";
      }
      if (!isPresent(state.city)) {
        errors.city = "This field is required.";
      }
      if (!isPresent(state.state)) {
        errors.state = "This field is required.";
      }
      if (!isPresent(state.postalCode)) {
        errors.postalCode = "This field is required.";
      }
    }
  }

  return errors;
}

export function validateAppointmentSetForm(
  state: AppointmentSetFormState,
): AppointmentSetFieldErrors {
  return {
    ...validateAppointmentSetSection(state, "client"),
    ...validateAppointmentSetSection(state, "appointment"),
  };
}

export function applyAppointmentSetPreviousSubmissionPrefill(
  current: AppointmentSetFormState,
  formData: JsonValue | null | undefined,
): AppointmentSetFormState {
  if (typeof formData !== "object" || formData === null || Array.isArray(formData)) {
    return current;
  }

  const rawFormData = formData as Record<string, unknown>;
  const nextState = applyPreviousSubmissionFormData(current, formData);

  const legacyAppointmentTime =
    typeof rawFormData.appointmentTime === "string" ? rawFormData.appointmentTime : "";
  if (legacyAppointmentTime && !nextState.appointmentStartTime) {
    nextState.appointmentStartTime = legacyAppointmentTime;
  }
  if (legacyAppointmentTime && !nextState.appointmentEndTime) {
    nextState.appointmentEndTime = addHoursToFormTime(
      nextState.appointmentStartTime || legacyAppointmentTime,
      DEFAULT_APPOINTMENT_DURATION_HOURS,
    );
  }

  return nextState;
}

export function normalizeAppointmentSetPayload(
  payload: Record<string, unknown>,
): AppointmentSetFormState {
  const initialState = getInitialAppointmentSetFormState({});
  const normalizedState = { ...initialState };

  for (const field of Object.keys(initialState) as Array<keyof AppointmentSetFormState>) {
    const value = payload[field];
    normalizedState[field] = typeof value === "string" ? value : "";
  }

  const legacyAppointmentTime =
    typeof payload.appointmentTime === "string" ? payload.appointmentTime : "";
  if (legacyAppointmentTime && !normalizedState.appointmentStartTime) {
    normalizedState.appointmentStartTime = legacyAppointmentTime;
  }
  if (
    normalizedState.appointmentStartTime &&
    !normalizedState.appointmentEndTime &&
    legacyAppointmentTime
  ) {
    normalizedState.appointmentEndTime = addHoursToFormTime(
      normalizedState.appointmentStartTime,
      DEFAULT_APPOINTMENT_DURATION_HOURS,
    );
  }

  return normalizedState;
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

function getEasternOffsetMinutes(date: string): number {
  const probe = new Date(`${date}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APPOINTMENT_TIMEZONE,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(probe);
  const offsetPart = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT-5";
  const match = offsetPart.match(/GMT([+-]\d+)/);
  if (!match) {
    return -300;
  }
  return Number(match[1]) * 60;
}

export function buildAppointmentDateTimeIso(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const offsetMinutes = getEasternOffsetMinutes(date);
  const utcMs =
    Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60 * 1000;
  return new Date(utcMs).toISOString();
}

export function formatClientDisplayName(state: AppointmentSetFormState): string {
  return [state.clientFirstName, state.clientLastName].filter(Boolean).join(" ").trim();
}
