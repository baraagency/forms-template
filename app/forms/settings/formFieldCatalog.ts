import type { SettingsFormKind } from "../_core/formIdentity";

export type FormFieldOption = {
  value: string;
  label: string;
};

/**
 * Mappable form fields with UI labels from the example forms.
 * Array order = on-form appearance order (top → bottom, left → right in a row).
 * Excludes routing-only keys: personId, agentId, dealId, sisuTransactionId.
 * Fields not shown in the template UI stay at the end for seed/mapping continuity.
 * Keep values in sync with db/migrations/012_seed_settings_bootstrap.sql
 */
export const FORM_FIELD_OPTIONS: Record<
  SettingsFormKind,
  readonly FormFieldOption[]
> = {
  pending: [
    { value: "clientFirstName", label: "Client First Name" },
    { value: "clientLastName", label: "Client Last Name" },
    { value: "clientPhone", label: "Client Phone Number" },
    { value: "clientEmail", label: "Client Email" },
    { value: "hasSecondaryClient", label: "Is there a secondary client?" },
    { value: "secondaryContact", label: "Secondary Client Name" },
    { value: "secondaryContactPhone", label: "Secondary Client Phone" },
    { value: "secondaryContactEmail", label: "Secondary Client Email" },
    { value: "clientType", label: "Client Type" },
    { value: "transactionAmount", label: "Transaction Amount" },
    { value: "addressLine1", label: "Street Address" },
    { value: "addressLine2", label: "Address Line 2" },
    { value: "city", label: "City" },
    { value: "state", label: "State/Province/Region" },
    { value: "postal", label: "Postal Code" },
    { value: "financingType", label: "Financing Type" },
    { value: "mortgageCompany", label: "Mortgage Company" },
    { value: "mortgageCompanyName", label: "Mortgage Company Name" },
    { value: "loanOfficerName", label: "Loan Officer Name" },
    { value: "loanOfficerEmail", label: "Loan Officer Email" },
    { value: "underContractDate", label: "Under Contract Date" },
    { value: "forecastedClosedDate", label: "Forecasted Closed Date" },
    { value: "outsideReferral", label: "Outside Referral/Rebate?" },
    { value: "referralPercent", label: "Referral Percent" },
    { value: "referralAmount", label: "Referral Amount" },
    { value: "referralMailingAddress", label: "Referral Mailing Address" },
    { value: "otherAgentName", label: "Coop Agent Name" },
    { value: "otherAgentPhone", label: "Coop Agent Phone" },
    { value: "otherAgentEmail", label: "Coop Agent Email" },
    { value: "otherAgentCompany", label: "Coop Agent Company" },
    { value: "dueDiligencePeriod", label: "Is there a due diligence period?" },
    { value: "dueDiligenceDeadline", label: "Due Diligence Deadline" },
    { value: "contingencies", label: "Are there contingencies?" },
    {
      value: "sellerCompensationPercent",
      label: "Seller Compensation to Buyer Broker (%)",
    },
    { value: "contingencyDetails", label: "Contingencies" },
    // Not shown on the template Pending UI — keep for seeded mappings.
    { value: "transactionStage", label: "Transaction Stage" },
    { value: "agent2", label: "Agent 2" },
    { value: "agent2Percent", label: "Agent 2 Percent" },
    { value: "jcreOffice", label: "Office" },
    { value: "jcreLeadTransaction", label: "Lead Transaction" },
    { value: "plrAcknowledgement", label: "PLR Acknowledgement" },
    { value: "closingDepartment", label: "Closing Department" },
    { value: "onTeam", label: "Are you on a team?" },
    { value: "teamLeaderName", label: "Team Leader Name" },
    { value: "teamPayNotes", label: "Team Pay Notes" },
    { value: "isaSet", label: "ISA Set?" },
    { value: "isaName", label: "ISA Name" },
    { value: "pastClient", label: "Past Client" },
    { value: "closingAttorney", label: "Closing Attorney" },
    { value: "closingAttorneyOther", label: "Closing Attorney (Other)" },
    { value: "closingAttorneyPhone", label: "Closing Attorney Phone" },
    { value: "closingAttorneyEmail", label: "Closing Attorney Email" },
    { value: "multipleTransactions", label: "Multiple Transactions" },
    { value: "otherAddresses", label: "Other Addresses" },
    { value: "closingDepartmentNotes", label: "Closing Department Notes" },
    { value: "goodFundContribution", label: "Good Fund Contribution" },
    { value: "commissionDelivery", label: "Commission Delivery" },
    { value: "grossCommissionTotal", label: "Gross Commission Total" },
  ],
  appointmentSet: [
    { value: "clientFirstName", label: "Client First Name" },
    { value: "clientLastName", label: "Client Last Name" },
    { value: "clientPhone", label: "Client Phone Number" },
    { value: "clientEmail", label: "Client Email" },
    { value: "leadType", label: "Client Type" },
    { value: "apptSetBy", label: "Appointment Set By" },
    { value: "appointmentType", label: "Appointment Type" },
    { value: "assignedIsa", label: "Assigned ISA" },
    { value: "assignedOsa", label: "Assigned OSA" },
    { value: "appointmentDate", label: "Appointment Date" },
    { value: "appointmentStartTime", label: "Start Time" },
    { value: "appointmentEndTime", label: "End Time" },
    { value: "appointmentLocation", label: "Appointment Location" },
    { value: "streetAddress", label: "Street Address" },
    { value: "addressLine2", label: "Address Line 2" },
    { value: "city", label: "City" },
    { value: "state", label: "State/Province/Region" },
    { value: "postalCode", label: "Postal Code" },
    {
      value: "notes",
      label: "Notes (Location, Timeframe, Motivation, Price, etc.)",
    },
  ],
  appointmentMet: [
    { value: "clientFirstName", label: "Client First Name" },
    { value: "clientLastName", label: "Client Last Name" },
    { value: "clientPhone", label: "Client Phone Number" },
    { value: "clientEmail", label: "Client Email" },
    { value: "leadType", label: "Client Type" },
    { value: "apptDisposition", label: "Did the Appointment Happen?" },
    { value: "appointmentMetDate", label: "Appointment Met Date" },
    { value: "apptOutcome", label: "Appointment Outcome" },
    { value: "nextStep", label: "Next Step" },
    { value: "notes", label: "Notes" },
    {
      value: "cancelledNextStep",
      label: "Next Step for Cancelled Appointments",
    },
    { value: "followUpNotes", label: "Follow Up Notes" },
    { value: "rescheduledDate", label: "Rescheduled Date" },
    { value: "rescheduledStartTime", label: "Rescheduled Start Time" },
    { value: "rescheduledEndTime", label: "Rescheduled End Time" },
    // Removed from template UI — keep for seeded mappings.
    { value: "agentSubmitting", label: "Agent Submitting" },
  ],
  closed: [
    { value: "clientType", label: "Client Type" },
    { value: "transactionType", label: "Is this a Rental/Lease/Referral?" },
    { value: "addressLine1", label: "Address" },
    { value: "city", label: "City" },
    { value: "state", label: "State" },
    { value: "postal", label: "Zip" },
    { value: "transactionAmount", label: "Transaction Amount" },
    { value: "totalCommissionGci", label: "Total Commission GCI" },
    { value: "securityDeposit", label: "Security Deposit" },
    { value: "monthlyRent", label: "Monthly Rent" },
    { value: "settlementDate", label: "Closed Date" },
    { value: "tcMarketingNotes", label: "Notes" },
  ],
};

/** Field keys only — used by seeds and FUB person/deal template lists. */
export const FORM_FIELD_CATALOG: Record<SettingsFormKind, readonly string[]> = {
  pending: FORM_FIELD_OPTIONS.pending.map((option) => option.value),
  appointmentSet: FORM_FIELD_OPTIONS.appointmentSet.map((option) => option.value),
  appointmentMet: FORM_FIELD_OPTIONS.appointmentMet.map((option) => option.value),
  closed: FORM_FIELD_OPTIONS.closed.map((option) => option.value),
};

export function getFieldCatalog(form: SettingsFormKind): readonly string[] {
  return FORM_FIELD_CATALOG[form];
}

export function getFormFieldOptions(
  form: SettingsFormKind,
): readonly FormFieldOption[] {
  return FORM_FIELD_OPTIONS[form];
}

export function getFormFieldLabel(
  form: SettingsFormKind,
  fieldName: string,
): string {
  return (
    FORM_FIELD_OPTIONS[form].find((option) => option.value === fieldName)
      ?.label ?? fieldName
  );
}

export function getFormFieldAppearanceIndex(
  form: SettingsFormKind,
  fieldName: string,
): number {
  const index = FORM_FIELD_CATALOG[form].indexOf(fieldName);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function compareFormFieldsByAppearanceOrder(
  form: SettingsFormKind,
  leftFieldName: string,
  rightFieldName: string,
): number {
  const left = getFormFieldAppearanceIndex(form, leftFieldName);
  const right = getFormFieldAppearanceIndex(form, rightFieldName);
  if (left !== right) {
    return left - right;
  }
  return leftFieldName.localeCompare(rightFieldName);
}

export function sortByFormFieldAppearanceOrder<
  T extends { field_name: string },
>(form: SettingsFormKind, rows: readonly T[]): T[] {
  return [...rows].sort((left, right) =>
    compareFormFieldsByAppearanceOrder(form, left.field_name, right.field_name),
  );
}

/** Mapped rows first; within each group, preserve form field appearance order. */
export function sortMappingsByMappedFirst<
  T extends { field_name: string },
>(
  form: SettingsFormKind,
  rows: readonly T[],
  isMapped: (row: T) => boolean,
): T[] {
  return [...rows].sort((left, right) => {
    const leftMapped = isMapped(left);
    const rightMapped = isMapped(right);
    if (leftMapped !== rightMapped) {
      return leftMapped ? -1 : 1;
    }
    return compareFormFieldsByAppearanceOrder(
      form,
      left.field_name,
      right.field_name,
    );
  });
}

/** The SISU field the Client Type form field is always mapped to. */
export const CLIENT_TYPE_SISU_FIELD_NAME = "type_id";

/**
 * Form field key that holds the Buyer/Seller distinction, per form. Only
 * forms with a "Client Type" field are listed; others (e.g. closed) have
 * no entry.
 */
const CLIENT_TYPE_FORM_FIELD_NAME: Partial<Record<SettingsFormKind, string>> = {
  pending: "clientType",
  appointmentSet: "leadType",
  appointmentMet: "leadType",
  closed: "clientType",
};

/**
 * The Client Type field's mapping to the SISU type_id field is fixed
 * and must not be editable in Settings — this identifies that row so the
 * UI/API can lock it.
 */
export function isLockedClientTypeSisuMapping(
  form: SettingsFormKind,
  fieldName: string,
): boolean {
  return CLIENT_TYPE_FORM_FIELD_NAME[form] === fieldName;
}
