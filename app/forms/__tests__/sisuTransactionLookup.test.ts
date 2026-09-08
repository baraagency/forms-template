import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
  buildUrlWithoutSisuTransactionId,
  getSisuTransactionId,
  resolveSisuTransactionLookup,
  resolveRetainedSisuTransactionId,
  shouldClearDiscardedSisuTransactionId,
  shouldShowSisuTransactionLookupWarning,
  SISU_TRANSACTION_NOT_FOUND_WARNING,
  shouldResolveSisuTransactionLookup,
} from "../_core/sisuTransactionLookup";

const fetchMock = mock();

globalThis.fetch = fetchMock as unknown as typeof fetch;

describe("sisuTransactionLookup", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it("uses a valid passed SISU transaction id before looking up by FUB deal", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ transaction: { transaction_id: "999" } }),
        { status: 200 },
      ),
    );

    const result = await resolveSisuTransactionLookup({
      sisuTransactionId: "999",
      dealId: "12345",
    });

    expect(result).toEqual({
      source: "transaction-id",
      transaction: { transaction_id: "999" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("/api/sisu/transactions/999");
  });

  it("falls back to the FUB deal lookup and then fetches the resolved SISU transaction", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Not found" }), {
          status: 404,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ transaction: { transaction_id: "777", first_name: "Search" } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ transaction: { transaction_id: "777", first_name: "Full" } }),
          { status: 200 },
        ),
      );

    const result = await resolveSisuTransactionLookup({
      sisuTransactionId: "999",
      dealId: "12345",
    });

    expect(result).toEqual({
      source: "fub-deal",
      transaction: { transaction_id: "777", first_name: "Full" },
      discardedSisuTransactionId: "999",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toBe(
      "/api/sisu/transactions/by-fub-deal?dealId=12345",
    );
    expect(String(fetchMock.mock.calls[2][0])).toBe("/api/sisu/transactions/777");
  });

  it("reports a discarded SISU transaction id when SISU says the client is unavailable", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Client information not available for this client",
          }),
          { status: 403 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Not found" }), {
          status: 404,
        }),
      );

    const result = await resolveSisuTransactionLookup({
      sisuTransactionId: "6495594",
      dealId: "12345",
    });

    expect(result).toEqual({
      source: "none",
      transaction: null,
      discardedSisuTransactionId: "6495594",
      error: SISU_TRANSACTION_NOT_FOUND_WARNING,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toBe(
      "/api/sisu/transactions/by-fub-deal?dealId=12345",
    );
  });

  it("does not use a FUB-deal SISU transaction when the search result lacks a valid id", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ transaction: { first_name: "Partial", fub_deal_id: "12345" } }),
        { status: 200 },
      ),
    );

    const result = await resolveSisuTransactionLookup({
      sisuTransactionId: "",
      dealId: "12345",
    });

    expect(result).toEqual({
      source: "none",
      transaction: null,
      discardedSisuTransactionId: undefined,
      error: SISU_TRANSACTION_NOT_FOUND_WARNING,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not use a FUB-deal SISU transaction when the full transaction is unavailable", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ transaction: { transaction_id: "777", first_name: "Search" } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Client information not available for this client",
          }),
          { status: 403 },
        ),
      );

    const result = await resolveSisuTransactionLookup({
      sisuTransactionId: "",
      dealId: "12345",
    });

    expect(result).toEqual({
      source: "none",
      transaction: null,
      discardedSisuTransactionId: "777",
      error: SISU_TRANSACTION_NOT_FOUND_WARNING,
    });
  });

  it("unwraps transaction data returned under the client key", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          transaction: {
            client: { transaction_id: "999", first_name: "Jane" },
            status: "Success",
          },
        }),
        { status: 200 },
      ),
    );

    const result = await resolveSisuTransactionLookup({
      sisuTransactionId: "999",
      dealId: "12345",
    });

    expect(result).toEqual({
      source: "transaction-id",
      transaction: { transaction_id: "999", first_name: "Jane" },
    });
  });

  it("returns the not-found warning when SISU responds with a fetch error", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Server error" }), {
        status: 500,
      }),
    );

    const result = await resolveSisuTransactionLookup({
      sisuTransactionId: "999",
      dealId: "12345",
    });

    expect(result).toEqual({
      source: "none",
      transaction: null,
      discardedSisuTransactionId: undefined,
      error: SISU_TRANSACTION_NOT_FOUND_WARNING,
    });
  });

  it("extracts transaction ids from known SISU transaction id fields", () => {
    expect(getSisuTransactionId({ transaction_id: "999" })).toBe("999");
    expect(getSisuTransactionId({ id: 888 })).toBe("888");
    expect(getSisuTransactionId({ client_id: "777" })).toBe("777");
    expect(getSisuTransactionId({ transaction_id: "" })).toBeNull();
  });

  it("removes only the SISU transaction id from a URL", () => {
    expect(
      buildUrlWithoutSisuTransactionId(
        "http://localhost/forms/pending?clientId=123&sisuTransactionId=6495594&dealId=456",
      ),
    ).toBe("http://localhost/forms/pending?clientId=123&dealId=456");
  });

  it("runs lookup when either a SISU transaction id or usable FUB deal id is present", () => {
    expect(
      shouldResolveSisuTransactionLookup({
        sisuTransactionId: "999",
        dealId: "",
      }),
    ).toBe(true);
    expect(
      shouldResolveSisuTransactionLookup({
        sisuTransactionId: "",
        dealId: "12345",
      }),
    ).toBe(true);
    expect(
      shouldResolveSisuTransactionLookup({
        sisuTransactionId: "",
        dealId: "create-new",
      }),
    ).toBe(false);
    expect(shouldResolveSisuTransactionLookup({})).toBe(false);
  });

  it("does not show the lookup warning when a trusted SISU id is already present", () => {
    expect(shouldShowSisuTransactionLookupWarning("6747374")).toBe(false);
    expect(shouldShowSisuTransactionLookupWarning("")).toBe(true);
  });

  it("resolves retained SISU ids from loader prefill before URL state", () => {
    expect(
      resolveRetainedSisuTransactionId({
        previousSubmissionFormData: { sisuTransactionId: "6747374" },
        trustedPrefilledSisuTransactionId: null,
        currentSisuTransactionId: "",
      }),
    ).toBe("6747374");
  });

  it("keeps trusted prefilled SISU ids when live lookup discards the id", () => {
    expect(
      shouldClearDiscardedSisuTransactionId("6747374", "6747374", "6747374"),
    ).toBe(false);
    expect(
      shouldClearDiscardedSisuTransactionId("6747374", "6747374", null),
    ).toBe(true);
  });
});
