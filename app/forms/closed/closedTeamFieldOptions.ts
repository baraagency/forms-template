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

export type ClosedSelectOptions = {
  transactionTypeOptions: TeamFieldSelectOption[];
};

export function getClosedSelectOptions(fields: TeamFieldCatalog): ClosedSelectOptions {
  return {
    transactionTypeOptions: getTeamFieldOptions(
      fields,
      [...transactionTypeCandidates],
      transactionTypeFallbackOptions,
    ),
  };
}

function normalizeSelection(value: string): string {
  return value.trim().toLowerCase();
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
