import { describe, expect, it } from "bun:test";
import { getInitialAppointmentSetFormState } from "@/app/forms/appointment-set/appointmentSetFormUtils";
import { buildFubAppointmentSetPayload } from "../buildFubAppointmentSetPayload";

describe("buildFubAppointmentSetPayload", () => {
  it("builds a FUB appointment create payload from form state", () => {
    const state = {
      ...getInitialAppointmentSetFormState({
        personId: "123",
        agentId: "9",
        clientName: "Jane Client",
      }),
      clientEmail: "jane@example.com",
      appointmentType: "Buyer Consultation",
      appointmentDate: "2026-06-15",
      appointmentStartTime: "10:00",
      appointmentEndTime: "11:00",
      appointmentLocation: "Phone",
      notes: "Motivated buyer",
      apptSetBy: "Admin",
    };

    expect(buildFubAppointmentSetPayload(state)).toMatchObject({
      title: "Buyer Consultation - Jane Client",
      location: "Phone",
      description: "Motivated buyer",
      typeId: 1,
      createdById: 9,
      invitees: [
        { personId: 123, name: "Jane Client", email: "jane@example.com" },
        { userId: 9 },
      ],
    });
  });
});
