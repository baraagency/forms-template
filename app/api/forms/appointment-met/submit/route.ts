import { formKindLabel } from "@/app/forms/_core/formIdentity";
import { APPOINTMENT_MET_PAGE_DOCUMENT } from "@/app/forms/appointment-met/appointmentMetPageDocument";
import { buildAppointmentMetSubmission } from "@/app/forms/appointment-met/appointmentMetPageSubmit";
import { loadPublishedFormPage } from "@/app/api/_services/formPageService";
import { runSubmissionWorkflow } from "@/app/api/_services/submissionWorkflow";
import { runAppointmentMetFubAppointmentSideEffect } from "@/app/api/forms/appointment-met/appointmentMetFubAppointment";
import { resolveAppointmentMetSubmittingAgentId } from "@/app/api/forms/appointment-met/appointmentMetSubmittingAgentId";

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

  const document = await loadPublishedFormPage(
    "appointmentMet",
    APPOINTMENT_MET_PAGE_DOCUMENT,
  );
  const { errors, formState } = buildAppointmentMetSubmission(document, payload);

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
    formState: formState as Record<string, unknown>,
    personId: String(formState.personId),
    dealId: String(formState.dealId || "") || null,
    sisuTransactionId: String(formState.sisuTransactionId || "") || null,
    agentId: resolveAppointmentMetSubmittingAgentId({
      agentSubmitting: String(formState.agentSubmitting || ""),
      agentId: String(formState.agentId || ""),
    }),
    leadType: String(formState.leadType || "") || null,
    hooks: {
      extraSideEffects: runAppointmentMetFubAppointmentSideEffect,
    },
  });

  return Response.json(result);
}
