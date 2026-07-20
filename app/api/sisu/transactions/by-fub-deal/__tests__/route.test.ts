import { describe, expect, it } from "bun:test";
import { loader } from "../route";

describe("sisu transactions by-fub-deal route (mock)", () => {
  it("returns the template transaction for the fixture deal id", async () => {
    const response = await loader({
      request: new Request(
        "http://localhost/api/sisu/transactions/by-fub-deal?dealId=456",
      ),
      params: {},
    });
    const payload = (await response.json()) as {
      transaction?: { fub_deal_id?: string };
    };

    expect(response.status).toBe(200);
    expect(payload.transaction?.fub_deal_id).toBe("456");
  });
});
