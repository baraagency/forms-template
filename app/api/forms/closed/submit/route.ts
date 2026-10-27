import { formKindLabel } from "@/app/forms/_core/formIdentity";
import { buildClosedSubmission } from "@/app/forms/closed/closedPageSubmit";
import { CLOSED_PAGE_DOCUMENT } from "@/app/forms/closed/closedPageDocument";
import { loadPublishedFormPage } from "@/app/api/_services/formPageService";
import { runSubmissionWorkflow } from "@/app/api/_services/submissionWorkflow";

function isClosedPayload(payload: unknown): payload is Record<string, unknown> {
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

  if (!isClosedPayload(payload)) {
    return Response.json(
      { message: "Closed payload is required." },
      { status: 400 },
    );
  }

  const document = await loadPublishedFormPage(
    "closed",
    CLOSED_PAGE_DOCUMENT,
  );
  const { errors, formState } = buildClosedSubmission(document, payload);

  if (Object.keys(errors).length > 0) {
    return Response.json(
      {
        message: "Closed submission has validation errors.",
        errors,
      },
      { status: 400 },
    );
  }

  const result = await runSubmissionWorkflow({
    form: "closed",
    formLabel: formKindLabel("closed"),
    formState: formState as Record<string, unknown>,
    personId: String(formState.personId),
    dealId: String(formState.dealId || "") || null,
    sisuTransactionId: String(formState.sisuTransactionId || "") || null,
    agentId: String(formState.agentId || "") || null,
    leadType: String(formState.clientType || formState.leadType || "") || null,
    hooks: {},
  });

  return Response.json(result);
}
