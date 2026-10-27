import { buildPageSubmission } from "../editor/formPageSubmission";
import type { FormPageData } from "../editor/formPageTypes";
import {
  normalizePendingPayload,
  validatePendingForm,
  type PendingFormState,
} from "./pendingFormUtils";

/**
 * Merge document values with the legacy Pending state. Hidden legacy keys
 * (agent2, office, commissionDelivery, etc.) stay in formState so existing
 * SISU/FUB mappings continue to work.
 */
export function buildPendingSubmission(
  document: FormPageData,
  payload: Record<string, unknown>,
): {
  errors: Record<string, string>;
  formState: PendingFormState & Record<string, unknown>;
} {
  const submission = buildPageSubmission(document, payload);
  const normalized = normalizePendingPayload(payload);
  const formState = {
    ...normalized,
    ...submission.values,
  } as PendingFormState & Record<string, unknown>;

  const errors: Record<string, string> = {
    ...validatePendingForm(formState),
    ...submission.errors,
  };

  if (!formState.personId) {
    errors.personId = "A FUB person id is required.";
  }

  return { errors, formState };
}
