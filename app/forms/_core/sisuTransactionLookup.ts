import type { JsonValue } from "@/app/types/storage";
import type { SISUTransaction } from "@/app/types/sisu";

export const SISU_TRANSACTION_NOT_FOUND_WARNING =
  "SISU Transaction not found. Submitting will create a new transaction for the selected deal.";

export type SisuTransactionLookupSource = "transaction-id" | "fub-deal" | "none";

export type SisuTransactionLookupResult = {
  source: SisuTransactionLookupSource;
  transaction: SISUTransaction | null;
  discardedSisuTransactionId?: string;
  error?: string;
};

type MaybeWrappedSisuTransaction = SISUTransaction & {
  client?: SISUTransaction;
};

function parsePositiveId(value: string | number | undefined | null): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : null;
}

export function shouldResolveSisuTransactionLookup({
  sisuTransactionId,
  dealId,
}: {
  sisuTransactionId?: string;
  dealId?: string;
}): boolean {
  return Boolean(parsePositiveId(sisuTransactionId) || parsePositiveId(dealId));
}

export function readPrefilledSisuTransactionId(
  formData: JsonValue | null | undefined,
): string | null {
  if (typeof formData !== "object" || formData === null || Array.isArray(formData)) {
    return null;
  }

  return parsePositiveId(
    (formData as { sisuTransactionId?: unknown }).sisuTransactionId as
      | string
      | number
      | undefined,
  );
}

export function shouldShowSisuTransactionLookupWarning(
  sisuTransactionId?: string | null,
): boolean {
  return !parsePositiveId(sisuTransactionId ?? undefined);
}

export function resolveRetainedSisuTransactionId({
  previousSubmissionFormData,
  trustedPrefilledSisuTransactionId,
  currentSisuTransactionId,
}: {
  previousSubmissionFormData?: JsonValue | null;
  trustedPrefilledSisuTransactionId?: string | null;
  currentSisuTransactionId?: string | null;
}): string | null {
  return (
    readPrefilledSisuTransactionId(previousSubmissionFormData) ??
    parsePositiveId(trustedPrefilledSisuTransactionId ?? undefined) ??
    parsePositiveId(currentSisuTransactionId ?? undefined)
  );
}

export function shouldClearDiscardedSisuTransactionId(
  currentSisuTransactionId: string,
  discardedSisuTransactionId?: string,
  trustedPrefilledSisuTransactionId?: string | null,
): boolean {
  if (
    !discardedSisuTransactionId ||
    currentSisuTransactionId !== discardedSisuTransactionId
  ) {
    return false;
  }

  return discardedSisuTransactionId !== trustedPrefilledSisuTransactionId;
}

async function readMessageFromResponse(response: Response): Promise<string | null> {
  const payload = (await response.json().catch(() => null)) as {
    message?: unknown;
  } | null;

  return typeof payload?.message === "string" ? payload.message : null;
}

function isUnavailableSisuTransactionResponse(
  response: Response,
  message: string | null,
): boolean {
  return (
    response.status === 404 ||
    (response.status === 403 &&
      typeof message === "string" &&
      message
        .toLowerCase()
        .includes("client information not available for this client"))
  );
}

async function fetchSisuTransaction(
  url: string,
  signal?: AbortSignal,
  { requireTransactionId = true }: { requireTransactionId?: boolean } = {},
): Promise<SISUTransaction | null> {
  const response = await fetch(url, { signal });
  const message = !response.ok ? await readMessageFromResponse(response) : null;

  if (!response.ok) {
    if (isUnavailableSisuTransactionResponse(response, message)) {
      return null;
    }

    throw new Error(message ?? `Unable to load SISU transaction (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as {
    transaction?: MaybeWrappedSisuTransaction | null;
  };
  const transaction = normalizeSisuTransaction(payload.transaction ?? null);

  if (!transaction) {
    return null;
  }

  if (requireTransactionId && !getSisuTransactionId(transaction)) {
    return null;
  }

  return transaction;
}

function normalizeSisuTransaction(
  transaction: MaybeWrappedSisuTransaction | null | undefined,
): SISUTransaction | null {
  if (
    transaction?.client &&
    typeof transaction.client === "object" &&
    !Array.isArray(transaction.client)
  ) {
    return transaction.client;
  }

  return transaction ?? null;
}

export function getSisuTransactionId(
  transaction: SISUTransaction | null | undefined,
): string | null {
  const normalizedTransaction = normalizeSisuTransaction(
    transaction as MaybeWrappedSisuTransaction | null | undefined,
  );

  if (!normalizedTransaction) {
    return null;
  }

  return (
    parsePositiveId(normalizedTransaction.transaction_id) ??
    parsePositiveId(normalizedTransaction.id) ??
    parsePositiveId(normalizedTransaction.client_id)
  );
}

export function buildUrlWithoutSisuTransactionId(url: string): string {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.delete("sisuTransactionId");
  return parsedUrl.toString();
}

export function removeSisuTransactionIdFromCurrentUrl(): void {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = buildUrlWithoutSisuTransactionId(window.location.href);
  if (nextUrl !== window.location.href) {
    window.history.replaceState(window.history.state, "", nextUrl);
  }
}

export function clearDiscardedSisuTransactionId<
  T extends { sisuTransactionId: string },
>(state: T, discardedSisuTransactionId?: string): T {
  if (
    !discardedSisuTransactionId ||
    state.sisuTransactionId !== discardedSisuTransactionId
  ) {
    return state;
  }

  return { ...state, sisuTransactionId: "" };
}

function buildSisuTransactionNotFoundResult(
  discardedSisuTransactionId?: string,
): SisuTransactionLookupResult {
  return {
    source: "none",
    transaction: null,
    discardedSisuTransactionId,
    error: SISU_TRANSACTION_NOT_FOUND_WARNING,
  };
}

export async function resolveSisuTransactionLookup({
  sisuTransactionId,
  dealId,
  signal,
}: {
  sisuTransactionId?: string;
  dealId?: string;
  signal?: AbortSignal;
}): Promise<SisuTransactionLookupResult> {
  const parsedSisuTransactionId = parsePositiveId(sisuTransactionId);
  const parsedDealId = parsePositiveId(dealId);
  let discardedSisuTransactionId: string | undefined;

  try {
    if (parsedSisuTransactionId) {
      const transaction = await fetchSisuTransaction(
        `/api/sisu/transactions/${encodeURIComponent(parsedSisuTransactionId)}`,
        signal,
      );

      if (transaction) {
        return { source: "transaction-id", transaction };
      }

      discardedSisuTransactionId = parsedSisuTransactionId;
    }

    if (parsedDealId) {
      const transaction = await fetchSisuTransaction(
        `/api/sisu/transactions/by-fub-deal?dealId=${encodeURIComponent(parsedDealId)}`,
        signal,
        { requireTransactionId: false },
      );

      if (transaction) {
        const resolvedTransactionId = getSisuTransactionId(transaction);

        if (!resolvedTransactionId) {
          return buildSisuTransactionNotFoundResult(discardedSisuTransactionId);
        }

        const fullTransaction = await fetchSisuTransaction(
          `/api/sisu/transactions/${encodeURIComponent(resolvedTransactionId)}`,
          signal,
        );

        if (!fullTransaction) {
          return buildSisuTransactionNotFoundResult(
            discardedSisuTransactionId ?? resolvedTransactionId,
          );
        }

        return {
          source: "fub-deal",
          transaction: fullTransaction,
          discardedSisuTransactionId,
        };
      }
    }

    return buildSisuTransactionNotFoundResult(discardedSisuTransactionId);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    return buildSisuTransactionNotFoundResult(discardedSisuTransactionId);
  }
}
