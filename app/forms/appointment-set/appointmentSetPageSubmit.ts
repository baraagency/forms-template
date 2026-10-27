import { buildPageSubmission } from "../editor/formPageSubmission";
import { collectPageFields } from "../editor/formPageData";
import type { FormPageData } from "../editor/formPageTypes";
import {
  normalizeAppointmentSetPayload,
  toFubAppointmentTypeId,
  validateAppointmentSetForm,
  type AppointmentSetFormState,
} from "./appointmentSetFormUtils";

function normalizeLegacyAppointmentType(
  document: FormPageData,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const value = payload.appointmentType;
  if (typeof value !== "string" || !value.trim()) {
    return payload;
  }

  const field = collectPageFields(document).find(
    (candidate) => candidate.id === "appointmentType",
  );
  const types = (field?.options ?? [])
    .map((option) => ({ id: Number(option.value), name: option.label }))
    .filter((option) => Number.isInteger(option.id) && option.id > 0);
  const id = toFubAppointmentTypeId(value, types);
  return id === undefined
    ? payload
    : { ...payload, appointmentType: String(id) };
}

/**
 * Merge the document-driven values with the legacy form state so existing
 * mappings/prefill still see every known key. Editor-added fields survive.
 */
export function buildAppointmentSetSubmission(
  document: FormPageData,
  payload: Record<string, unknown>,
): {
  errors: Record<string, string>;
  formState: AppointmentSetFormState & Record<string, unknown>;
} {
  const normalizedPayload = normalizeLegacyAppointmentType(document, payload);
  const submission = buildPageSubmission(document, normalizedPayload);
  const normalized = normalizeAppointmentSetPayload(normalizedPayload);
  const formState = {
    ...normalized,
    ...submission.values,
  } as AppointmentSetFormState & Record<string, unknown>;

  const errors: Record<string, string> = {
    ...validateAppointmentSetForm(formState),
    ...submission.errors,
  };

  if (!formState.personId) {
    errors.personId = "A FUB person id is required.";
  }

  return { errors, formState };
}
