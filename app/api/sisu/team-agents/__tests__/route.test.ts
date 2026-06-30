import { describe, expect, it } from "bun:test";
import { GET } from "../route";

describe("sisu team agents route (mock)", () => {
  it("returns fixture team agents", async () => {
    const response = await GET(new Request("http://localhost/api/sisu/team-agents"));
    const payload = (await response.json()) as {
      agents?: Array<{ value: string; isIsa: boolean }>;
    };

    expect(response.status).toBe(200);
    expect(payload.agents?.length).toBeGreaterThan(0);
  });

  it("filters ISISA agents when role_filter is present", async () => {
    const response = await GET(
      new Request("http://localhost/api/sisu/team-agents?role_filter=ISISA"),
    );
    const payload = (await response.json()) as {
      agents?: Array<{ isIsa: boolean }>;
    };

    expect(response.status).toBe(200);
    expect(payload.agents?.every((agent) => agent.isIsa)).toBe(true);
  });
});
