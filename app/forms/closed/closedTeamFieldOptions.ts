import {
  getTeamFieldOptions,
  type TeamFieldCatalog,
  type TeamFieldSelectOption,
} from "../_core/teamFieldOptions";
import { CLOSED_TRANSACTION_TYPE_OPTIONS } from "./closedFieldConfig";

export const CLOSED_TRANSACTION_TYPE_FIELD_LABEL =
  "Is this a Rental/Lease/Referral?";

const transactionTypeFallbackOptions: TeamFieldSelectOption[] =
  CLOSED_TRANSACTION_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

const transactionTypeCandidates = [
  "transactionType",
  "transaction_type",
  "Rental/Lease/Referral",
  CLOSED_TRANSACTION_TYPE_FIELD_LABEL,
  "rental",
  "rentals_63",
] as const;

const clientTypeFallbackOptions: TeamFieldSelectOption[] = [
  { value: "Buyer", label: "Buyer" },
  { value: "Seller", label: "Seller" },
];

const clientTypeCandidates = [
  "clientType",
  "client_type",
  "Client Type",
  "lead_type_id",
  "type_id",
] as const;

export type ClosedSelectOptions = {
  transactionTypeOptions: TeamFieldSelectOption[];
  clientTypeOptions: TeamFieldSelectOption[];
};

function normalizeSelection(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeClientTypeOptions(
  options: TeamFieldSelectOption[],
): TeamFieldSelectOption[] {
  const normalizedOptions = options
    .map((option) => {
      const labelValue = normalizeSelection(option.label);
      const optionValue = normalizeSelection(option.value);

      if (labelValue === "buyer" || optionValue === "buyer") {
        return { value: "Buyer", label: option.label || "Buyer" };
      }
      if (labelValue === "seller" || optionValue === "seller") {
        return { value: "Seller", label: option.label || "Seller" };
      }

      return null;
    })
    .filter((option): option is TeamFieldSelectOption => option !== null);

  return normalizedOptions.length >= 2
    ? normalizedOptions
    : clientTypeFallbackOptions;
}

export function getClosedSelectOptions(fields: TeamFieldCatalog): ClosedSelectOptions {
  return {
    transactionTypeOptions: getTeamFieldOptions(
      fields,
      [...transactionTypeCandidates],
      transactionTypeFallbackOptions,
    ),
    clientTypeOptions: normalizeClientTypeOptions(
      getTeamFieldOptions(fields, [...clientTypeCandidates], clientTypeFallbackOptions),
    ),
  };
}

export function isSellerClientTypeSelection(value: string): boolean {
  return normalizeSelection(value) === "seller";
}

export function resolveTransactionTypeOption(
  value: string,
  transactionTypeOptions: TeamFieldSelectOption[],
): TeamFieldSelectOption | undefined {
  const normalized = normalizeSelection(value);
  return transactionTypeOptions.find(
    (option) =>
      option.value === value ||
      normalizeSelection(option.value) === normalized ||
      normalizeSelection(option.label) === normalized,
  );
}

export function isClosedLeaseOrRentalTransactionType(
  value: string,
  transactionTypeOptions: TeamFieldSelectOption[] = [],
): boolean {
  const normalized = normalizeSelection(value);
  if (normalized === "lease listing" || normalized === "rental/tenant") {
    return true;
  }

  const selectedOption = resolveTransactionTypeOption(value, transactionTypeOptions);
  if (!selectedOption) {
    return false;
  }

  const label = normalizeSelection(selectedOption.label);
  return label.includes("lease listing") || label.includes("rental/tenant");
}
