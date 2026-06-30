import { describe, expect, it } from "bun:test";
import { GET } from "../route";

describe("sisu transactions by-fub-deal route (mock)", () => {
  it("returns the template transaction for the fixture deal id", async () => {
    const response = await GET(
      new Request("http://localhost/api/sisu/transactions/by-fub-deal?dealId=456"),
    );
    const payload = (await response.json()) as {
      transaction?: { fub_deal_id?: string };
    };

    expect(response.status).toBe(200);
    expect(payload.transaction?.fub_deal_id).toBe("456");
  });
});
