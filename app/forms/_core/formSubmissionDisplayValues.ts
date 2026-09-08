import type { SettingsFormKind } from "./formIdentity";
import {
  formatCurrencyInput,
  formatFormDateDisplayValue,
  formatPercentageInput,
  formatPhoneInput,
} from "./formatUtils";
import { formatFormTimeDisplayValue } from "./formTimePickerField";
import {
  APPOINTMENT_LOCATION_OPTIONS,
  APPT_SET_BY_OPTIONS,
  DEFAULT_APPOINTMENT_TYPE_OPTIONS,
  LEAD_TYPE_OPTIONS as APPOINTMENT_SET_LEAD_TYPE_OPTIONS,
  resolveAppointmentTypeName,
} from "../appointment-set/appointmentSetFormUtils";
import {
  APPT_DISPOSITION_OPTIONS,
  APPT_OUTCOME_OPTIONS,
  CANCELLED_NEXT_STEP_OPTIONS,
  LEAD_TYPE_OPTIONS as APPOINTMENT_MET_LEAD_TYPE_OPTIONS,
  MET_NEXT_STEP_OPTIONS,
} from "../appointment-met/appointmentMetFormUtils";
import {
  getPendingSelectOptions,
  type PendingSelectOptions,
} from "../pending/pendingTeamFieldOptions";
import {
  getClosedSelectOptions,
  resolveTransactionTypeOption,
  type ClosedSelectOptions,
} from "../closed/closedTeamFieldOptions";
import type { TeamFieldSelectOption } from "./teamFieldOptions";

export type FormSubmissionDisplayContext = {
  pendingOptions: PendingSelectOptions;
  closedOptions: ClosedSelectOptions;
  fubUserLabels: ReadonlyMap<string, string>;
  sisuIsaLabels: ReadonlyMap<string, string>;
  appointmentTypeLabels: ReadonlyMap<string, string>;
  mortgageCompanyLabels: ReadonlyMap<string, string>;
  attorneyLabels: ReadonlyMap<string, string>;
};

const PHONE_FIELDS = new Set([
  "clientPhone",
  "secondaryContactPhone",
  "otherAgentPhone",
  "closingAttorneyPhone",
]);

const DATE_FIELDS = new Set([
  "underContractDate",
  "forecastedClosedDate",
  "dueDiligenceDeadline",
  "appointmentDate",
  "appointmentMetDate",
  "rescheduledDate",
  "settlementDate",
  "signedDate",
  "closedDate",
  "fundedDate",
  "listingDate",
  "expirationDate",
]);

const TIME_FIELDS = new Set([
  "appointmentStartTime",
  "appointmentEndTime",
  "rescheduledStartTime",
  "rescheduledEndTime",
]);

const CURRENCY_FIELDS = new Set([
  "transactionAmount",
  "referralAmount",
  "grossCommissionTotal",
  "securityDeposit",
  "monthlyRent",
  "totalCommissionGci",
]);

const PERCENTAGE_FIELDS = new Set([
  "referralPercent",
  "sellerCompensationPercent",
  "agent2Percent",
]);

const YES_NO_FIELDS = new Set([
  "hasSecondaryClient",
  "jcreLeadTransaction",
  "plrAcknowledgement",
  "closingDepartment",
  "onTeam",
  "isaSet",
  "pastClient",
  "dueDiligencePeriod",
  "contingencies",
  "multipleTransactions",
  "goodFundContribution",
]);

const PENDING_SELECT_FIELDS: Partial<
  Record<string, keyof PendingSelectOptions>
> = {
  clientType: "clientTypeOptions",
  jcreOffice: "jcreOfficeOptions",
  jcreLeadTransaction: "jcreLeadTransactionOptions",
  plrAcknowledgement: "plrAcknowledgementOptions",
  closingDepartment: "closingDepartmentOptions",
  hasSecondaryClient: "hasSecondaryClientOptions",
  onTeam: "onTeamOptions",
  isaSet: "isaSetOptions",
  pastClient: "pastClientOptions",
  outsideReferral: "outsideReferralOptions",
  financingType: "financingOptions",
  dueDiligencePeriod: "dueDiligencePeriodOptions",
  contingencies: "contingenciesOptions",
  multipleTransactions: "multipleTransactionsOptions",
  goodFundContribution: "goodFundContributionOptions",
  commissionDelivery: "commissionDeliveryOptions",
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayString(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return "";
  }

  return String(value).trim();
}

function formatYesNoDisplayValue(value: string): string {
  const normalized = normalizeToken(value);
  if (normalized === "yes" || normalized === "y" || normalized === "true") {
    return "Yes";
  }
  if (normalized === "no" || normalized === "n" || normalized === "false") {
    return "No";
  }
  return value;
}

function formatClientTypeDisplayValue(value: string): string {
  const normalized = normalizeToken(value);
  if (normalized === "buyer" || normalized === "b") {
    return "Buyer";
  }
  if (normalized === "seller" || normalized === "s") {
    return "Seller";
  }
  return value;
}

function resolveSelectOptionLabel(
  value: string,
  options: readonly TeamFieldSelectOption[],
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const normalized = normalizeToken(trimmed);
  const match = options.find(
    (option) =>
      option.value === trimmed ||
      normalizeToken(option.value) === normalized ||
      normalizeToken(option.label) === normalized,
  );

  return match?.label ?? trimmed;
}

function resolveMapLabel(
  value: string,
  labels: ReadonlyMap<string, string>,
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return labels.get(trimmed) ?? trimmed;
}

function resolveStaticOptionLabel(
  value: string,
  options: readonly string[],
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const normalized = normalizeToken(trimmed);
  const match = options.find((option) => normalizeToken(option) === normalized);
  return match ?? trimmed;
}

function resolveAppointmentTypeDisplayValue(
  value: string,
  context: FormSubmissionDisplayContext,
): string {
  const appointmentTypes = [...context.appointmentTypeLabels.entries()].map(
    ([id, name]) => ({
      id: Number(id),
      name,
    }),
  );

  if (appointmentTypes.length === 0) {
    return resolveAppointmentTypeName(value, DEFAULT_APPOINTMENT_TYPE_OPTIONS);
  }

  return resolveAppointmentTypeName(value, appointmentTypes);
}

export function createEmptyFormSubmissionDisplayContext(): FormSubmissionDisplayContext {
  return {
    pendingOptions: getPendingSelectOptions({}),
    closedOptions: getClosedSelectOptions({}),
    fubUserLabels: new Map(),
    sisuIsaLabels: new Map(),
    appointmentTypeLabels: new Map(),
    mortgageCompanyLabels: new Map(),
    attorneyLabels: new Map(),
  };
}

export function formatFormSubmissionFieldValue(
  form: SettingsFormKind,
  fieldName: string,
  rawValue: unknown,
  context: FormSubmissionDisplayContext,
): string {
  const value = toDisplayString(rawValue);
  if (!value) {
    return "";
  }

  if (PHONE_FIELDS.has(fieldName)) {
    return formatPhoneInput(value);
  }

  if (DATE_FIELDS.has(fieldName)) {
    return formatFormDateDisplayValue(value);
  }

  if (TIME_FIELDS.has(fieldName)) {
    return formatFormTimeDisplayValue(value);
  }

  if (CURRENCY_FIELDS.has(fieldName)) {
    return formatCurrencyInput(value);
  }

  if (PERCENTAGE_FIELDS.has(fieldName)) {
    return formatPercentageInput(value);
  }

  if (YES_NO_FIELDS.has(fieldName)) {
    return formatYesNoDisplayValue(value);
  }

  if (fieldName === "clientType" || fieldName === "leadType") {
    const formatted = formatClientTypeDisplayValue(value);
    if (form === "pending") {
      return resolveSelectOptionLabel(
        formatted,
        context.pendingOptions.clientTypeOptions,
      );
    }
    if (form === "closed") {
      return resolveSelectOptionLabel(
        formatted,
        context.closedOptions.clientTypeOptions,
      );
    }
    return resolveStaticOptionLabel(
      formatted,
      form === "appointmentMet"
        ? APPOINTMENT_MET_LEAD_TYPE_OPTIONS
        : APPOINTMENT_SET_LEAD_TYPE_OPTIONS,
    );
  }

  if (form === "pending") {
    if (fieldName === "mortgageCompany") {
      return resolveMapLabel(value, context.mortgageCompanyLabels);
    }
    if (fieldName === "closingAttorney") {
      return resolveMapLabel(value, context.attorneyLabels);
    }

    const pendingSelectKey = PENDING_SELECT_FIELDS[fieldName];
    if (pendingSelectKey) {
      return resolveSelectOptionLabel(
        value,
        context.pendingOptions[pendingSelectKey],
      );
    }
  }

  if (form === "closed" && fieldName === "transactionType") {
    const option = resolveTransactionTypeOption(
      value,
      context.closedOptions.transactionTypeOptions,
    );
    return option?.label ?? value;
  }

  if (form === "appointmentSet") {
    if (fieldName === "appointmentType") {
      return resolveAppointmentTypeDisplayValue(value, context);
    }
    if (fieldName === "assignedIsa") {
      return resolveMapLabel(value, context.sisuIsaLabels);
    }
    if (fieldName === "assignedOsa") {
      return resolveMapLabel(value, context.fubUserLabels);
    }
    if (fieldName === "apptSetBy") {
      return resolveStaticOptionLabel(value, APPT_SET_BY_OPTIONS);
    }
    if (fieldName === "appointmentLocation") {
      return resolveStaticOptionLabel(value, APPOINTMENT_LOCATION_OPTIONS);
    }
  }

  if (form === "appointmentMet") {
    if (fieldName === "agentSubmitting") {
      return resolveMapLabel(value, context.fubUserLabels);
    }
    if (fieldName === "apptDisposition") {
      return resolveStaticOptionLabel(value, APPT_DISPOSITION_OPTIONS);
    }
    if (fieldName === "apptOutcome") {
      return resolveStaticOptionLabel(value, APPT_OUTCOME_OPTIONS);
    }
    if (fieldName === "nextStep") {
      return resolveStaticOptionLabel(value, MET_NEXT_STEP_OPTIONS);
    }
    if (fieldName === "cancelledNextStep") {
      return resolveStaticOptionLabel(value, CANCELLED_NEXT_STEP_OPTIONS);
    }
  }

  return value;
}
