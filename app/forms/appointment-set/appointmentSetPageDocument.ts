import {
  APPOINTMENT_LOCATION_OPTIONS,
  APPT_SET_BY_OPTIONS,
  DEFAULT_APPOINTMENT_TYPE_OPTIONS,
  LEAD_TYPE_OPTIONS,
} from "./appointmentSetFormUtils";
import type { FieldBlockProps, FormPageData } from "../editor/formPageTypes";

function choices(values: readonly string[]) {
  return values.map((value) => ({ label: value, value }));
}

const appointmentTypeOptions = DEFAULT_APPOINTMENT_TYPE_OPTIONS.map((option) => ({
  label: option.name,
  value: String(option.id),
}));

// Demo fallbacks only; publishing snapshots the live SISU/FUB catalogs.
const isaFallbackOptions = [{ label: "Taylor ISA", value: "501" }];
const osaFallbackOptions = [
  { label: "Alex Agent", value: "1" },
  { label: "Jordan Broker", value: "2" },
];

function field(props: FieldBlockProps) {
  return { type: "FieldBlock" as const, props };
}

export const APPOINTMENT_SET_PAGE_DOCUMENT: FormPageData = {
  content: [
    { type: "PageTitle", props: { id: "appointment-set-title", text: "Appointment Set" } },
    {
      type: "TextBlock",
      props: {
        id: "appointment-set-intro",
        text: "Schedule the client appointment and capture intake details for this lead.",
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
      props: { id: "appointment-header", title: "Appointment Information" },
    },
    field({
      id: "apptSetBy",
      label: "Appointment Set By",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "manual",
      options: choices(APPT_SET_BY_OPTIONS),
    }),
    field({
      id: "appointmentType",
      label: "Appointment Type",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "fubAppointmentTypes",
      options: appointmentTypeOptions,
    }),
    field({
      id: "assignedIsa",
      label: "Assigned ISA",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "sisuAgents",
      optionFilter: "ISISA",
      options: isaFallbackOptions,
      disableWhenEmpty: true,
      visibleWhen: [
        { fieldId: "apptSetBy", operator: "equals", values: ["ISA"] },
      ],
    }),
    field({
      id: "assignedOsa",
      label: "Assigned OSA",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "fubUsers",
      options: osaFallbackOptions,
      disableWhenEmpty: true,
      visibleWhen: [
        { fieldId: "apptSetBy", operator: "equals", values: ["OSA"] },
      ],
    }),
    field({
      id: "appointmentDate",
      label: "Appointment Date",
      kind: "date",
      required: true,
      dateConstraint: "any",
    }),
    field({
      id: "appointmentStartTime",
      label: "Start Time",
      kind: "time",
      required: true,
    }),
    field({
      id: "appointmentEndTime",
      label: "End Time",
      kind: "time",
      required: true,
    }),
    field({
      id: "appointmentLocation",
      label: "Appointment Location",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "manual",
      options: choices(APPOINTMENT_LOCATION_OPTIONS),
    }),
    field({
      id: "streetAddress",
      label: "Street Address",
      kind: "text",
      required: true,
      visibleWhen: [
        {
          fieldId: "appointmentLocation",
          operator: "equals",
          values: ["Other Address"],
        },
      ],
    }),
    field({
      id: "addressLine2",
      label: "Address Line 2",
      kind: "text",
      required: false,
      visibleWhen: [
        {
          fieldId: "appointmentLocation",
          operator: "equals",
          values: ["Other Address"],
        },
      ],
    }),
    field({
      id: "city",
      label: "City",
      kind: "text",
      required: true,
      visibleWhen: [
        {
          fieldId: "appointmentLocation",
          operator: "equals",
          values: ["Other Address"],
        },
      ],
    }),
    field({
      id: "state",
      label: "State/Province/Region",
      kind: "choice",
      required: true,
      display: "select",
      optionSource: "usStates",
      visibleWhen: [
        {
          fieldId: "appointmentLocation",
          operator: "equals",
          values: ["Other Address"],
        },
      ],
    }),
    field({
      id: "postalCode",
      label: "Postal Code",
      kind: "text",
      required: true,
      visibleWhen: [
        {
          fieldId: "appointmentLocation",
          operator: "equals",
          values: ["Other Address"],
        },
      ],
    }),
    field({
      id: "notes",
      label: "Notes (Location, Timeframe, Motivation, Price, etc.)",
      kind: "text",
      required: false,
      multiline: true,
    }),
  ],
  root: { props: {} },
};
