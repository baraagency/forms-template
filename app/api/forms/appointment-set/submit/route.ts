import {
  normalizeAppointmentSetPayload,
  validateAppointmentSetForm,
  type AppointmentSetFormState,
} from "@/app/forms/appointment-set/appointmentSetFormUtils";
import { formKindLabel } from "@/app/forms/_core/formIdentity";
import { runSubmissionWorkflow } from "@/app/api/_services/submissionWorkflow";
import { runAppointmentSetFubAppointmentSideEffect } from "@/app/api/forms/appointment-set/appointmentSetFubAppointment";

function isAppointmentSetPayload(
  payload: unknown,
): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null;
}

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (!isAppointmentSetPayload(payload)) {
    return Response.json(
      { message: "Appointment Set payload is required." },
      { status: 400 },
    );
  }

  const formState: AppointmentSetFormState =
    normalizeAppointmentSetPayload(payload);
  const errors = validateAppointmentSetForm(formState);

  if (!formState.personId) {
    errors.personId = "A FUB person id is required.";
  }

  if (Object.keys(errors).length > 0) {
    return Response.json(
      {
        message: "Appointment Set submission has validation errors.",
        errors,
      },
      { status: 400 },
    );
  }

  const result = await runSubmissionWorkflow({
    form: "appointmentSet",
    formLabel: formKindLabel("appointmentSet"),
    formState: formState as unknown as Record<string, unknown>,
    personId: formState.personId,
    dealId: formState.dealId || null,
    sisuTransactionId: formState.sisuTransactionId || null,
    agentId: formState.agentId || null,
    leadType: formState.leadType || null,
    hooks: {
      extraSideEffects: runAppointmentSetFubAppointmentSideEffect,
    },
  });

  return Response.json(result);
}
