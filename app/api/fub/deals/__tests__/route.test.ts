import { afterEach, describe, expect, it } from "bun:test";
import { loader } from "../route";

const originalFubKey = process.env.FUB_API_KEY;
const originalDemoMode = process.env.DEMO_MODE;

afterEach(() => {
  if (originalFubKey === undefined) {
    delete process.env.FUB_API_KEY;
  } else {
    process.env.FUB_API_KEY = originalFubKey;
  }
  if (originalDemoMode === undefined) {
    delete process.env.DEMO_MODE;
  } else {
    process.env.DEMO_MODE = originalDemoMode;
  }
});

describe("GET /api/fub/deals", () => {
  it("returns fixture deals when FUB_API_KEY is unset", async () => {
    delete process.env.FUB_API_KEY;
    delete process.env.DEMO_MODE;

    const response = await loader({
      request: new Request("http://localhost/api/fub/deals?personId=123"),
    });
    const payload = (await response.json()) as {
      deals?: Array<{ id: number; name: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.deals?.[0]?.id).toBe(456);
    expect(payload.deals?.[0]?.name).toBe("Jane Client - Pending");
  });

  it("returns fixture deals when Demo Mode is on even if FUB_API_KEY is set", async () => {
    process.env.FUB_API_KEY = "test-key";
    process.env.DEMO_MODE = "true";

    const response = await loader({
      request: new Request("http://localhost/api/fub/deals?personId=123"),
    });
    const payload = (await response.json()) as {
      deals?: Array<{ id: number }>;
    };

    expect(response.status).toBe(200);
    expect(payload.deals?.[0]?.id).toBe(456);
  });

  it("requires personId", async () => {
    delete process.env.FUB_API_KEY;
    delete process.env.DEMO_MODE;

    const response = await loader({
      request: new Request("http://localhost/api/fub/deals"),
    });

    expect(response.status).toBe(400);
  });
});
