import { describe, expect, it } from "bun:test";
import { resolveAppointmentMetSubmittingAgentId } from "../../appointmentMetSubmittingAgentId";

describe("resolveAppointmentMetSubmittingAgentId", () => {
  it("prefers agentSubmitting over agentId", () => {
    expect(
      resolveAppointmentMetSubmittingAgentId({
        agentSubmitting: "789",
        agentId: "456",
      }),
    ).toBe("789");
  });

  it("falls back to agentId", () => {
    expect(
      resolveAppointmentMetSubmittingAgentId({
        agentSubmitting: "",
        agentId: "456",
      }),
    ).toBe("456");
  });

  it("returns null when both empty", () => {
    expect(
      resolveAppointmentMetSubmittingAgentId({
        agentSubmitting: "",
        agentId: "",
      }),
    ).toBeNull();
  });
});
