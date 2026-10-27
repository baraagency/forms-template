import { collectPageFields } from "./formPageData";
import { getVisiblePageFields } from "./formPageVisibility";
import { validatePageValues } from "./formPageValidation";
import type {
  FieldBlockProps,
  FieldValue,
  FormPageData,
} from "./formPageTypes";

function normalizeValue(
  field: FieldBlockProps,
  raw: unknown,
): FieldValue {
  if (field.kind === "multiChoice") {
    if (Array.isArray(raw)) {
      return raw.filter((entry): entry is string => typeof entry === "string");
    }
    return typeof raw === "string" && raw.trim() ? [raw] : [];
  }

  if (field.kind === "boolean") {
    if (raw === true) return "true";
    if (raw === false) return "false";
  }

  if (typeof raw === "string") {
    return raw;
  }
  if (typeof raw === "number" || typeof raw === "boolean") {
    return String(raw);
  }
  return "";
}

/**
 * Normalize raw client values, drop hidden fields, then validate what is
 * visible. Hidden values never reach the workflow.
 */
export function buildPageSubmission(
  document: FormPageData,
  raw: Record<string, unknown>,
): {
  fields: FieldBlockProps[];
  values: Record<string, FieldValue>;
  errors: Record<string, string>;
} {
  const fields = collectPageFields(document);
  const normalized: Record<string, FieldValue> = {};

  for (const field of fields) {
    normalized[field.id] = normalizeValue(field, raw[field.id]);
  }

  const visibleFields = getVisiblePageFields(fields, normalized);
  const values: Record<string, FieldValue> = {};

  for (const field of visibleFields) {
    values[field.id] = normalized[field.id];
  }

  return {
    fields: visibleFields,
    values,
    errors: validatePageValues(visibleFields, values),
  };
}
