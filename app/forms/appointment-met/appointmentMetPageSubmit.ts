import { buildPageSubmission } from "../editor/formPageSubmission";
import type { FormPageData } from "../editor/formPageTypes";
import {
  normalizeAppointmentMetPayload,
  validateAppointmentMetForm,
  type AppointmentMetFormState,
} from "./appointmentMetFormUtils";

/**
 * Merge the document-driven values with the legacy form state so the hidden
 * agentSubmitting key and existing mappings keep working.
 */
export function buildAppointmentMetSubmission(
  document: FormPageData,
  payload: Record<string, unknown>,
): {
  errors: Record<string, string>;
  formState: AppointmentMetFormState & Record<string, unknown>;
} {
  const submission = buildPageSubmission(document, payload);
  const normalized = normalizeAppointmentMetPayload(payload);
  const formState = {
    ...normalized,
    ...submission.values,
  } as AppointmentMetFormState & Record<string, unknown>;

  const errors: Record<string, string> = {
    ...validateAppointmentMetForm(formState),
    ...submission.errors,
  };

  if (!formState.personId) {
    errors.personId = "A FUB person id is required.";
  }

  return { errors, formState };
}
