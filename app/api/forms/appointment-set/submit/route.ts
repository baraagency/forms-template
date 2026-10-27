import { formKindLabel } from "@/app/forms/_core/formIdentity";
import { APPOINTMENT_SET_PAGE_DOCUMENT } from "@/app/forms/appointment-set/appointmentSetPageDocument";
import { buildAppointmentSetSubmission } from "@/app/forms/appointment-set/appointmentSetPageSubmit";
import { loadPublishedFormPage } from "@/app/api/_services/formPageService";
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

  const document = await loadPublishedFormPage(
    "appointmentSet",
    APPOINTMENT_SET_PAGE_DOCUMENT,
  );
  const { errors, formState } = buildAppointmentSetSubmission(document, payload);

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
    formState: formState as Record<string, unknown>,
    personId: String(formState.personId),
    dealId: String(formState.dealId || "") || null,
    sisuTransactionId: String(formState.sisuTransactionId || "") || null,
    agentId: String(formState.agentId || "") || null,
    leadType: String(formState.leadType || "") || null,
    hooks: {
      extraSideEffects: runAppointmentSetFubAppointmentSideEffect,
    },
  });

  return Response.json(result);
}
