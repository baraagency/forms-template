import type { SettingsFormKind } from "../_core/formIdentity";

export type FormFieldOption = {
  value: string;
  label: string;
};

/**
 * Mappable form fields with UI labels from the example forms.
 * Excludes routing-only keys: personId, agentId, dealId, sisuTransactionId.
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
    { value: "clientType", label: "Client Type" },
    { value: "transactionStage", label: "Transaction Stage" },
    { value: "transactionAmount", label: "Transaction Amount" },
    { value: "addressLine1", label: "Street Address" },
    { value: "addressLine2", label: "Address Line 2" },
    { value: "city", label: "City" },
    { value: "state", label: "State/Province/Region" },
    { value: "postal", label: "Postal Code" },
    { value: "agent2", label: "Agent 2" },
    { value: "agent2Percent", label: "Agent 2 Percent" },
    { value: "jcreOffice", label: "Office" },
    { value: "jcreLeadTransaction", label: "Lead Transaction" },
    { value: "plrAcknowledgement", label: "PLR Acknowledgement" },
    { value: "closingDepartment", label: "Closing Department" },
    { value: "hasSecondaryClient", label: "Is there a secondary client?" },
    { value: "secondaryContact", label: "Secondary Client Name" },
    { value: "secondaryContactPhone", label: "Secondary Client Phone" },
    { value: "secondaryContactEmail", label: "Secondary Client Email" },
    { value: "onTeam", label: "Are you on a team?" },
    { value: "teamLeaderName", label: "Team Leader Name" },
    { value: "teamPayNotes", label: "Team Pay Notes" },
    { value: "isaSet", label: "ISA Set?" },
    { value: "isaName", label: "ISA Name" },
    { value: "pastClient", label: "Past Client" },
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
    { value: "closingAttorney", label: "Closing Attorney" },
    { value: "closingAttorneyOther", label: "Closing Attorney (Other)" },
    { value: "closingAttorneyPhone", label: "Closing Attorney Phone" },
    { value: "closingAttorneyEmail", label: "Closing Attorney Email" },
    { value: "mortgageCompany", label: "Mortgage Company" },
    { value: "mortgageCompanyName", label: "Mortgage Company Name" },
    { value: "loanOfficerName", label: "Loan Officer Name" },
    { value: "loanOfficerEmail", label: "Loan Officer Email" },
    { value: "financingType", label: "Financing Type" },
    { value: "dueDiligencePeriod", label: "Is there a due diligence period?" },
    { value: "dueDiligenceDeadline", label: "Due Diligence Deadline" },
    { value: "contingencies", label: "Are there contingencies?" },
    { value: "contingencyDetails", label: "Contingencies" },
    { value: "multipleTransactions", label: "Multiple Transactions" },
    { value: "otherAddresses", label: "Other Addresses" },
    { value: "closingDepartmentNotes", label: "Closing Department Notes" },
    { value: "goodFundContribution", label: "Good Fund Contribution" },
    { value: "commissionDelivery", label: "Commission Delivery" },
    {
      value: "sellerCompensationPercent",
      label: "Seller Compensation to Buyer Broker (%)",
    },
    { value: "grossCommissionTotal", label: "Gross Commission Total" },
  ],
  appointmentSet: [
    { value: "clientFirstName", label: "Client First Name" },
    { value: "clientLastName", label: "Client Last Name" },
    { value: "clientPhone", label: "Client Phone Number" },
    { value: "clientEmail", label: "Client Email" },
    { value: "leadType", label: "Client Type" },
    { value: "apptSetBy", label: "Appointment Set By" },
    { value: "assignedIsa", label: "Assigned ISA" },
    { value: "assignedOsa", label: "Assigned OSA" },
    {
      value: "notes",
      label: "Notes (Location, Timeframe, Motivation, Price, etc.)",
    },
    { value: "appointmentDate", label: "Appointment Date" },
    { value: "appointmentStartTime", label: "Start Time" },
    { value: "appointmentEndTime", label: "End Time" },
    { value: "appointmentLocation", label: "Appointment Location" },
    { value: "streetAddress", label: "Street Address" },
    { value: "addressLine2", label: "Address Line 2" },
    { value: "city", label: "City" },
    { value: "state", label: "State/Province/Region" },
    { value: "postalCode", label: "Postal Code" },
    { value: "appointmentType", label: "Appointment Type" },
  ],
  appointmentMet: [
    { value: "clientFirstName", label: "Client First Name" },
    { value: "clientLastName", label: "Client Last Name" },
    { value: "clientPhone", label: "Client Phone Number" },
    { value: "clientEmail", label: "Client Email" },
    { value: "leadType", label: "Client Type" },
    { value: "agentSubmitting", label: "Agent Submitting" },
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
  ],
  closed: [
    { value: "transactionType", label: "Is this a Rental/Lease/Referral?" },
    { value: "addressLine1", label: "Address" },
    { value: "city", label: "City" },
    { value: "state", label: "State" },
    { value: "postal", label: "Zip" },
    { value: "transactionAmount", label: "Transaction Amount" },
    { value: "securityDeposit", label: "Security Deposit" },
    { value: "monthlyRent", label: "Monthly Rent" },
    { value: "totalCommissionGci", label: "Total Commission GCI" },
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
