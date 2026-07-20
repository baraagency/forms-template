import type {
  FormFubDealMapping,
  FormFubPersonMapping,
  FormSisuMapping,
} from "@/app/types/storage";
import type { SISUCreateTransactionRequest } from "@/app/types/sisu";

function isEmptyMappedValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

/**
 * Normalize form field values for external APIs.
 * Keeps strings/numbers/booleans; skips empties.
 */
export function normalizeMappedFieldValue(
  value: unknown,
  fieldType?: string | null,
): unknown {
  if (isEmptyMappedValue(value)) {
    return undefined;
  }

  const type = (fieldType ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (typeof value === "boolean") {
    if (type === "string" || type === "text" || type === "textarea") {
      return value ? "Yes" : undefined;
    }
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (type === "integer" || type === "int") {
      return Math.trunc(value);
    }
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (type === "integer" || type === "int") {
    const parsed = Number(trimmed.replace(/[$,%\s,]/g, ""));
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
  }

  if (
    type === "number" ||
    type === "decimal" ||
    type === "float" ||
    type === "currency" ||
    type === "percent" ||
    type === "percentage"
  ) {
    const parsed = Number(trimmed.replace(/[$,%\s,]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (type === "date") {
    const iso = trimmed.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return iso;
    }
    const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return trimmed;
  }

  if (trimmed === "true") {
    return type === "boolean" ? true : "Yes";
  }
  if (trimmed === "false") {
    return type === "boolean" ? false : undefined;
  }

  return trimmed;
}

export function applyFubFieldMappings(
  formState: Record<string, unknown>,
  mappings: Array<FormFubPersonMapping | FormFubDealMapping>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const mapping of mappings) {
    if (!mapping.enabled || !mapping.fub_field_name?.trim()) {
      continue;
    }
    const normalized = normalizeMappedFieldValue(formState[mapping.field_name]);
    if (normalized === undefined) {
      continue;
    }
    payload[mapping.fub_field_name.trim()] = normalized;
  }

  return payload;
}

export function applySisuFieldMappings(
  formState: Record<string, unknown>,
  mappings: FormSisuMapping[],
): SISUCreateTransactionRequest {
  const mappedPayload: SISUCreateTransactionRequest = {};
  const customPayload: Record<string, unknown> = {};

  for (const mapping of mappings) {
    if (!mapping.enabled || !mapping.sisu_field_name?.trim()) {
      continue;
    }

    const normalized = normalizeMappedFieldValue(
      formState[mapping.field_name],
      mapping.sisu_field_type,
    );
    if (normalized === undefined) {
      continue;
    }

    const target = mapping.sisu_field_name.trim();
    if (mapping.custom) {
      customPayload[target] = normalized;
    } else {
      mappedPayload[target] = normalized;
    }
  }

  if (Object.keys(customPayload).length > 0) {
    mappedPayload.custom = customPayload;
  }

  return mappedPayload;
}
