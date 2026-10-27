import { describe, expect, it } from "bun:test";
import { APPOINTMENT_SET_PAGE_DOCUMENT } from "../appointmentSetPageDocument";
import { buildAppointmentSetSubmission } from "../appointmentSetPageSubmit";
import { getInitialAppointmentSetFormState } from "../appointmentSetFormUtils";

const base = {
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
  appointmentLocation: "Phone",
  appointmentType: "Buyer Consultation",
};

describe("buildAppointmentSetSubmission", () => {
  it("normalizes legacy appointment type names to FUB ids", () => {
    const result = buildAppointmentSetSubmission(
      APPOINTMENT_SET_PAGE_DOCUMENT,
      base,
    );

    expect(result.errors).toEqual({});
    expect(result.formState.appointmentType).toBe("1");
  });

  it("keeps editor-added fields in formState", () => {
    const document = {
      ...APPOINTMENT_SET_PAGE_DOCUMENT,
      content: [
        ...APPOINTMENT_SET_PAGE_DOCUMENT.content,
        {
          type: "FieldBlock" as const,
          props: {
            id: "gateCode",
            label: "Gate Code",
            kind: "text" as const,
            required: false,
          },
        },
      ],
    };

    const result = buildAppointmentSetSubmission(document, {
      ...base,
      gateCode: "4321",
    });

    expect(result.errors).toEqual({});
    expect(result.formState.gateCode).toBe("4321");
  });

  it("requires the conditional address fields only for Other Address", () => {
    const phone = buildAppointmentSetSubmission(APPOINTMENT_SET_PAGE_DOCUMENT, {
      ...base,
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
    });
    const other = buildAppointmentSetSubmission(APPOINTMENT_SET_PAGE_DOCUMENT, {
      ...base,
      appointmentLocation: "Other Address",
    });

    expect(phone.errors).toEqual({});
    expect(other.errors.streetAddress).toBeTruthy();
    expect(other.errors.city).toBeTruthy();
  });
});
