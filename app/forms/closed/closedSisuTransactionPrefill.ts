import type { ClosedFormState } from "./closedFormUtils";
import {
  CLOSED_SISU_DEFAULT_FIELD_TYPES,
  CLOSED_SISU_FIELD_KEYS,
  type ClosedSisuFieldKey,
} from "./closedFieldConfig";
import type { SISUTransaction } from "@/app/types/sisu";
import { formatCurrencyInput } from "../_core/formatUtils";
import {
  formatSisuDateValue,
  getResolvedSisuTransactionId,
  readSisuValue,
  toSisuStringValue,
} from "../_core/sisuTransactionPrefill";

const CLOSED_MAPPING_FIELD_TO_FORM_STATE: Record<
  ClosedSisuFieldKey,
  keyof ClosedFormState
> = {
  fubId: "personId",
  fubDealId: "dealId",
  sisuTransactionId: "sisuTransactionId",
  transactionType: "transactionType",
  addressLine1: "addressLine1",
  city: "city",
  state: "state",
  postal: "postal",
  transactionAmount: "transactionAmount",
  securityDeposit: "securityDeposit",
  monthlyRent: "monthlyRent",
  totalCommissionGci: "totalCommissionGci",
  settlementDate: "settlementDate",
  tcMarketingNotes: "tcMarketingNotes",
};

const CLOSED_AMOUNT_FIELDS = new Set<keyof ClosedFormState>([
  "transactionAmount",
  "securityDeposit",
  "monthlyRent",
  "totalCommissionGci",
]);

const CLOSED_DATE_FIELDS = new Set<keyof ClosedFormState>(["settlementDate"]);

function deriveClosedClientTypeFromSisu(transaction: SISUTransaction): string {
  const typeId = readSisuValue(transaction, ["type_id"]).trim().toLowerCase();
  if (typeId === "s" || typeId === "seller") {
    return "Seller";
  }
  if (typeId === "b" || typeId === "buyer") {
    return "Buyer";
  }

  const clientType = readSisuValue(transaction, ["client_type"]).trim().toLowerCase();
  if (clientType === "seller") {
    return "Seller";
  }
  if (clientType === "buyer") {
    return "Buyer";
  }

  return "";
}

function parsePositiveId(value: string | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
}

export function shouldResolveClosedSisuTransactionPrefill(
  sisuTransactionId?: string,
): boolean {
  return parsePositiveId(sisuTransactionId);
}

function formatClosedFormPrefillValue(
  formField: keyof ClosedFormState,
  rawValue: unknown,
  fieldType: string | null | undefined,
): string {
  if (rawValue === undefined || rawValue === null) {
    return "";
  }

  const normalizedFieldType = (
    fieldType ??
    CLOSED_SISU_DEFAULT_FIELD_TYPES[formField as ClosedSisuFieldKey] ??
    "string"
  )
    .trim()
    .toLowerCase();

  if (
    CLOSED_AMOUNT_FIELDS.has(formField) ||
    ["amount", "currency", "float", "number"].includes(normalizedFieldType)
  ) {
    return formatCurrencyInput(toSisuStringValue(rawValue));
  }

  if (CLOSED_DATE_FIELDS.has(formField) || normalizedFieldType === "date") {
    return formatSisuDateValue(rawValue);
  }

  return toSisuStringValue(rawValue);
}

export function applyClosedSisuTransactionPrefill(
  current: ClosedFormState,
  transaction: SISUTransaction,
): ClosedFormState {
  const next: ClosedFormState = {
    ...current,
    sisuTransactionId:
      getResolvedSisuTransactionId(transaction) || current.sisuTransactionId,
    personId:
      current.personId || readSisuValue(transaction, [...CLOSED_SISU_FIELD_KEYS.fubId]),
    dealId:
      current.dealId || readSisuValue(transaction, [...CLOSED_SISU_FIELD_KEYS.fubDealId]),
    clientType: current.clientType || deriveClosedClientTypeFromSisu(transaction),
  };

  for (const fieldName of Object.keys(CLOSED_SISU_FIELD_KEYS) as ClosedSisuFieldKey[]) {
    if (
      fieldName === "fubId" ||
      fieldName === "fubDealId" ||
      fieldName === "sisuTransactionId"
    ) {
      continue;
    }

    const formField = CLOSED_MAPPING_FIELD_TO_FORM_STATE[fieldName];
    if (current[formField]) {
      continue;
    }

    const formatted = formatClosedFormPrefillValue(
      formField,
      readSisuValue(transaction, [...CLOSED_SISU_FIELD_KEYS[fieldName]]),
      CLOSED_SISU_DEFAULT_FIELD_TYPES[fieldName],
    );
    if (formatted) {
      next[formField] = formatted;
    }
  }

  return next;
}
