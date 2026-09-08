import {
  getFormFieldOptions,
  type FormFieldOption,
} from "@/app/forms/settings/formFieldCatalog";
import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";
import { formatFormSubmissionFieldValue } from "@/app/forms/_core/formSubmissionDisplayValues";
import { loadFormSubmissionDisplayContext } from "./loadFormSubmissionDisplayContext";

const EXCLUDED_SUMMARY_KEYS = new Set([
  "personId",
  "dealId",
  "sisuTransactionId",
  "agentId",
  "fubId",
  "fubDealId",
]);

function fieldLabel(
  options: readonly FormFieldOption[],
  fieldName: string,
): string {
  return options.find((option) => option.value === fieldName)?.label ?? fieldName;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSummaryHtmlValue(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>");
}

function buildSummaryTableHtml(
  subject: string,
  rows: Array<{ label: string; value: string }>,
): string {
  if (rows.length === 0) {
    return `<p><strong>${escapeHtml(subject)}</strong></p><p>(No field values submitted.)</p>`;
  }

  const tableRows = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td><td>${formatSummaryHtmlValue(row.value)}</td></tr>`,
    )
    .join("");

  return [
    `<p><strong>${escapeHtml(subject)}</strong></p>`,
    '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px;">',
    "<thead><tr><th align=\"left\">Field</th><th align=\"left\">Value</th></tr></thead>",
    `<tbody>${tableRows}</tbody>`,
    "</table>",
  ].join("");
}

/**
 * Build a human-readable label/value summary for FUB notes and summary email.
 * Uses the form field catalog for labels and form display formatting for values.
 */
export async function buildFormSubmissionSummary(input: {
  form: SettingsFormKind;
  formLabel: string;
  formState: Record<string, unknown>;
}): Promise<{
  subject: string;
  body: string;
  htmlBody: string;
  rows: Array<{ label: string; value: string }>;
}> {
  const options = getFormFieldOptions(input.form);
  const displayContext = await loadFormSubmissionDisplayContext(input.form);
  const rows: Array<{ label: string; value: string }> = [];

  for (const option of options) {
    if (EXCLUDED_SUMMARY_KEYS.has(option.value)) {
      continue;
    }
    const value = formatFormSubmissionFieldValue(
      input.form,
      option.value,
      input.formState[option.value],
      displayContext,
    );
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
    const value = formatFormSubmissionFieldValue(
      input.form,
      key,
      raw,
      displayContext,
    );
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
  const htmlBody = buildSummaryTableHtml(subject, rows);

  return { subject, body, htmlBody, rows };
}
