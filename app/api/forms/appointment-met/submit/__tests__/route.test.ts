import { describe, expect, it } from "bun:test";
import { POST } from "../route";
import { getInitialAppointmentMetFormState } from "@/app/forms/appointment-met/appointmentMetFormUtils";

function buildValidPayload() {
  return {
    ...getInitialAppointmentMetFormState({
      personId: "123",
      agentId: "1",
      clientName: "Jane Client",
      dealId: "456",
      sisuTransactionId: "789",
    }),
    clientFirstName: "Jane",
    clientLastName: "Client",
    clientPhone: "(843) 555-0100",
    clientEmail: "jane@example.com",
    leadType: "Buyer",
    agentSubmitting: "1",
    apptDisposition: "Met with Customer",
    appointmentMetDate: "2026-06-15",
    apptOutcome: "Thinking it Over",
    nextStep: "Set Up MLS Search",
    notes: "Client is deciding.",
  };
}

describe("POST /api/forms/appointment-met/submit", () => {
  it("rejects invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/appointment-met/submit", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects incomplete payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/appointment-met/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: "123" }),
      }),
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { errors?: Record<string, string> };
    expect(payload.errors).toBeTruthy();
  });

  it("returns mock success for a valid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/appointment-met/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildValidPayload()),
      }),
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      formType?: string;
      dealId?: number;
    };
    expect(payload.formType).toBe("appointmentMet");
    expect(payload.dealId).toBe(456);
  });
});
