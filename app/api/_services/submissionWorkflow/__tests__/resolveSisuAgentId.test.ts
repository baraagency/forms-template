import { describe, expect, it, mock } from "bun:test";
import { resolveSisuAgentIdForFubAgentId } from "../resolveSisuAgentId";

describe("resolveSisuAgentIdForFubAgentId", () => {
  it("resolves a FUB user email to a SISU agent id", async () => {
    const fetchLiveFubUser = mock(async () => ({
      data: { id: "456", email: "agent@example.com" },
      error: null as null,
    }));
    const resolveLiveSisuAgentIdByEmail = mock(async () => ({
      data: 244334,
      error: null as null,
    }));

    await expect(
      resolveSisuAgentIdForFubAgentId("456", {
        fetchLiveFubUser,
        resolveLiveSisuAgentIdByEmail,
      }),
    ).resolves.toBe(244334);

    expect(fetchLiveFubUser).toHaveBeenCalledWith("456");
    expect(resolveLiveSisuAgentIdByEmail).toHaveBeenCalledWith(
      "agent@example.com",
    );
  });

  it("returns undefined when the FUB user cannot be resolved", async () => {
    const fetchLiveFubUser = mock(async () => ({
      data: null,
      error: "Missing",
      status: 404,
    }));
    const resolveLiveSisuAgentIdByEmail = mock(async () => ({
      data: 244334,
      error: null as null,
    }));

    await expect(
      resolveSisuAgentIdForFubAgentId("456", {
        fetchLiveFubUser,
        resolveLiveSisuAgentIdByEmail,
      }),
    ).resolves.toBeUndefined();

    expect(resolveLiveSisuAgentIdByEmail).not.toHaveBeenCalled();
  });

  it("returns undefined when FUB user has no email", async () => {
    const fetchLiveFubUser = mock(async () => ({
      data: { id: "456" },
      error: null as null,
    }));
    const resolveLiveSisuAgentIdByEmail = mock(async () => ({
      data: 244334,
      error: null as null,
    }));

    await expect(
      resolveSisuAgentIdForFubAgentId("456", {
        fetchLiveFubUser,
        resolveLiveSisuAgentIdByEmail,
      }),
    ).resolves.toBeUndefined();

    expect(resolveLiveSisuAgentIdByEmail).not.toHaveBeenCalled();
  });

  it("returns undefined for blank FUB agent id", async () => {
    const fetchLiveFubUser = mock(async () => ({
      data: { id: "456", email: "a@b.com" },
      error: null as null,
    }));

    await expect(
      resolveSisuAgentIdForFubAgentId("  ", { fetchLiveFubUser }),
    ).resolves.toBeUndefined();

    expect(fetchLiveFubUser).not.toHaveBeenCalled();
  });
});
