import { formKindLabel } from "@/app/forms/_core/formIdentity";
import { PENDING_PAGE_DOCUMENT } from "@/app/forms/pending/pendingPageDocument";
import { buildPendingSubmission } from "@/app/forms/pending/pendingPageSubmit";
import { loadPublishedFormPage } from "@/app/api/_services/formPageService";
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
    return Response.json(
      { message: "Pending payload is required." },
      { status: 400 },
    );
  }

  const document = await loadPublishedFormPage(
    "pending",
    PENDING_PAGE_DOCUMENT,
  );
  const { errors, formState } = buildPendingSubmission(document, payload);

  if (Object.keys(errors).length > 0) {
    return Response.json(
      { message: "Pending submission has validation errors.", errors },
      { status: 400 },
    );
  }

  const result = await runSubmissionWorkflow({
    form: "pending",
    formLabel: formKindLabel("pending"),
    formState: formState as Record<string, unknown>,
    personId: String(formState.personId),
    dealId: String(formState.dealId || "") || null,
    sisuTransactionId: String(formState.sisuTransactionId || "") || null,
    agentId: String(formState.agentId || "") || null,
    leadType: String(formState.clientType || "") || null,
    hooks: {},
  });

  return Response.json(result);
}
