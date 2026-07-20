import {
  normalizePendingPayload,
  validatePendingForm,
  type PendingFormState,
} from "@/app/forms/pending/pendingFormUtils";
import { formKindLabel } from "@/app/forms/_core/formIdentity";
import { runSubmissionWorkflow } from "@/app/api/_services/submissionWorkflow";

function isPendingPayload(payload: unknown): payload is Record<string, unknown> {
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

  if (!isPendingPayload(payload)) {
    return Response.json({ message: "Pending payload is required." }, { status: 400 });
  }

  const formState: PendingFormState = normalizePendingPayload(payload);
  const errors = validatePendingForm(formState);

  if (!formState.personId) {
    errors.personId = "A FUB person id is required.";
  }

  if (Object.keys(errors).length > 0) {
    return Response.json(
      { message: "Pending submission has validation errors.", errors },
      { status: 400 },
    );
  }

  const result = await runSubmissionWorkflow({
    form: "pending",
    formLabel: formKindLabel("pending"),
    formState: formState as unknown as Record<string, unknown>,
    personId: formState.personId,
    dealId: formState.dealId || null,
    sisuTransactionId: formState.sisuTransactionId || null,
    agentId: formState.agentId || null,
    leadType: formState.clientType || null,
    hooks: {},
  });

  return Response.json(result);
}
