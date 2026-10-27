import { describe, expect, it } from "bun:test";
import { collectPageFields } from "@/app/forms/editor/formPageData";
import { APPOINTMENT_MET_PAGE_DOCUMENT } from "../appointmentMetPageDocument";
import { buildInitialAppointmentMetValues } from "../appointmentMetPageValues";
import { getInitialAppointmentMetFormState } from "../appointmentMetFormUtils";

describe("APPOINTMENT_MET_PAGE_DOCUMENT", () => {
  it("contains every visible Appointment Met field id", () => {
    const routingKeys = new Set([
      "personId",
      "agentId",
      "dealId",
      "sisuTransactionId",
      "agentSubmitting",
    ]);
    const expected = Object.keys(getInitialAppointmentMetFormState({})).filter(
      (key) => !routingKeys.has(key),
    );
    const actual = collectPageFields(APPOINTMENT_MET_PAGE_DOCUMENT).map(
      (field) => field.id,
    );

    expect(actual).toEqual(expect.arrayContaining(expected));
    expect(actual).toHaveLength(expected.length);
  });

  it("uses disposition branches", () => {
    const fields = collectPageFields(APPOINTMENT_MET_PAGE_DOCUMENT);
    const met = fields.find((field) => field.id === "appointmentMetDate");
    const cancelled = fields.find((field) => field.id === "cancelledNextStep");
    const followUp = fields.find((field) => field.id === "followUpNotes");
    const rescheduled = fields.find((field) => field.id === "rescheduledDate");

    expect(met?.visibleWhen?.[0]?.values).toEqual(["Met with Customer"]);
    expect(cancelled?.visibleWhen?.[0]?.values).toEqual([
      "Customer Cancelled",
      "Customer No Show",
    ]);
    expect(followUp?.visibleWhen).toHaveLength(2);
    expect(rescheduled?.visibleWhen?.[0]?.values).toEqual(["Rescheduled"]);
  });

  it("uses time fields for the rescheduled window", () => {
    const fields = collectPageFields(APPOINTMENT_MET_PAGE_DOCUMENT);
    expect(
      fields.find((field) => field.id === "rescheduledStartTime")?.kind,
    ).toBe("time");
    expect(fields.find((field) => field.id === "rescheduledEndTime")?.kind).toBe(
      "time",
    );
  });

  it("seeds values and previous-submission prefill", () => {
    const values = buildInitialAppointmentMetValues({
      document: APPOINTMENT_MET_PAGE_DOCUMENT,
      personId: "123",
      agentId: "1",
      clientName: "Test Client",
      dealId: "456",
      sisuTransactionId: "789",
      previousSubmissionFormData: {
        clientPhone: "555-123-4567",
        apptDisposition: "Rescheduled",
      },
    });

    expect(values.clientFirstName).toBe("Test");
    expect(values.clientPhone).toBe("555-123-4567");
    expect(values.apptDisposition).toBe("Rescheduled");
  });
});
