import {
  normalizeAppointmentMetPayload,
  validateAppointmentMetForm,
  type AppointmentMetFormState,
} from "@/app/forms/appointment-met/appointmentMetFormUtils";
import { formKindLabel } from "@/app/forms/_core/formIdentity";
import { runSubmissionWorkflow } from "@/app/api/_services/submissionWorkflow";
import { runAppointmentMetFubAppointmentSideEffect } from "@/app/api/forms/appointment-met/appointmentMetFubAppointment";

function isAppointmentMetPayload(
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

  if (!isAppointmentMetPayload(payload)) {
    return Response.json(
      { message: "Appointment Met payload is required." },
      { status: 400 },
    );
  }

  const formState: AppointmentMetFormState =
    normalizeAppointmentMetPayload(payload);
  const errors = validateAppointmentMetForm(formState);

  if (!formState.personId) {
    errors.personId = "A FUB person id is required.";
  }

  if (Object.keys(errors).length > 0) {
    return Response.json(
      {
        message: "Appointment Met submission has validation errors.",
        errors,
      },
      { status: 400 },
    );
  }

  const result = await runSubmissionWorkflow({
    form: "appointmentMet",
    formLabel: formKindLabel("appointmentMet"),
    formState: formState as unknown as Record<string, unknown>,
    personId: formState.personId,
    dealId: formState.dealId || null,
    sisuTransactionId: formState.sisuTransactionId || null,
    agentId: formState.agentId || null,
    leadType: formState.leadType || null,
    hooks: {
      extraSideEffects: runAppointmentMetFubAppointmentSideEffect,
    },
  });

  return Response.json(result);
}
