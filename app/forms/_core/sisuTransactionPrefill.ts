import type { SISUTransaction } from "@/app/types/sisu";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function toSisuStringValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
}

export function normalizeSisuYesNoToLower(value: string): string {
  const normalizedValue = value.trim().toLowerCase();
  if (["yes", "y", "true", "0"].includes(normalizedValue)) {
    return "yes";
  }
  if (["no", "n", "false", "1"].includes(normalizedValue)) {
    return "no";
  }
  return value;
}

export function normalizeSisuYesNoToTitle(value: string): string {
  const normalizedValue = normalizeSisuYesNoToLower(value);
  if (normalizedValue === "yes") {
    return "Yes";
  }
  if (normalizedValue === "no") {
    return "No";
  }
  return value;
}

export function readSisuValue(transaction: SISUTransaction, keys: string[]): string {
  const sources = [
    transaction as Record<string, unknown>,
    asRecord(transaction.custom),
    asRecord(transaction.contact),
  ];

  for (const source of sources) {
    for (const key of keys) {
      const stringValue = toSisuStringValue(source[key]);
      if (stringValue) {
        return stringValue;
      }
    }
  }

  return "";
}

export function getResolvedSisuTransactionId(transaction: SISUTransaction): string {
  return readSisuValue(transaction, ["transaction_id", "id", "client_id"]);
}

export function formatSisuCurrencyValue(value: unknown): string {
  const stringValue = toSisuStringValue(value);
  if (!stringValue) {
    return "";
  }

  const normalizedValue = stringValue.replace(/[$,\s]/g, "");
  const numericValue = Number(normalizedValue);
  if (!Number.isFinite(numericValue)) {
    return stringValue;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function formatSisuPercentageValue(value: unknown): string {
  const stringValue = toSisuStringValue(value);
  if (!stringValue) {
    return "";
  }

  const normalizedValue = stringValue.replace(/[%\s]/g, "");
  const numericValue = Number(normalizedValue);
  if (!Number.isFinite(numericValue)) {
    return stringValue;
  }

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)}%`;
}

export function formatSisuDateValue(value: unknown): string {
  const stringValue = toSisuStringValue(value).trim();
  if (!stringValue) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const parsedDate = new Date(stringValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return stringValue;
  }

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
