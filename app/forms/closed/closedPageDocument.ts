import { CLOSED_TRANSACTION_TYPE_OPTIONS } from "./closedFieldConfig";
import type { FieldBlockProps, FormPageData } from "../editor/formPageTypes";

const transactionTypeOptions = CLOSED_TRANSACTION_TYPE_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

function field(props: FieldBlockProps) {
  return { type: "FieldBlock" as const, props };
}

export const CLOSED_PAGE_DOCUMENT: FormPageData = {
  content: [
    {
      type: "PageTitle",
      props: { id: "closed-title", text: "Closed" },
    },
    {
      type: "TextBlock",
      props: {
        id: "closed-intro",
        text: "Capture closed transaction details for this lead.",
      },
    },
    {
      type: "SectionHeader",
      props: { id: "transaction-header", title: "Transaction Data" },
    },
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
      id: "transactionType",
      label: "Is this a Rental/Lease/Referral?",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "sisu",
      sisuFieldKey: "transactionType",
      options: transactionTypeOptions,
    }),
    field({
      id: "addressLine1",
      label: "Address",
      kind: "text",
      required: true,
    }),
    field({
      id: "city",
      label: "City",
      kind: "text",
      required: true,
    }),
    field({
      id: "state",
      label: "State",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "usStates",
    }),
    field({
      id: "postal",
      label: "Zip",
      kind: "text",
      required: true,
    }),
    field({
      id: "transactionAmount",
      label: "Transaction Amount",
      kind: "currency",
      required: true,
    }),
    field({
      id: "securityDeposit",
      label: "Security Deposit",
      kind: "currency",
      required: true,
      visibleWhen: [
        {
          fieldId: "transactionType",
          operator: "in",
          values: ["Lease Listing", "Rental/Tenant"],
        },
      ],
    }),
    field({
      id: "monthlyRent",
      label: "Monthly Rent",
      kind: "currency",
      required: true,
      visibleWhen: [
        {
          fieldId: "transactionType",
          operator: "in",
          values: ["Lease Listing", "Rental/Tenant"],
        },
      ],
    }),
    field({
      id: "totalCommissionGci",
      label: "Total Commission GCI",
      kind: "currency",
      required: true,
    }),
    {
      type: "SectionHeader",
      props: { id: "dates-header", title: "Transaction Dates" },
    },
    field({
      id: "settlementDate",
      label: "Closed Date",
      kind: "date",
      required: true,
      dateConstraint: "past",
    }),
    field({
      id: "tcMarketingNotes",
      label: "Notes",
      kind: "text",
      required: false,
      multiline: true,
    }),
  ],
  root: { props: {} },
};
