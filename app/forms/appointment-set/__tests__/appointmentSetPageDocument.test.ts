import { describe, expect, it } from "bun:test";
import { collectPageFields } from "@/app/forms/editor/formPageData";
import { APPOINTMENT_SET_PAGE_DOCUMENT } from "../appointmentSetPageDocument";
import { buildInitialAppointmentSetValues } from "../appointmentSetPageValues";
import { getInitialAppointmentSetFormState } from "../appointmentSetFormUtils";

describe("APPOINTMENT_SET_PAGE_DOCUMENT", () => {
  it("contains every Appointment Set field id", () => {
    const routingKeys = new Set([
      "personId",
      "agentId",
      "dealId",
      "sisuTransactionId",
    ]);
    const expected = Object.keys(getInitialAppointmentSetFormState({})).filter(
      (key) => !routingKeys.has(key),
    );
    const actual = collectPageFields(APPOINTMENT_SET_PAGE_DOCUMENT).map(
      (field) => field.id,
    );

    expect(actual).toEqual(expect.arrayContaining(expected));
    expect(actual).toHaveLength(expected.length);
  });

  it("shows ISA/OSA and address fields conditionally", () => {
    const fields = collectPageFields(APPOINTMENT_SET_PAGE_DOCUMENT);
    const isa = fields.find((field) => field.id === "assignedIsa");
    const osa = fields.find((field) => field.id === "assignedOsa");
    const city = fields.find((field) => field.id === "city");

    expect(isa?.visibleWhen?.[0]?.fieldId).toBe("apptSetBy");
    expect(isa?.visibleWhen?.[0]?.operator).toBe("equals");
    expect(isa?.visibleWhen?.[0]?.values).toEqual(["ISA"]);
    expect(osa?.visibleWhen?.[0]?.fieldId).toBe("apptSetBy");
    expect(osa?.visibleWhen?.[0]?.values).toEqual(["OSA"]);
    expect(city?.visibleWhen?.[0]?.fieldId).toBe("appointmentLocation");
    expect(city?.visibleWhen?.[0]?.values).toEqual(["Other Address"]);
  });

  it("uses time fields for the appointment window", () => {
    const fields = collectPageFields(APPOINTMENT_SET_PAGE_DOCUMENT);
    expect(fields.find((field) => field.id === "appointmentStartTime")?.kind).toBe(
      "time",
    );
    expect(fields.find((field) => field.id === "appointmentEndTime")?.kind).toBe(
      "time",
    );
  });

  it("seeds values and previous-submission prefill", () => {
    const values = buildInitialAppointmentSetValues({
      document: APPOINTMENT_SET_PAGE_DOCUMENT,
      personId: "123",
      agentId: "1",
      clientName: "Test Client",
      dealId: "456",
      sisuTransactionId: "789",
      previousSubmissionFormData: {
        clientPhone: "555-123-4567",
        appointmentStartTime: "09:00",
      },
    });

    expect(values.clientFirstName).toBe("Test");
    expect(values.clientPhone).toBe("555-123-4567");
    expect(values.appointmentStartTime).toBe("09:00");
    expect(values.personId).toBe("123");
  });
});
