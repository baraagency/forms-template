import { describe, expect, it } from "bun:test";
import { APPOINTMENT_MET_PAGE_DOCUMENT } from "../appointmentMetPageDocument";
import { buildAppointmentMetSubmission } from "../appointmentMetPageSubmit";
import { getInitialAppointmentMetFormState } from "../appointmentMetFormUtils";

const base = {
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
  apptDisposition: "Rescheduled",
  rescheduledDate: "2026-11-01",
  rescheduledStartTime: "10:00",
  rescheduledEndTime: "11:00",
};

describe("buildAppointmentMetSubmission", () => {
  it("accepts the rescheduled branch and keeps hidden agentSubmitting", () => {
    const result = buildAppointmentMetSubmission(APPOINTMENT_MET_PAGE_DOCUMENT, {
      ...base,
      agentSubmitting: "2",
    });

    expect(result.errors).toEqual({});
    expect(result.formState.agentSubmitting).toBe("2");
  });

  it("requires the met branch fields only when met", () => {
    const rescheduled = buildAppointmentMetSubmission(
      APPOINTMENT_MET_PAGE_DOCUMENT,
      { ...base, appointmentMetDate: "", apptOutcome: "", nextStep: "" },
    );
    const met = buildAppointmentMetSubmission(APPOINTMENT_MET_PAGE_DOCUMENT, {
      ...base,
      apptDisposition: "Met with Customer",
    });

    expect(rescheduled.errors).toEqual({});
    expect(met.errors.appointmentMetDate).toBeTruthy();
    expect(met.errors.apptOutcome).toBeTruthy();
    expect(met.errors.nextStep).toBeTruthy();
  });

  it("requires follow-up notes for an Other cancelled next step", () => {
    const result = buildAppointmentMetSubmission(APPOINTMENT_MET_PAGE_DOCUMENT, {
      ...base,
      apptDisposition: "Customer Cancelled",
      cancelledNextStep: "Other",
      followUpNotes: "",
    });

    expect(result.errors.followUpNotes).toBeTruthy();
  });

  it("keeps editor-added fields in formState", () => {
    const document = {
      ...APPOINTMENT_MET_PAGE_DOCUMENT,
      content: [
        ...APPOINTMENT_MET_PAGE_DOCUMENT.content,
        {
          type: "FieldBlock" as const,
          props: {
            id: "referralSource",
            label: "Referral Source",
            kind: "text" as const,
            required: false,
          },
        },
      ],
    };

    const result = buildAppointmentMetSubmission(document, {
      ...base,
      referralSource: "Past client",
    });

    expect(result.errors).toEqual({});
    expect(result.formState.referralSource).toBe("Past client");
  });
});
