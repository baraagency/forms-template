import { describe, expect, it } from "bun:test";
import { loader } from "../route";

describe("sisu vendors route (mock)", () => {
  it("returns grouped vendor options", async () => {
    const response = await loader();
    const payload = (await response.json()) as {
      vendors?: {
        attorney?: Array<{ value: string }>;
        mortgageCompany?: Array<{ value: string }>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.vendors?.attorney?.length).toBeGreaterThan(0);
    expect(payload.vendors?.mortgageCompany?.length).toBeGreaterThan(0);
  });
});
