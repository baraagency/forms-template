import { describe, expect, it } from "bun:test";
import { applyResolvedSisuAgentId } from "../applyResolvedSisuAgentId";

describe("applyResolvedSisuAgentId", () => {
  it("sets agent_id when resolved", () => {
    const payload = { fub_id: "123" };
    applyResolvedSisuAgentId(payload, 244334);
    expect(payload).toEqual({ fub_id: "123", agent_id: 244334 });
  });

  it("leaves payload unchanged when agent id is undefined", () => {
    const payload = { fub_id: "123" };
    applyResolvedSisuAgentId(payload, undefined);
    expect(payload).toEqual({ fub_id: "123" });
  });
});
