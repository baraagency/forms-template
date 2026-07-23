import { afterEach, describe, expect, it } from "bun:test";
import { loader } from "../route";

const originalFubKey = process.env.FUB_API_KEY;

afterEach(() => {
  if (originalFubKey === undefined) {
    delete process.env.FUB_API_KEY;
  } else {
    process.env.FUB_API_KEY = originalFubKey;
  }
});

describe("GET /api/fub/users", () => {
  it("returns fixture users when FUB_API_KEY is unset", async () => {
    delete process.env.FUB_API_KEY;

    const response = await loader({
      request: new Request("http://localhost/api/fub/users"),
    });
    const payload = (await response.json()) as {
      users?: Array<{ id: number; name: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.users?.length).toBeGreaterThan(0);
    expect(payload.users?.[0]?.name).toBe("Alex Agent");
  });
});
