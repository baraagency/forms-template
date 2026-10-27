import type { FieldBlockProps, FormPageData } from "../editor/formPageTypes";

const yesNoOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const financingOptions = [
  "Cash",
  "Conventional",
  "FHA",
  "VA",
  "Other",
  "USDA",
  "Seller Financed",
  "Assume Mortgage",
].map((value) => ({ label: value, value }));

const outsideReferralOptions = [
  "No",
  "Outside Referral",
  "Rebate",
  "Referral and Rebate",
].map((value) => ({ label: value, value }));

// Demo fallback snapshot; publishing refreshes from the SISU vendor catalog.
const mortgageCompanyOptions = [
  { label: "Other", value: "184058" },
  { label: "None", value: "None" },
  { label: "Sample Mortgage Co", value: "2001" },
];

const secondaryVisibleWhen = [
  { fieldId: "hasSecondaryClient", operator: "equals" as const, values: ["yes"] },
];

const mortgageOtherVisibleWhen = [
  {
    fieldId: "mortgageCompany",
    operator: "in" as const,
    values: ["Other", "184058", "other"],
  },
];

const outsideReferralVisibleWhen = [
  { fieldId: "outsideReferral", operator: "isFilled" as const },
  { fieldId: "outsideReferral", operator: "notEquals" as const, values: ["No"] },
  { fieldId: "outsideReferral", operator: "notEquals" as const, values: ["Rebate"] },
  { fieldId: "outsideReferral", operator: "notEquals" as const, values: ["None"] },
  { fieldId: "outsideReferral", operator: "notEquals" as const, values: ["0"] },
  { fieldId: "outsideReferral", operator: "notEquals" as const, values: ["3"] },
];

const sellerVisibleWhen = [
  { fieldId: "clientType", operator: "equals" as const, values: ["Seller"] },
];

const sellerDueDiligenceVisibleWhen = [
  ...sellerVisibleWhen,
  {
    fieldId: "dueDiligencePeriod",
    operator: "equals" as const,
    values: ["yes"],
  },
];

const sellerContingenciesVisibleWhen = [
  ...sellerVisibleWhen,
  { fieldId: "contingencies", operator: "equals" as const, values: ["yes"] },
];

function field(props: FieldBlockProps) {
  return { type: "FieldBlock" as const, props };
}

export const PENDING_PAGE_DOCUMENT: FormPageData = {
  content: [
    { type: "PageTitle", props: { id: "pending-title", text: "Pending" } },
    {
      type: "TextBlock",
      props: {
        id: "pending-intro",
        text: "Complete the under-contract transaction intake for this client.",
      },
    },
    { type: "SectionHeader", props: { id: "client-header", title: "Client Info" } },
    field({
      id: "clientFirstName",
      label: "Client First Name",
      kind: "text",
      required: true,
    }),
    field({
      id: "clientLastName",
      label: "Client Last Name",
      kind: "text",
      required: true,
    }),
    field({
      id: "clientPhone",
      label: "Client Phone Number",
      kind: "phone",
      required: true,
    }),
    field({
      id: "clientEmail",
      label: "Client Email",
      kind: "email",
      required: true,
    }),
    field({
      id: "hasSecondaryClient",
      label: "Is there a secondary client?",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "manual",
      options: yesNoOptions,
    }),
    field({
      id: "secondaryContact",
      label: "Secondary Client Name",
      kind: "text",
      required: true,
      visibleWhen: secondaryVisibleWhen,
    }),
    field({
      id: "secondaryContactPhone",
      label: "Secondary Client Phone",
      kind: "phone",
      required: true,
      visibleWhen: secondaryVisibleWhen,
    }),
    field({
      id: "secondaryContactEmail",
      label: "Secondary Client Email",
      kind: "email",
      required: true,
      visibleWhen: secondaryVisibleWhen,
    }),
    field({
      id: "clientType",
      label: "Client Type",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "manual",
      options: [
        { label: "Buyer", value: "Buyer" },
        { label: "Seller", value: "Seller" },
      ],
    }),
    field({
      id: "transactionAmount",
      label: "Transaction Amount",
      kind: "currency",
      required: true,
    }),
    field({
      id: "addressLine1",
      label: "Street Address",
      kind: "text",
      required: true,
    }),
    field({
      id: "addressLine2",
      label: "Address Line 2",
      kind: "text",
      required: false,
    }),
    field({
      id: "city",
      label: "City",
      kind: "text",
      required: true,
    }),
    field({
      id: "state",
      label: "State/Province/Region",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "usStates",
    }),
    field({
      id: "postal",
      label: "Postal Code",
      kind: "text",
      required: true,
    }),
    { type: "SectionHeader", props: { id: "financing-header", title: "Financing" } },
    field({
      id: "financingType",
      label: "Financing Type",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "sisu",
      sisuFieldKey: "financing",
      options: financingOptions,
    }),
    field({
      id: "mortgageCompany",
      label: "Mortgage Company",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "sisuVendors",
      optionFilter: "mortgageCompany",
      options: mortgageCompanyOptions,
      disableWhenEmpty: true,
    }),
    field({
      id: "mortgageCompanyName",
      label: "Mortgage Company Name",
      kind: "text",
      required: true,
      visibleWhen: mortgageOtherVisibleWhen,
    }),
    field({
      id: "loanOfficerName",
      label: "Loan Officer Name",
      kind: "text",
      required: false,
      visibleWhen: mortgageOtherVisibleWhen,
    }),
    field({
      id: "loanOfficerEmail",
      label: "Loan Officer Email",
      kind: "email",
      required: false,
      visibleWhen: mortgageOtherVisibleWhen,
    }),
    {
      type: "SectionHeader",
      props: { id: "additional-header", title: "Additional Details" },
    },
    field({
      id: "underContractDate",
      label: "Under Contract Date",
      kind: "date",
      required: true,
      dateConstraint: "any",
    }),
    field({
      id: "forecastedClosedDate",
      label: "Forecasted Closed Date",
      kind: "date",
      required: true,
      dateConstraint: "any",
    }),
    field({
      id: "outsideReferral",
      label: "Outside Referral/Rebate?",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "sisu",
      sisuFieldKey: "outside_referral",
      options: outsideReferralOptions,
    }),
    field({
      id: "referralPercent",
      label: "Referral Percent",
      kind: "percentage",
      required: false,
      visibleWhen: outsideReferralVisibleWhen,
    }),
    field({
      id: "referralAmount",
      label: "Referral Amount",
      kind: "currency",
      required: false,
      visibleWhen: outsideReferralVisibleWhen,
    }),
    field({
      id: "referralMailingAddress",
      label: "Referral Mailing Address",
      kind: "text",
      required: false,
      visibleWhen: outsideReferralVisibleWhen,
    }),
    field({
      id: "otherAgentName",
      label: "Coop Agent Name",
      kind: "text",
      required: true,
    }),
    field({
      id: "otherAgentPhone",
      label: "Coop Agent Phone",
      kind: "phone",
      required: false,
    }),
    field({
      id: "otherAgentEmail",
      label: "Coop Agent Email",
      kind: "email",
      required: true,
    }),
    field({
      id: "otherAgentCompany",
      label: "Coop Agent Company",
      kind: "text",
      required: false,
    }),
    field({
      id: "dueDiligencePeriod",
      label: "Is there a due diligence period?",
      kind: "choice",
      required: false,
      display: "select",
      optionSource: "sisu",
      sisuFieldKey: "dueDiligencePeriod",
      options: yesNoOptions,
      visibleWhen: sellerVisibleWhen,
    }),
    field({
      id: "dueDiligenceDeadline",
      label: "Due Diligence Deadline",
      kind: "date",
      required: true,
      dateConstraint: "any",
      visibleWhen: sellerDueDiligenceVisibleWhen,
    }),
    field({
      id: "contingencies",
      label: "Are there contingencies?",
      kind: "choice",
      required: false,
      display: "select",
      optionSource: "sisu",
      sisuFieldKey: "contingencies",
      options: yesNoOptions,
      visibleWhen: sellerVisibleWhen,
    }),
    field({
      id: "sellerCompensationPercent",
      label: "Seller Compensation to Buyer Broker (%)",
      kind: "percentage",
      required: false,
      visibleWhen: sellerVisibleWhen,
    }),
    field({
      id: "contingencyDetails",
      label: "Contingencies",
      kind: "text",
      required: true,
      multiline: true,
      visibleWhen: sellerContingenciesVisibleWhen,
    }),
  ],
  root: { props: {} },
};
