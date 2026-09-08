import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const isSisuApiEnabledMock = mock(() => false);

mock.module("@/app/api/_services/sisuApiMode", () => ({
  isSisuApiEnabled: isSisuApiEnabledMock,
}));

const { loader } = await import("../route");

describe("sisu transactions by-fub-deal route (mock)", () => {
  beforeEach(() => {
    isSisuApiEnabledMock.mockReturnValue(false);
  });

  afterEach(() => {
    isSisuApiEnabledMock.mockReset();
    isSisuApiEnabledMock.mockReturnValue(false);
  });

  it("returns the template transaction for the fixture deal id", async () => {
    const response = await loader({
      request: new Request(
        "http://localhost/api/sisu/transactions/by-fub-deal?dealId=456",
      ),
    });
    const payload = (await response.json()) as {
      transaction?: { fub_deal_id?: string };
    };

    expect(response.status).toBe(200);
    expect(payload.transaction?.fub_deal_id).toBe("456");
  });
});
