import { describe, expect, it } from "bun:test";
import { fetchLiveFubUser } from "../fubLiveClient";

describe("fetchLiveFubUser", () => {
  it("returns 400 when userId is blank without calling FUB", async () => {
    const result = await fetchLiveFubUser("   ");
    expect(result.data).toBeNull();
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/user id/i);
  });
});
