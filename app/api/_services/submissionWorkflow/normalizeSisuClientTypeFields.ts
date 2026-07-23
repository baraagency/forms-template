import type { SISUCreateTransactionRequest } from "@/app/types/sisu";

function normalizeLeadTypeLabel(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * SISU expects client_type keys (0/1/2) and type_id (b/s), not UI labels like "Buyer".
 */
export function normalizeSisuClientTypeFields(
  payload: SISUCreateTransactionRequest,
): SISUCreateTransactionRequest {
  const next: SISUCreateTransactionRequest = { ...payload };
  const raw = next.client_type;
  const normalized = normalizeLeadTypeLabel(raw);

  if (
    normalized === "buyer" ||
    normalized === "0" ||
    normalized === "b"
  ) {
    next.client_type = "0";
    if (!next.type_id) {
      next.type_id = "b";
    }
    return next;
  }

  if (
    normalized === "seller" ||
    normalized === "1" ||
    normalized === "s"
  ) {
    next.client_type = "1";
    if (!next.type_id) {
      next.type_id = "s";
    }
    return next;
  }

  if (
    normalized === "buyerseller" ||
    normalized === "buyer seller" ||
    normalized === "buyer/seller" ||
    normalized === "buyer and seller" ||
    normalized === "2"
  ) {
    next.client_type = "2";
    return next;
  }

  return next;
}
