import { describe, expect, it } from "bun:test";
import { getInitialAppointmentMetFormState } from "@/app/forms/appointment-met/appointmentMetFormUtils";
import {
  APPOINTMENT_MET_FUB_OUTCOME_FALLBACK,
  buildFubRescheduledAppointmentPayload,
  resolveFubAppointmentOutcomeId,
} from "../buildFubAppointmentMetPayload";

describe("appointment met FUB appointment helpers", () => {
  it("resolves outcome ids by case-insensitive name", () => {
    expect(
      resolveFubAppointmentOutcomeId(
        APPOINTMENT_MET_FUB_OUTCOME_FALLBACK,
        "signed buyer agency",
      ),
    ).toBe(4);
    expect(
      resolveFubAppointmentOutcomeId(
        APPOINTMENT_MET_FUB_OUTCOME_FALLBACK,
        "Unknown Outcome",
      ),
    ).toBeNull();
  });

  it("builds a rescheduled appointment payload", () => {
    const state = {
      ...getInitialAppointmentMetFormState({
        personId: "123",
        agentId: "9",
        clientName: "Jane Client",
      }),
      clientEmail: "jane@example.com",
      leadType: "Buyer",
      agentSubmitting: "11",
      apptDisposition: "Rescheduled",
      rescheduledDate: "2026-07-01",
      rescheduledStartTime: "14:00",
      rescheduledEndTime: "15:00",
    };

    expect(buildFubRescheduledAppointmentPayload(state)).toMatchObject({
      title: "Buyer Consultation - Jane Client",
      description: "Rescheduled via Appointment Met form.",
      typeId: 1,
      invitees: [
        { personId: 123, name: "Jane Client", email: "jane@example.com" },
        { userId: 11 },
      ],
    });
  });
});
