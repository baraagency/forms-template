import type { SISUTransaction } from "@/app/types/sisu";

export function hasValidSisuTransactionId(
  transaction: SISUTransaction | null | undefined,
): boolean {
  if (!transaction) {
    return false;
  }

  return Boolean(transaction.transaction_id || transaction.id || transaction.client_id);
}

export function readStoredSisuTransactionId(
  formData: unknown,
): number | null {
  if (typeof formData !== "object" || formData === null || Array.isArray(formData)) {
    return null;
  }

  const value = (formData as { sisuTransactionId?: unknown }).sisuTransactionId;
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}
