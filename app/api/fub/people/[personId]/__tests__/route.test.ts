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

describe("GET /api/fub/people/:personId", () => {
  it("returns fixture person when FUB_API_KEY is unset", async () => {
    delete process.env.FUB_API_KEY;

    const response = await loader({
      request: new Request("http://localhost/api/fub/people/123"),
      params: { personId: "123" },
    });
    const payload = (await response.json()) as { id?: string; firstName?: string };

    expect(response.status).toBe(200);
    expect(payload.id).toBe("123");
    expect(payload.firstName).toBe("Jane");
  });

  it("returns 404 for unknown fixture person ids when FUB_API_KEY is unset", async () => {
    delete process.env.FUB_API_KEY;

    const response = await loader({
      request: new Request("http://localhost/api/fub/people/999"),
      params: { personId: "999" },
    });

    expect(response.status).toBe(404);
  });
});
