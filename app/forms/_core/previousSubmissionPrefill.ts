import type { FormSubmission, JsonValue } from "@/app/types/storage";

function isRecord(value: JsonValue | undefined): value is Record<string, JsonValue | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toFormString(value: JsonValue | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

/**
 * Normalize stored submission data for form prefill, including resolved deal
 * and SISU ids from the submission row when missing in `form_data`.
 */
export function buildPreviousSubmissionFormDataFromRecord(
  submission: FormSubmission | null | undefined,
): JsonValue | null {
  if (!submission) {
    return null;
  }

  const base = submission.form_data;
  if (!isRecord(base)) {
    if (!submission.deal_fub_id) {
      return null;
    }

    return { dealId: String(submission.deal_fub_id) };
  }

  const next: Record<string, JsonValue | undefined> = { ...base };

  if (submission.deal_fub_id) {
    const dealId = String(submission.deal_fub_id);
    if (!toFormString(next.dealId)) {
      next.dealId = dealId;
    }
  }

  return next;
}

export function applyPreviousSubmissionFormData<TState extends Record<string, string>>(
  current: TState,
  formData: JsonValue | undefined,
): TState {
  if (!isRecord(formData)) {
    return current;
  }

  const nextState = { ...current };

  for (const key of Object.keys(current) as Array<keyof TState & string>) {
    if (current[key]) {
      continue;
    }

    const storedValue = toFormString(formData[key]);
    if (storedValue !== null && storedValue !== "") {
      nextState[key] = storedValue as TState[keyof TState & string];
    }
  }

  return nextState;
}
