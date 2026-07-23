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

describe("GET /api/fub/appointment-types", () => {
  it("returns fixture appointment types when FUB_API_KEY is unset", async () => {
    delete process.env.FUB_API_KEY;

    const response = await loader();
    const payload = (await response.json()) as {
      appointmentTypes?: Array<{ id: number; name: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.appointmentTypes).toEqual([
      { id: 1, name: "Buyer Consultation" },
      { id: 2, name: "Listing" },
    ]);
  });
});
