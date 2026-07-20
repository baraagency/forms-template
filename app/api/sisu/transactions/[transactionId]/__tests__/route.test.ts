import { describe, expect, it } from "bun:test";
import { loader } from "../route";

describe("sisu transactions route (mock)", () => {
  it("returns the template transaction fixture", async () => {
    const response = await loader({
      request: new Request("http://localhost"),
      params: { transactionId: "789" },
    });
    const payload = (await response.json()) as {
      transaction?: { transaction_id?: number };
    };

    expect(response.status).toBe(200);
    expect(payload.transaction?.transaction_id).toBe(789);
  });

  it("returns 404 for unknown transaction ids", async () => {
    const response = await loader({
      request: new Request("http://localhost"),
      params: { transactionId: "999" },
    });

    expect(response.status).toBe(404);
  });
});
