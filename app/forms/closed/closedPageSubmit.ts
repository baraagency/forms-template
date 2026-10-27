import { buildPageSubmission } from "../editor/formPageSubmission";
import type { FormPageData } from "../editor/formPageTypes";

function readRoutingKey(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Build the workflow state from the published page document. Unknown payload
 * keys are dropped; editor-added fields survive because they are in the doc.
 */
export function buildClosedSubmission(
  document: FormPageData,
  payload: Record<string, unknown>,
): { errors: Record<string, string>; formState: Record<string, unknown> } {
  const submission = buildPageSubmission(document, payload);
  const personId = readRoutingKey(payload, "personId");

  const formState: Record<string, unknown> = {
    ...submission.values,
    personId,
    agentId: readRoutingKey(payload, "agentId"),
    dealId: readRoutingKey(payload, "dealId"),
    sisuTransactionId: readRoutingKey(payload, "sisuTransactionId"),
  };

  const errors = { ...submission.errors };
  if (!personId) {
    errors.personId = "A FUB person id is required.";
  }

  return { errors, formState };
}
