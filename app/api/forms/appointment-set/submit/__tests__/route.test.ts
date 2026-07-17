import { describe, expect, it } from "bun:test";
import { POST } from "../route";
import { getInitialAppointmentSetFormState } from "@/app/forms/appointment-set/appointmentSetFormUtils";

function buildValidPayload() {
  return {
    ...getInitialAppointmentSetFormState({
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
    apptSetBy: "Admin",
    appointmentDate: "2026-06-15",
    appointmentStartTime: "10:00",
    appointmentEndTime: "11:00",
    appointmentLocation: "Charleston Office",
    appointmentType: "Buyer Consultation",
  };
}

describe("POST /api/forms/appointment-set/submit", () => {
  it("rejects invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/appointment-set/submit", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects incomplete payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/appointment-set/submit", {
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
      new Request("http://localhost/api/forms/appointment-set/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildValidPayload()),
      }),
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      formType?: string;
      dealId?: number;
      appointmentId?: string;
    };
    expect(payload.formType).toBe("appointmentSet");
    expect(payload.dealId).toBe(456);
    expect(payload.appointmentId).toBe("appt-1001");
  });
});
