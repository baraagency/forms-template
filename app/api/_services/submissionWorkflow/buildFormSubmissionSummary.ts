import {
  getFormFieldOptions,
  type FormFieldOption,
} from "@/app/forms/settings/formFieldCatalog";
import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";

const EXCLUDED_SUMMARY_KEYS = new Set([
  "personId",
  "dealId",
  "sisuTransactionId",
  "agentId",
  "fubId",
  "fubDealId",
]);

function formatSummaryValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatSummaryValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return "";
  }

  return String(value).trim();
}

function fieldLabel(
  options: readonly FormFieldOption[],
  fieldName: string,
): string {
  return options.find((option) => option.value === fieldName)?.label ?? fieldName;
}

/**
 * Build a human-readable label/value summary for FUB notes and summary email.
 * Uses the form field catalog for labels; skips empty values and routing ids.
 */
export function buildFormSubmissionSummary(input: {
  form: SettingsFormKind;
  formLabel: string;
  formState: Record<string, unknown>;
}): { subject: string; body: string; rows: Array<{ label: string; value: string }> } {
  const options = getFormFieldOptions(input.form);
  const rows: Array<{ label: string; value: string }> = [];

  for (const option of options) {
    if (EXCLUDED_SUMMARY_KEYS.has(option.value)) {
      continue;
    }
    const value = formatSummaryValue(input.formState[option.value]);
    if (!value) {
      continue;
    }
    rows.push({ label: option.label, value });
  }

  // Include any non-empty state keys not in the catalog (except excluded ids).
  for (const [key, raw] of Object.entries(input.formState)) {
    if (EXCLUDED_SUMMARY_KEYS.has(key)) {
      continue;
    }
    if (options.some((option) => option.value === key)) {
      continue;
    }
    const value = formatSummaryValue(raw);
    if (!value) {
      continue;
    }
    rows.push({ label: fieldLabel(options, key), value });
  }

  const subject = `${input.formLabel} Form Summary`;
  const body =
    rows.length === 0
      ? `${subject}\n\n(No field values submitted.)`
      : `${subject}\n\n${rows.map((row) => `${row.label}: ${row.value}`).join("\n")}`;

  return { subject, body, rows };
}
