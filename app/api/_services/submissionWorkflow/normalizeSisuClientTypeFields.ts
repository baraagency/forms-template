import type { SISUCreateTransactionRequest } from "@/app/types/sisu";

function normalizeLeadTypeLabel(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * The Client Type field is mapped to SISU's type_id field. SISU expects
 * type_id "b"/"s", not UI labels like "Buyer"/"Seller", so translate here.
 */
export function normalizeSisuClientTypeFields(
  payload: SISUCreateTransactionRequest,
): SISUCreateTransactionRequest {
  const next: SISUCreateTransactionRequest = { ...payload };
  const normalized = normalizeLeadTypeLabel(next.type_id);

  if (normalized === "buyer" || normalized === "b") {
    next.type_id = "b";
    return next;
  }

  if (normalized === "seller" || normalized === "s") {
    next.type_id = "s";
    return next;
  }

  return next;
}
