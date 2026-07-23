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

describe("GET /api/fub/people", () => {
  it("returns fixture people array when FUB_API_KEY is unset", async () => {
    delete process.env.FUB_API_KEY;

    const response = await loader({
      request: new Request("http://localhost/api/fub/people?limit=100"),
    });
    const payload = (await response.json()) as Array<{ id?: string }>;

    expect(response.status).toBe(200);
    expect(Array.isArray(payload)).toBe(true);
    expect(payload[0]?.id).toBe("123");
  });

  it("filters fixture people by assignedUserId when FUB_API_KEY is unset", async () => {
    delete process.env.FUB_API_KEY;

    const response = await loader({
      request: new Request(
        "http://localhost/api/fub/people?assignedUserId=1&limit=100",
      ),
    });
    const payload = (await response.json()) as Array<{
      assignedUserId?: number;
    }>;

    expect(response.status).toBe(200);
    expect(payload.every((person) => Number(person.assignedUserId) === 1)).toBe(
      true,
    );
  });
});
