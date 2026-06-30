import { describe, expect, it } from "bun:test";
import { GET } from "../route";

describe("sisu team-fields route (mock)", () => {
  it("returns fixture team fields", async () => {
    const response = await GET();
    const payload = (await response.json()) as { fields?: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(payload.fields?.client_type).toBeDefined();
  });
});
