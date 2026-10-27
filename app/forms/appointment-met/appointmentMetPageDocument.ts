import {
  APPT_DISPOSITION_OPTIONS,
  APPT_OUTCOME_OPTIONS,
  CANCELLED_NEXT_STEP_OPTIONS,
  LEAD_TYPE_OPTIONS,
  MET_NEXT_STEP_OPTIONS,
} from "./appointmentMetFormUtils";
import type { FieldBlockProps, FormPageData } from "../editor/formPageTypes";

function choices(values: readonly string[]) {
  return values.map((value) => ({ label: value, value }));
}

const metVisibleWhen = [
  { fieldId: "apptDisposition", operator: "equals" as const, values: ["Met with Customer"] },
];
const cancelledVisibleWhen = [
  {
    fieldId: "apptDisposition",
    operator: "in" as const,
    values: ["Customer Cancelled", "Customer No Show"],
  },
];
const rescheduledVisibleWhen = [
  { fieldId: "apptDisposition", operator: "equals" as const, values: ["Rescheduled"] },
];

function field(props: FieldBlockProps) {
  return { type: "FieldBlock" as const, props };
}

export const APPOINTMENT_MET_PAGE_DOCUMENT: FormPageData = {
  content: [
    { type: "PageTitle", props: { id: "appointment-met-title", text: "Appointment Met" } },
    {
      type: "TextBlock",
      props: {
        id: "appointment-met-intro",
        text: "Capture appointment disposition and next steps for this lead.",
      },
    },
    { type: "SectionHeader", props: { id: "client-header", title: "Client Info" } },
    field({
      id: "clientFirstName",
      label: "Client First Name",
      kind: "text",
      required: true,
    }),
    field({
      id: "clientLastName",
      label: "Client Last Name",
      kind: "text",
      required: true,
    }),
    field({
      id: "clientPhone",
      label: "Client Phone Number",
      kind: "phone",
      required: true,
    }),
    field({
      id: "clientEmail",
      label: "Client Email",
      kind: "email",
      required: true,
    }),
    field({
      id: "leadType",
      label: "Client Type",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "manual",
      options: choices(LEAD_TYPE_OPTIONS),
    }),
    {
      type: "SectionHeader",
      props: { id: "disposition-header", title: "Disposition Details" },
    },
    field({
      id: "apptDisposition",
      label: "Did the Appointment Happen?",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "manual",
      options: choices(APPT_DISPOSITION_OPTIONS),
    }),
    field({
      id: "appointmentMetDate",
      label: "Appointment Met Date",
      kind: "date",
      required: true,
      dateConstraint: "past",
      visibleWhen: metVisibleWhen,
    }),
    field({
      id: "apptOutcome",
      label: "Appointment Outcome",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "manual",
      options: choices(APPT_OUTCOME_OPTIONS),
      visibleWhen: metVisibleWhen,
    }),
    field({
      id: "nextStep",
      label: "Next Step",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "manual",
      options: choices(MET_NEXT_STEP_OPTIONS),
      visibleWhen: metVisibleWhen,
    }),
    field({
      id: "notes",
      label: "Notes",
      kind: "text",
      required: false,
      multiline: true,
      visibleWhen: metVisibleWhen,
    }),
    field({
      id: "cancelledNextStep",
      label: "Next Step for Cancelled Appointments",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "manual",
      options: choices(CANCELLED_NEXT_STEP_OPTIONS),
      visibleWhen: cancelledVisibleWhen,
    }),
    field({
      id: "followUpNotes",
      label: "Follow Up Notes",
      kind: "text",
      required: true,
      multiline: true,
      visibleWhen: [
        ...cancelledVisibleWhen,
        {
          fieldId: "cancelledNextStep",
          operator: "equals",
          values: ["Other"],
        },
      ],
    }),
    field({
      id: "rescheduledDate",
      label: "Rescheduled Date",
      kind: "date",
      required: true,
      dateConstraint: "any",
      visibleWhen: rescheduledVisibleWhen,
    }),
    field({
      id: "rescheduledStartTime",
      label: "Rescheduled Start Time",
      kind: "time",
      required: true,
      visibleWhen: rescheduledVisibleWhen,
    }),
    field({
      id: "rescheduledEndTime",
      label: "Rescheduled End Time",
      kind: "time",
      required: true,
      visibleWhen: rescheduledVisibleWhen,
    }),
  ],
  root: { props: {} },
};
