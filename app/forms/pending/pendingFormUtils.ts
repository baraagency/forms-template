import type { FUBPerson } from "@/app/types/fub";
import type { SISUTransaction } from "@/app/types/sisu";
import {
  formatCurrencyInput,
  formatPhoneInput,
  formatPercentageInput,
  getFirstRelationshipSecondaryContact,
  getPrimaryContactValue,
  isValidEmail,
  isValidPhone,
  splitPersonName,
} from "../_core/formatUtils";
import {
  formatSisuDateValue,
  getResolvedSisuTransactionId,
  normalizeSisuYesNoToLower,
  readSisuValue,
} from "../_core/sisuTransactionPrefill";
import {
  isSellerSelection,
  isYesSelection,
} from "./pendingTeamFieldOptions";

export const PENDING_SECTIONS = [
  "primary",
  "additional",
] as const;

export type PendingSection = (typeof PENDING_SECTIONS)[number];

export type PendingFormState = {
  personId: string;
  agentId: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  dealId: string;
  sisuTransactionId: string;
  clientType: string;
  transactionStage: string;
  transactionAmount: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  agent2: string;
  agent2Percent: string;
  jcreOffice: string;
  jcreLeadTransaction: string;
  plrAcknowledgement: string;
  closingDepartment: string;
  hasSecondaryClient: string;
  secondaryContact: string;
  secondaryContactPhone: string;
  secondaryContactEmail: string;
  onTeam: string;
  teamLeaderName: string;
  teamPayNotes: string;
  isaSet: string;
  isaName: string;
  pastClient: string;
  underContractDate: string;
  forecastedClosedDate: string;
  outsideReferral: string;
  referralPercent: string;
  referralAmount: string;
  referralMailingAddress: string;
  otherAgentName: string;
  otherAgentPhone: string;
  otherAgentEmail: string;
  otherAgentCompany: string;
  closingAttorney: string;
  closingAttorneyOther: string;
  closingAttorneyPhone: string;
  closingAttorneyEmail: string;
  mortgageCompany: string;
  mortgageCompanyName: string;
  loanOfficerName: string;
  loanOfficerEmail: string;
  financingType: string;
  dueDiligencePeriod: string;
  dueDiligenceDeadline: string;
  contingencies: string;
  contingencyDetails: string;
  multipleTransactions: string;
  otherAddresses: string;
  closingDepartmentNotes: string;
  goodFundContribution: string;
  commissionDelivery: string;
  sellerCompensationPercent: string;
  grossCommissionTotal: string;
};

export type PendingFieldErrors = Partial<Record<keyof PendingFormState, string>>;

export { formDatePickerBehaviorProps as pendingDatePickerBehaviorProps } from "../_core/formDatePickerField";

const requiredFieldsBySection: Record<PendingSection, Array<keyof PendingFormState>> = {
  primary: [
    "clientFirstName",
    "clientLastName",
    "clientPhone",
    "clientEmail",
    "clientType",
    "hasSecondaryClient",
    "transactionAmount",
    "addressLine1",
    "city",
    "state",
    "postal",
  ],
  additional: [
    "underContractDate",
    "forecastedClosedDate",
    "outsideReferral",
    "otherAgentName",
    "otherAgentEmail",
    "mortgageCompany",
    "financingType",
  ],
};

function isPresent(value: string): boolean {
  return value.trim().length > 0;
}

function parsePercentageInput(value: string): number {
  return Number(value.replace(/[%\s]/g, ""));
}

function addPercentageError(
  errors: PendingFieldErrors,
  field: "agent2Percent" | "referralPercent" | "sellerCompensationPercent",
  value: string,
): void {
  const percentage = parsePercentageInput(value);
  if (value && (!Number.isFinite(percentage) || percentage < 0 || percentage > 100)) {
    errors[field] = "Enter a percentage from 0 to 100.";
  }
}

export function isOutsideReferralSelected(value: string): boolean {
  const normalizedValue = value.trim().toLowerCase();
  return (
    Boolean(normalizedValue) &&
    !["0", "3", "no", "none", "n/a", "na", "rebate"].includes(normalizedValue)
  );
}

const otherMortgageCompanyIds = new Set(["184058", "other"]);

function isOtherVendor(value: string, otherIds: Set<string>): boolean {
  return otherIds.has(value.trim().toLowerCase());
}

export function getInitialPendingFormState(values: {
  personId?: string;
  agentId?: string;
  clientName?: string;
  dealId?: string;
  sisuTransactionId?: string;
}): PendingFormState {
  const splitName = splitPersonName(values.clientName ?? "");

  return {
    personId: values.personId ?? "",
    agentId: values.agentId ?? "",
    clientFirstName: splitName.firstName,
    clientLastName: splitName.lastName,
    clientPhone: "",
    clientEmail: "",
    dealId: values.dealId ?? "",
    sisuTransactionId: values.sisuTransactionId ?? "",
    clientType: "",
    transactionStage: "",
    transactionAmount: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postal: "",
    agent2: "",
    agent2Percent: "",
    jcreOffice: "",
    jcreLeadTransaction: "",
    plrAcknowledgement: "",
    closingDepartment: "",
    hasSecondaryClient: "",
    secondaryContact: "",
    secondaryContactPhone: "",
    secondaryContactEmail: "",
    onTeam: "",
    teamLeaderName: "",
    teamPayNotes: "",
    isaSet: "",
    isaName: "",
    pastClient: "",
    underContractDate: "",
    forecastedClosedDate: "",
    outsideReferral: "",
    referralPercent: "",
    referralAmount: "",
    referralMailingAddress: "",
    otherAgentName: "",
    otherAgentPhone: "",
    otherAgentEmail: "",
    otherAgentCompany: "",
    closingAttorney: "",
    closingAttorneyOther: "",
    closingAttorneyPhone: "",
    closingAttorneyEmail: "",
    mortgageCompany: "",
    mortgageCompanyName: "",
    loanOfficerName: "",
    loanOfficerEmail: "",
    financingType: "",
    dueDiligencePeriod: "",
    dueDiligenceDeadline: "",
    contingencies: "",
    contingencyDetails: "",
    multipleTransactions: "",
    otherAddresses: "",
    closingDepartmentNotes: "",
    goodFundContribution: "",
    commissionDelivery: "",
    sellerCompensationPercent: "",
    grossCommissionTotal: "",
  };
}

export function applyPendingPersonPrefill(
  current: PendingFormState,
  person: FUBPerson,
): PendingFormState {
  const secondaryContact = getFirstRelationshipSecondaryContact(person);
  const hasSecondaryClient =
    secondaryContact.name || secondaryContact.phone || secondaryContact.email ? "yes" : "";

  return {
    ...current,
    personId: String(person.id || current.personId),
    agentId: current.agentId || (person.assignedUserId ? String(person.assignedUserId) : ""),
    clientFirstName: current.clientFirstName || person.firstName || "",
    clientLastName: current.clientLastName || person.lastName || "",
    clientPhone: current.clientPhone || formatPhoneInput(getPrimaryContactValue(person.phones)),
    clientEmail: current.clientEmail || getPrimaryContactValue(person.emails) || person.email || "",
    addressLine1: current.addressLine1 || person.address || "",
    city: current.city || person.city || "",
    state: current.state || person.state || "",
    postal: current.postal || person.zipCode || "",
    hasSecondaryClient: current.hasSecondaryClient || hasSecondaryClient,
    secondaryContact: current.secondaryContact || secondaryContact.name,
    secondaryContactPhone: current.secondaryContactPhone || secondaryContact.phone,
    secondaryContactEmail: current.secondaryContactEmail || secondaryContact.email,
  };
}

export function defaultPendingIsaSetFromIsaName(
  state: PendingFormState,
): PendingFormState {
  if (state.isaSet.trim() || !state.isaName.trim()) {
    return state;
  }

  return {
    ...state,
    isaSet: "yes",
  };
}

export function applyPendingSisuTransactionPrefill(
  current: PendingFormState,
  transaction: SISUTransaction,
): PendingFormState {
  const secondaryContact = readSisuValue(transaction, ["second_contact_name"]);
  const secondaryContactPhone = readSisuValue(transaction, ["second_contact_phone"]);
  const secondaryContactEmail = readSisuValue(transaction, ["second_contact_email"]);
  const hasSecondaryClient =
    secondaryContact || secondaryContactPhone || secondaryContactEmail ? "yes" : "";
  const clientType = derivePendingClientTypeFromSisu(transaction);
  const transactionStage = clientType
    ? isSellerSelection(clientType)
      ? "seller-pending"
      : "buyer-pending"
    : "";

  return defaultPendingIsaSetFromIsaName({
    ...current,
    sisuTransactionId: getResolvedSisuTransactionId(transaction) || current.sisuTransactionId,
    agentId: current.agentId || readSisuValue(transaction, ["agent_id"]),
    clientFirstName: current.clientFirstName || readSisuValue(transaction, ["first_name"]),
    clientLastName: current.clientLastName || readSisuValue(transaction, ["last_name"]),
    clientPhone:
      current.clientPhone || formatPhoneInput(readSisuValue(transaction, ["mobile_phone"])),
    clientEmail: current.clientEmail || readSisuValue(transaction, ["email"]),
    personId: current.personId || readSisuValue(transaction, ["fub_id"]),
    dealId: current.dealId || readSisuValue(transaction, ["fub_deal_id"]),
    hasSecondaryClient: current.hasSecondaryClient || hasSecondaryClient,
    secondaryContact: current.secondaryContact || secondaryContact,
    secondaryContactPhone:
      current.secondaryContactPhone || formatPhoneInput(secondaryContactPhone),
    secondaryContactEmail: current.secondaryContactEmail || secondaryContactEmail,
    clientType: current.clientType || clientType,
    transactionStage: current.transactionStage || transactionStage,
    transactionAmount:
      current.transactionAmount ||
      formatCurrencyInput(readSisuValue(transaction, ["trans_amt"])),
    addressLine1: current.addressLine1 || readSisuValue(transaction, ["address_1"]),
    addressLine2: current.addressLine2 || readSisuValue(transaction, ["address_2"]),
    city: current.city || readSisuValue(transaction, ["city"]),
    state: current.state || readSisuValue(transaction, ["state"]),
    postal: current.postal || readSisuValue(transaction, ["postal_code"]),
    agent2: current.agent2 || readSisuValue(transaction, ["agent_2"]),
    agent2Percent:
      current.agent2Percent ||
      formatPercentageInput(readSisuValue(transaction, ["agent_2_s_37"])),
    jcreOffice: current.jcreOffice || readSisuValue(transaction, ["jcre_office"]),
    jcreLeadTransaction:
      current.jcreLeadTransaction ||
      normalizeSisuYesNoToLower(readSisuValue(transaction, ["jcre_leads_63"])),
    plrAcknowledgement:
      current.plrAcknowledgement ||
      normalizeSisuYesNoToLower(
        readSisuValue(transaction, [
          "do_you_understand_that_plrs_92s_need_to_be_fully_executed_within_48_hours_of_ratification_and_prior_",
        ]),
      ),
    closingDepartment:
      current.closingDepartment ||
      normalizeSisuYesNoToLower(
        readSisuValue(transaction, [
          "cap_agentss_58_if_personals_44_closing_servicess_63",
        ]),
      ),
    onTeam:
      current.onTeam ||
      normalizeSisuYesNoToLower(readSisuValue(transaction, ["are_you_on_a_teams_63"])),
    teamLeaderName: current.teamLeaderName || readSisuValue(transaction, ["team_leader_name"]),
    teamPayNotes:
      current.teamPayNotes ||
      readSisuValue(transaction, ["teamss_58_pay_notes_for_accounting"]),
    isaSet:
      current.isaSet ||
      normalizeSisuYesNoToLower(readSisuValue(transaction, ["isa_sets_63"])),
    isaName: current.isaName || readSisuValue(transaction, ["appt_set_by_agent_id"]),
    pastClient:
      current.pastClient ||
      normalizeSisuYesNoToLower(readSisuValue(transaction, ["past_client"])),
    underContractDate:
      current.underContractDate || formatSisuDateValue(readSisuValue(transaction, ["uc_dt"])),
    forecastedClosedDate:
      current.forecastedClosedDate ||
      formatSisuDateValue(readSisuValue(transaction, ["forecasted_closed_dt"])),
    outsideReferral: current.outsideReferral || readSisuValue(transaction, ["outside_referral"]),
    referralPercent:
      current.referralPercent ||
      formatPercentageInput(readSisuValue(transaction, ["referral_amount"])),
    referralAmount:
      current.referralAmount ||
      formatCurrencyInput(readSisuValue(transaction, ["referral_amt"])),
    referralMailingAddress:
      current.referralMailingAddress ||
      readSisuValue(transaction, ["referral_mailing_address"]),
    otherAgentName: current.otherAgentName || readSisuValue(transaction, ["other_agent_name"]),
    otherAgentPhone:
      current.otherAgentPhone ||
      formatPhoneInput(readSisuValue(transaction, ["other_agent_phone"])),
    otherAgentEmail: current.otherAgentEmail || readSisuValue(transaction, ["other_agent_email"]),
    otherAgentCompany:
      current.otherAgentCompany || readSisuValue(transaction, ["other_agent_company"]),
    closingAttorney: current.closingAttorney || readSisuValue(transaction, ["attorney_vid"]),
    closingAttorneyOther:
      current.closingAttorneyOther || readSisuValue(transaction, ["jcre_closing_attorney"]),
    closingAttorneyPhone:
      current.closingAttorneyPhone ||
      formatPhoneInput(readSisuValue(transaction, ["jcre_closing_attorney_phone"])),
    closingAttorneyEmail:
      current.closingAttorneyEmail ||
      readSisuValue(transaction, ["jcre_closing_attorney_email"]),
    mortgageCompany: current.mortgageCompany || readSisuValue(transaction, ["mortgage_company_vid"]),
    mortgageCompanyName: current.mortgageCompanyName || readSisuValue(transaction, ["mortgage_other"]),
    loanOfficerName: current.loanOfficerName || readSisuValue(transaction, ["loan_officer_name"]),
    loanOfficerEmail: current.loanOfficerEmail || readSisuValue(transaction, ["loan_officer_email"]),
    financingType: current.financingType || readSisuValue(transaction, ["financing"]),
    dueDiligencePeriod:
      current.dueDiligencePeriod ||
      normalizeSisuYesNoToLower(
        readSisuValue(transaction, ["is_there_a_due_diligence_periods_63"]),
      ),
    dueDiligenceDeadline:
      current.dueDiligenceDeadline ||
      formatSisuDateValue(readSisuValue(transaction, ["due_diligence_deadline_dt"])),
    contingencies:
      current.contingencies ||
      normalizeSisuYesNoToLower(
        readSisuValue(transaction, ["are_there_any_contingenciess_63"]),
      ),
    contingencyDetails: current.contingencyDetails || readSisuValue(transaction, ["contingencies"]),
    multipleTransactions:
      current.multipleTransactions ||
      normalizeSisuYesNoToLower(
        readSisuValue(transaction, ["client_multiple_transactionss_63"]),
      ),
    otherAddresses:
      current.otherAddresses || readSisuValue(transaction, ["second_address_multiple_transactions"]),
    closingDepartmentNotes:
      current.closingDepartmentNotes ||
      readSisuValue(transaction, ["notes_for_the_closing_department"]),
    goodFundContribution:
      current.goodFundContribution ||
      normalizeSisuYesNoToLower(readSisuValue(transaction, ["1s_37_for_good_contribution"])),
    commissionDelivery:
      current.commissionDelivery || readSisuValue(transaction, ["commission_delivery_to_lpt"]),
    sellerCompensationPercent:
      current.sellerCompensationPercent ||
      readSisuValue(transaction, ["120_compensations_63"]),
    grossCommissionTotal:
      current.grossCommissionTotal ||
      formatCurrencyInput(readSisuValue(transaction, ["jcre_gross_comission_total_in_s_36"])),
  });
}

function derivePendingClientTypeFromSisu(transaction: SISUTransaction): string {
  const typeId = readSisuValue(transaction, ["type_id"]).trim().toLowerCase();
  if (typeId === "s") {
    return "Seller";
  }
  if (typeId === "b") {
    return "Buyer";
  }

  return readSisuValue(transaction, ["client_type"]);
}

export function validatePendingSection(
  state: PendingFormState,
  section: PendingSection,
): PendingFieldErrors {
  const errors: PendingFieldErrors = {};

  for (const field of requiredFieldsBySection[section]) {
    if (!isPresent(state[field])) {
      errors[field] = "This field is required.";
    }
  }

  if (section === "primary") {
    if (state.clientEmail && !isValidEmail(state.clientEmail)) {
      errors.clientEmail = "Enter a valid email address.";
    }
    if (state.clientPhone && !isValidPhone(state.clientPhone)) {
      errors.clientPhone = "Enter a valid phone number.";
    }

    if (isYesSelection(state.hasSecondaryClient)) {
      if (!isPresent(state.secondaryContact)) {
        errors.secondaryContact = "Enter the secondary contact.";
      }
      if (!isValidPhone(state.secondaryContactPhone)) {
        errors.secondaryContactPhone = "Enter a valid secondary contact phone number.";
      }
      if (!isValidEmail(state.secondaryContactEmail)) {
        errors.secondaryContactEmail = "Enter a valid secondary contact email.";
      }
    }
  }

  if (section === "additional") {
    if (isOutsideReferralSelected(state.outsideReferral)) {
      if (isPresent(state.referralPercent)) {
        addPercentageError(errors, "referralPercent", state.referralPercent);
      }
    }

    if (state.otherAgentPhone && !isValidPhone(state.otherAgentPhone)) {
      errors.otherAgentPhone = "Enter a valid coop agent phone number.";
    }
    if (state.otherAgentEmail && !isValidEmail(state.otherAgentEmail)) {
      errors.otherAgentEmail = "Enter a valid coop agent email.";
    }

    if (
      isOtherVendor(state.mortgageCompany, otherMortgageCompanyIds) &&
      !isPresent(state.mortgageCompanyName)
    ) {
      errors.mortgageCompanyName = "Enter the mortgage company name.";
    }
    if (state.loanOfficerEmail && !isValidEmail(state.loanOfficerEmail)) {
      errors.loanOfficerEmail = "Enter a valid loan officer email.";
    }

    if (isSellerSelection(state.clientType)) {
      if (isYesSelection(state.dueDiligencePeriod) && !isPresent(state.dueDiligenceDeadline)) {
        errors.dueDiligenceDeadline = "Choose the due diligence deadline.";
      }
      if (isYesSelection(state.contingencies) && !isPresent(state.contingencyDetails)) {
        errors.contingencyDetails = "Enter the contingencies.";
      }
      addPercentageError(
        errors,
        "sellerCompensationPercent",
        state.sellerCompensationPercent,
      );
    }
  }

  return errors;
}

export function validatePendingForm(state: PendingFormState): PendingFieldErrors {
  return {
    ...validatePendingSection(state, "primary"),
    ...validatePendingSection(state, "additional"),
  };
}

export function normalizePendingPayload(payload: Record<string, unknown>): PendingFormState {
  const initialState = getInitialPendingFormState({});
  const normalizedState = { ...initialState };

  for (const field of Object.keys(initialState) as Array<keyof PendingFormState>) {
    const value = payload[field];
    normalizedState[field] = typeof value === "string" ? value : "";
  }

  return normalizedState;
}

export function formatPendingPhoneField(value: string): string {
  return formatPhoneInput(value);
}
