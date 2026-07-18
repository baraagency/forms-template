import {
  formDateOnOrBeforeTodayError,
  isFormDateOnOrBeforeToday,
} from "../_core/formDateValidation";
import type { TeamFieldSelectOption } from "../_core/teamFieldOptions";
import { isClosedLeaseOrRentalTransactionType } from "./closedTeamFieldOptions";

export type ClosedSection = "transaction" | "dates";

export type ClosedFormState = {
  personId: string;
  agentId: string;
  dealId: string;
  sisuTransactionId: string;
  transactionType: string;
  addressLine1: string;
  city: string;
  state: string;
  postal: string;
  transactionAmount: string;
  securityDeposit: string;
  monthlyRent: string;
  totalCommissionGci: string;
  settlementDate: string;
  tcMarketingNotes: string;
};

export type ClosedFieldErrors = Partial<Record<keyof ClosedFormState, string>>;

export const CLOSED_SECTIONS: ClosedSection[] = ["transaction", "dates"];

const requiredFieldsBySection: Record<ClosedSection, Array<keyof ClosedFormState>> = {
  transaction: [
    "transactionType",
    "addressLine1",
    "city",
    "state",
    "postal",
    "transactionAmount",
    "totalCommissionGci",
  ],
  dates: ["settlementDate"],
};

const leaseRentalFields = ["securityDeposit", "monthlyRent"] as const;

function isPresent(value: string): boolean {
  return value.trim().length > 0;
}

export function isLeaseOrRentalSelection(
  value: string,
  transactionTypeOptions: TeamFieldSelectOption[] = [],
): boolean {
  return isClosedLeaseOrRentalTransactionType(value, transactionTypeOptions);
}

export function getInitialClosedFormState(values: {
  personId?: string;
  agentId?: string;
  dealId?: string;
  sisuTransactionId?: string;
}): ClosedFormState {
  return {
    personId: values.personId ?? "",
    agentId: values.agentId ?? "",
    dealId: values.dealId ?? "",
    sisuTransactionId: values.sisuTransactionId ?? "",
    transactionType: "",
    addressLine1: "",
    city: "",
    state: "",
    postal: "",
    transactionAmount: "",
    securityDeposit: "",
    monthlyRent: "",
    totalCommissionGci: "",
    settlementDate: "",
    tcMarketingNotes: "",
  };
}

export function validateClosedSection(
  state: ClosedFormState,
  section: ClosedSection,
  options: { transactionTypeOptions?: TeamFieldSelectOption[] } = {},
): ClosedFieldErrors {
  const errors: ClosedFieldErrors = {};
  const transactionTypeOptions = options.transactionTypeOptions ?? [];

  for (const field of requiredFieldsBySection[section]) {
    if (!isPresent(state[field])) {
      errors[field] = "This field is required.";
    }
  }

  if (
    section === "transaction" &&
    isLeaseOrRentalSelection(state.transactionType, transactionTypeOptions)
  ) {
    for (const field of leaseRentalFields) {
      if (!isPresent(state[field])) {
        errors[field] = "This field is required.";
      }
    }
  }

  if (section === "dates") {
    if (state.settlementDate && !isFormDateOnOrBeforeToday(state.settlementDate)) {
      errors.settlementDate = formDateOnOrBeforeTodayError("Closed Date");
    }
  }

  return errors;
}

export const CLOSED_FORM_VALIDATION_FIELD_ORDER = [
  "transactionType",
  "addressLine1",
  "city",
  "state",
  "postal",
  "transactionAmount",
  "totalCommissionGci",
  "securityDeposit",
  "monthlyRent",
  "settlementDate",
] as const satisfies readonly (keyof ClosedFormState)[];

export function validateClosedForm(
  state: ClosedFormState,
  options: { transactionTypeOptions?: TeamFieldSelectOption[] } = {},
): ClosedFieldErrors {
  return {
    ...validateClosedSection(state, "transaction", options),
    ...validateClosedSection(state, "dates", options),
  };
}

export function normalizeClosedPayload(
  payload: Record<string, unknown>,
): ClosedFormState {
  const initialState = getInitialClosedFormState({});
  const normalizedState = { ...initialState };

  for (const field of Object.keys(initialState) as Array<keyof ClosedFormState>) {
    const value = payload[field];
    normalizedState[field] = typeof value === "string" ? value : "";
  }

  return normalizedState;
}
