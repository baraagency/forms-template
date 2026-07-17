import { describe, expect, it } from "bun:test";
import {
  APPOINTMENT_SET_SECTIONS,
  addHoursToFormTime,
  applyAppointmentSetPersonPrefill,
  applyAppointmentSetPreviousSubmissionPrefill,
  applyAppointmentSetSisuTransactionPrefill,
  buildAppointmentDateTimeIso,
  toFubAppointmentTypeId,
  getInitialAppointmentSetFormState,
  isIsaApptSetBy,
  isOtherAddressLocation,
  isOsaApptSetBy,
  normalizeAppointmentSetPayload,
  resolveAppointmentSetLocation,
  resolveAppointmentSetSubmittingAgentId,
  validateAppointmentSetForm,
  validateAppointmentSetSection,
} from "../appointmentSetFormUtils";

const completeState = {
  ...getInitialAppointmentSetFormState({
    personId: "123",
    agentId: "456",
    clientName: "Jane Client",
    dealId: "789",
    sisuTransactionId: "999",
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

describe("resolveAppointmentSetSubmittingAgentId", () => {
  it("uses the assigned ISA when the appointment was set by ISA", () => {
    expect(
      resolveAppointmentSetSubmittingAgentId({
        ...completeState,
        apptSetBy: "ISA",
        agentId: "456",
        assignedIsa: "1234",
        assignedOsa: "",
      }),
    ).toBe("1234");
  });

  it("uses the assigned OSA when the appointment was set by OSA", () => {
    expect(
      resolveAppointmentSetSubmittingAgentId({
        ...completeState,
        apptSetBy: "OSA",
        agentId: "456",
        assignedIsa: "",
        assignedOsa: "999",
      }),
    ).toBe("999");
  });

  it("falls back to the routed agent id for Admin submissions", () => {
    expect(
      resolveAppointmentSetSubmittingAgentId({
        ...completeState,
        apptSetBy: "Admin",
        agentId: "456",
        assignedIsa: "1234",
        assignedOsa: "999",
      }),
    ).toBe("456");
  });
});

describe("getInitialAppointmentSetFormState", () => {
  it("prefills routed context and splits client name", () => {
    expect(
      getInitialAppointmentSetFormState({
        personId: "123",
        agentId: "456",
        clientName: "Jane Client",
        dealId: "789",
        sisuTransactionId: "999",
      }),
    ).toMatchObject({
      personId: "123",
      agentId: "456",
      clientFirstName: "Jane",
      clientLastName: "Client",
      dealId: "789",
      sisuTransactionId: "999",
    });
  });
});

describe("applyAppointmentSetPersonPrefill", () => {
  it("fills person details without overwriting typed last name", () => {
    expect(
      applyAppointmentSetPersonPrefill(
        { ...getInitialAppointmentSetFormState({}), clientLastName: "Typed" },
        {
          id: "123",
          firstName: "Jane",
          lastName: "Client",
          assignedUserId: 456,
          phones: [{ value: "8435550100", isPrimary: true }],
          emails: [{ value: "jane@example.com", isPrimary: true }],
        },
      ),
    ).toMatchObject({
      personId: "123",
      clientFirstName: "Jane",
      clientLastName: "Typed",
      clientPhone: "(843) 555-0100",
      clientEmail: "jane@example.com",
      agentId: "456",
    });
  });
});

describe("appointment set SISU option mappings", () => {
  it("maps appointment types to FUB typeId values", () => {
    expect(toFubAppointmentTypeId("Buyer Consultation")).toBe(1);
    expect(toFubAppointmentTypeId("Listing")).toBe(2);
  });
});

describe("applyAppointmentSetSisuTransactionPrefill", () => {
  it("maps SISU transaction defaults into the appointment set form", () => {
    expect(
      applyAppointmentSetSisuTransactionPrefill(getInitialAppointmentSetFormState({}), {
        transaction_id: "999",
        first_name: "Jane",
        last_name: "Smith",
        mobile_phone: "8435550100",
        email: "jane@example.com",
        type_id: "b",
        appt_set_dt: "2026-06-10",
        appt_set_by_agent_id: 1234,
        note: "Interested in downtown.",
      }),
    ).toMatchObject({
      sisuTransactionId: "999",
      clientFirstName: "Jane",
      clientLastName: "Smith",
      clientPhone: "(843) 555-0100",
      clientEmail: "jane@example.com",
      leadType: "Buyer",
      appointmentDate: "2026-06-10",
      assignedIsa: "1234",
      notes: "Interested in downtown.",
    });
  });

  it("does not fall back to signed_dt when appt_set_dt is empty", () => {
    expect(
      applyAppointmentSetSisuTransactionPrefill(getInitialAppointmentSetFormState({}), {
        signed_dt: "2026-06-02",
      }).appointmentDate,
    ).toBe("");
  });

  it("preserves an already-entered appointment date during SISU prefill", () => {
    expect(
      applyAppointmentSetSisuTransactionPrefill(
        {
          ...getInitialAppointmentSetFormState({}),
          appointmentDate: "2027-01-14",
        },
        {
          appt_set_dt: "Wed, 03 Jun 2026 00:00:00 GMT",
        },
      ).appointmentDate,
    ).toBe("2027-01-14");
  });
});

describe("validateAppointmentSetSection", () => {
  it("requires client fields in the client section", () => {
    expect(
      validateAppointmentSetSection(
        getInitialAppointmentSetFormState({ personId: "123" }),
        "client",
      ),
    ).toMatchObject({
      clientFirstName: "This field is required.",
      clientLastName: "This field is required.",
      clientPhone: "This field is required.",
      clientEmail: "This field is required.",
      leadType: "This field is required.",
    });
  });

  it("requires appointment fields in the appointment section", () => {
    expect(
      validateAppointmentSetSection(
        {
          ...completeState,
          appointmentDate: "",
          appointmentStartTime: "",
          appointmentEndTime: "",
          appointmentLocation: "",
          appointmentType: "",
          apptSetBy: "",
        },
        "appointment",
      ),
    ).toMatchObject({
      apptSetBy: "This field is required.",
      appointmentDate: "This field is required.",
      appointmentStartTime: "This field is required.",
      appointmentEndTime: "This field is required.",
      appointmentLocation: "This field is required.",
      appointmentType: "This field is required.",
    });
  });

  it("requires assigned ISA when Appt Set By is ISA", () => {
    expect(
      validateAppointmentSetSection(
        {
          ...completeState,
          apptSetBy: "ISA",
          assignedIsa: "",
        },
        "appointment",
      ),
    ).toMatchObject({
      assignedIsa: "Choose the assigned ISA.",
    });
  });

  it("requires assigned OSA when Appt Set By is OSA", () => {
    expect(
      validateAppointmentSetSection(
        {
          ...completeState,
          apptSetBy: "OSA",
          assignedOsa: "",
        },
        "appointment",
      ),
    ).toMatchObject({
      assignedOsa: "Choose the assigned OSA.",
    });
  });

  it("does not require ISA or OSA when Appt Set By is Admin", () => {
    expect(
      validateAppointmentSetSection(
        {
          ...completeState,
          apptSetBy: "Admin",
          assignedIsa: "",
          assignedOsa: "",
        },
        "appointment",
      ),
    ).toEqual({});
  });

  it("requires address fields when Appointment Location is Other Address", () => {
    expect(
      validateAppointmentSetSection(
        {
          ...completeState,
          appointmentLocation: "Other Address",
          streetAddress: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
        },
        "appointment",
      ),
    ).toMatchObject({
      streetAddress: "This field is required.",
      city: "This field is required.",
      state: "This field is required.",
      postalCode: "This field is required.",
    });
  });

  it("does not require address fields when Appointment Location is an office", () => {
    expect(
      validateAppointmentSetSection(
        {
          ...completeState,
          appointmentLocation: "Charleston Office",
          streetAddress: "",
          city: "",
          state: "",
          postalCode: "",
        },
        "appointment",
      ),
    ).toEqual({});
  });

  it("does not require address line 2 for Other Address", () => {
    expect(
      validateAppointmentSetSection(
        {
          ...completeState,
          appointmentLocation: "Other Address",
          streetAddress: "123 Main St",
          addressLine2: "",
          city: "Charleston",
          state: "SC",
          postalCode: "29401",
        },
        "appointment",
      ),
    ).toEqual({});
  });
});

describe("validateAppointmentSetForm", () => {
  it("returns no errors for a complete valid state", () => {
    expect(validateAppointmentSetForm(completeState)).toEqual({});
  });
});

describe("isOtherAddressLocation", () => {
  it("identifies the Other Address location option", () => {
    expect(isOtherAddressLocation("Other Address")).toBe(true);
    expect(isOtherAddressLocation("Charleston Office")).toBe(false);
  });
});

describe("resolveAppointmentSetLocation", () => {
  it("returns the joined other address when Other Address is selected", () => {
    expect(
      resolveAppointmentSetLocation({
        ...completeState,
        appointmentLocation: "Other Address",
        streetAddress: "123 Main St",
        addressLine2: "Unit 2",
        city: "Charleston",
        state: "SC",
        postalCode: "29401",
      }),
    ).toBe("123 Main St, Unit 2, Charleston, SC, 29401");
  });

  it("returns the selected location option otherwise", () => {
    expect(resolveAppointmentSetLocation(completeState)).toBe("Charleston Office");
  });
});

describe("normalizeAppointmentSetPayload", () => {
  it("normalizes string fields and ignores non-string values", () => {
    expect(
      normalizeAppointmentSetPayload({
        personId: 123,
        clientLastName: "Client",
        clientEmail: "jane@example.com",
        leadType: "Buyer",
      }),
    ).toMatchObject({
      personId: "",
      clientLastName: "Client",
      clientEmail: "jane@example.com",
      leadType: "Buyer",
    });
  });

  it("maps legacy appointmentTime to start and end times", () => {
    expect(
      normalizeAppointmentSetPayload({
        appointmentTime: "10:00",
      }),
    ).toMatchObject({
      appointmentStartTime: "10:00",
      appointmentEndTime: "11:00",
    });
  });
});

describe("appointment set helpers", () => {
  it("identifies ISA and OSA appt set by values", () => {
    expect(isIsaApptSetBy("ISA")).toBe(true);
    expect(isOsaApptSetBy("OSA")).toBe(true);
    expect(isIsaApptSetBy("Admin")).toBe(false);
  });

  it("builds UTC ISO datetimes from Eastern date and time values", () => {
    expect(buildAppointmentDateTimeIso("2026-06-15", "10:00")).toBe(
      "2026-06-15T14:00:00.000Z",
    );
    expect(buildAppointmentDateTimeIso("2026-01-15", "10:00")).toBe(
      "2026-01-15T15:00:00.000Z",
    );
  });

  it("adds hours to stored 24-hour time values", () => {
    expect(addHoursToFormTime("10:00", 1)).toBe("11:00");
    expect(addHoursToFormTime("23:30", 1)).toBe("00:30");
  });

  it("exports both sections", () => {
    expect(APPOINTMENT_SET_SECTIONS).toEqual(["client", "appointment"]);
  });
});

describe("applyAppointmentSetPreviousSubmissionPrefill", () => {
  it("applies raw stored appointment fields from previous submission form_data", () => {
    expect(
      applyAppointmentSetPreviousSubmissionPrefill(getInitialAppointmentSetFormState({}), {
        appointmentStartTime: "15:00",
        appointmentEndTime: "16:00",
        appointmentLocation: "Video Call",
        appointmentType: "Buyer Consultation",
        notes: "Prior notes",
      }),
    ).toMatchObject({
      appointmentStartTime: "15:00",
      appointmentEndTime: "16:00",
      appointmentLocation: "Video Call",
      appointmentType: "Buyer Consultation",
      notes: "Prior notes",
    });
  });

  it("maps legacy appointmentTime values to start and end times", () => {
    expect(
      applyAppointmentSetPreviousSubmissionPrefill(getInitialAppointmentSetFormState({}), {
        appointmentTime: "10:00",
        notes: "Prior notes",
      }),
    ).toMatchObject({
      appointmentStartTime: "10:00",
      appointmentEndTime: "11:00",
      notes: "Prior notes",
    });
  });

  it("returns the current state when stored form data is missing", () => {
    const current = getInitialAppointmentSetFormState({ dealId: "29309" });
    expect(applyAppointmentSetPreviousSubmissionPrefill(current, null)).toEqual(current);
  });
});
