import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { describe, expect, it } from "bun:test";
import {
  FORM_DATE_TIMEZONE,
  isFormDateOnOrBeforeToday,
} from "../../_core/formDateValidation";
import {
  APPOINTMENT_MET_DATE_MAX_ERROR,
  APPT_DISPOSITION_OPTIONS,
  applyAppointmentMetDispositionFieldClearing,
  applyAppointmentMetPersonPrefill,
  applyAppointmentMetSisuTransactionPrefill,
  clearDispositionDependentFields,
  getInitialAppointmentMetFormState,
  isCancelledDisposition,
  isMetDisposition,
  isRescheduledDisposition,
  normalizeAppointmentMetPayload,
  validateAppointmentMetForm,
} from "../appointmentMetFormUtils";

dayjs.extend(utc);
dayjs.extend(timezone);

const baseState = {
  ...getInitialAppointmentMetFormState({
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
  agentSubmitting: "456",
};

describe("validateAppointmentMetForm", () => {
  it("rejects submit when disposition is empty", () => {
    const errors = validateAppointmentMetForm({
      ...baseState,
      apptDisposition: "",
    });

    expect(errors.apptDisposition).toBe("This field is required.");
  });

  it("requires appointment met fields when disposition is Met with Customer", () => {
    const errors = validateAppointmentMetForm({
      ...baseState,
      apptDisposition: "Met with Customer",
      appointmentMetDate: "",
      apptOutcome: "",
      nextStep: "",
    });

    expect(errors.appointmentMetDate).toBe("This field is required.");
    expect(errors.apptOutcome).toBe("This field is required.");
    expect(errors.nextStep).toBe("This field is required.");
  });

  it("rejects future appointment met dates when disposition is Met with Customer", () => {
    const tomorrow = dayjs().tz(FORM_DATE_TIMEZONE).add(1, "day").format("YYYY-MM-DD");
    const errors = validateAppointmentMetForm({
      ...baseState,
      apptDisposition: "Met with Customer",
      appointmentMetDate: tomorrow,
      apptOutcome: "Thinking it Over",
      nextStep: "Set Up MLS Search",
    });

    expect(errors.appointmentMetDate).toBe(APPOINTMENT_MET_DATE_MAX_ERROR);
    expect(isFormDateOnOrBeforeToday(tomorrow)).toBe(false);
  });

  it("accepts today and past appointment met dates when disposition is Met with Customer", () => {
    const today = dayjs().tz(FORM_DATE_TIMEZONE).format("YYYY-MM-DD");
    const yesterday = dayjs()
      .tz(FORM_DATE_TIMEZONE)
      .subtract(1, "day")
      .format("YYYY-MM-DD");

    expect(
      validateAppointmentMetForm({
        ...baseState,
        apptDisposition: "Met with Customer",
        appointmentMetDate: today,
        apptOutcome: "Thinking it Over",
        nextStep: "Set Up MLS Search",
        notes: "Ready to tour homes.",
      }).appointmentMetDate,
    ).toBeUndefined();

    expect(
      validateAppointmentMetForm({
        ...baseState,
        apptDisposition: "Met with Customer",
        appointmentMetDate: yesterday,
        apptOutcome: "Thinking it Over",
        nextStep: "Set Up MLS Search",
        notes: "Ready to tour homes.",
      }).appointmentMetDate,
    ).toBeUndefined();
  });

  it("requires cancelled next step when disposition is Customer Cancelled", () => {
    const errors = validateAppointmentMetForm({
      ...baseState,
      apptDisposition: "Customer Cancelled",
      cancelledNextStep: "",
    });

    expect(errors.cancelledNextStep).toBe("This field is required.");
  });

  it("requires follow up notes when cancelled next step is Other", () => {
    const errors = validateAppointmentMetForm({
      ...baseState,
      apptDisposition: "Customer No Show",
      cancelledNextStep: "Other",
      followUpNotes: "",
    });

    expect(errors.followUpNotes).toBe("This field is required.");
  });

  it("requires rescheduled fields when disposition is Rescheduled", () => {
    const errors = validateAppointmentMetForm({
      ...baseState,
      apptDisposition: "Rescheduled",
      rescheduledDate: "",
      rescheduledStartTime: "",
      rescheduledEndTime: "",
    });

    expect(errors.rescheduledDate).toBe("This field is required.");
    expect(errors.rescheduledStartTime).toBe("This field is required.");
    expect(errors.rescheduledEndTime).toBe("This field is required.");
  });
});

describe("disposition helpers", () => {
  it("identifies disposition branches", () => {
    expect(isMetDisposition("Met with Customer")).toBe(true);
    expect(isCancelledDisposition("Customer Cancelled")).toBe(true);
    expect(isCancelledDisposition("Customer No Show")).toBe(true);
    expect(isRescheduledDisposition("Rescheduled")).toBe(true);
    expect(APPT_DISPOSITION_OPTIONS).toContain("Met with Customer");
  });

  it("clears met-only fields when disposition changes to cancelled", () => {
    const cleared = clearDispositionDependentFields({
      ...baseState,
      apptDisposition: "Customer Cancelled",
      appointmentMetDate: "2026-06-01",
      apptOutcome: "Thinking it Over",
      nextStep: "Create Follow Up Task",
      notes: "Met notes",
      rescheduledDate: "2026-06-02",
      rescheduledStartTime: "10:00",
      rescheduledEndTime: "11:00",
    });

    expect(cleared.appointmentMetDate).toBe("");
    expect(cleared.apptOutcome).toBe("");
    expect(cleared.nextStep).toBe("");
    expect(cleared.notes).toBe("");
    expect(cleared.rescheduledDate).toBe("");
    expect(cleared.rescheduledStartTime).toBe("");
    expect(cleared.rescheduledEndTime).toBe("");
  });

  it("applies disposition field clearing through update helper", () => {
    const next = applyAppointmentMetDispositionFieldClearing(
      {
        ...baseState,
        appointmentMetDate: "2026-06-01",
        apptOutcome: "Signed Buyer Agency",
        nextStep: "Start Paperwork",
      },
      "apptDisposition",
      "Rescheduled",
    );

    expect(next.appointmentMetDate).toBe("");
    expect(next.apptOutcome).toBe("");
    expect(next.nextStep).toBe("");
    expect(next.apptDisposition).toBe("Rescheduled");
  });

  it("auto-fills rescheduled end time from start time", () => {
    const next = applyAppointmentMetDispositionFieldClearing(
      baseState,
      "rescheduledStartTime",
      "10:00",
    );

    expect(next.rescheduledEndTime).toBe("11:00");
  });

  it("clears follow up notes when cancelled next step leaves Other", () => {
    const next = applyAppointmentMetDispositionFieldClearing(
      {
        ...baseState,
        cancelledNextStep: "Other",
        followUpNotes: "Call back next week",
      },
      "cancelledNextStep",
      "Create Follow Up Task",
    );

    expect(next.followUpNotes).toBe("");
  });
});

describe("prefill helpers", () => {
  it("applies FUB person prefill without overwriting typed values", () => {
    const next = applyAppointmentMetPersonPrefill(
      {
        ...baseState,
        clientFirstName: "Typed",
        clientPhone: "",
      },
      {
        id: 123,
        firstName: "Lead",
        lastName: "Person",
        assignedUserId: 9,
        phones: [{ value: "8435550199", isPrimary: true }],
        emails: [{ value: "lead@example.com", isPrimary: true }],
      },
    );

    expect(next.clientFirstName).toBe("Typed");
    expect(next.clientPhone).toBe("(843) 555-0199");
    expect(next.agentSubmitting).toBe("456");
  });

  it("applies SISU transaction prefill for empty fields", () => {
    const next = applyAppointmentMetSisuTransactionPrefill(
      getInitialAppointmentMetFormState({ personId: "" }),
      {
        transaction_id: 999,
        agent_id: 7,
        first_name: "Sisu",
        last_name: "Client",
        mobile_phone: "8435550111",
        email: "sisu@example.com",
        fub_id: "321",
        fub_deal_id: "654",
        type_id: "b",
        custom: {
          appt_outcome: "3",
        },
      },
    );

    expect(next.sisuTransactionId).toBe("999");
    expect(next.personId).toBe("321");
    expect(next.dealId).toBe("654");
    expect(next.leadType).toBe("Buyer");
    expect(next.apptOutcome).toBe("Signed Buyer Agency");
  });
});

describe("normalizeAppointmentMetPayload", () => {
  it("maps legacy rescheduledTime and fills end time", () => {
    const normalized = normalizeAppointmentMetPayload({
      personId: "123",
      rescheduledTime: "14:00",
    });

    expect(normalized.rescheduledStartTime).toBe("14:00");
    expect(normalized.rescheduledEndTime).toBe("15:00");
  });
});
