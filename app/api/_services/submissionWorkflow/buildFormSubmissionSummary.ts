import {
  DEFAULT_APP_BRANDING,
  DEFAULT_RESOLVED_THEME,
  type AppBranding,
  type ResolvedAppTheme,
} from "@/app/theme/appTheme";
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

function buildSummaryStyles(theme: ResolvedAppTheme) {
  const border = `1px solid ${theme.emailBorder}`;

  return {
    table: `border-collapse:collapse;width:100%;max-width:640px;border:${border};color:${theme.structure};`,
    header: `background-color:${theme.accentSoft};color:${theme.structure};font-weight:600;text-align:left;padding:8px 10px;border:${border};`,
    cell: `padding:8px 10px;border:${border};vertical-align:top;color:${theme.structure};`,
  };
}

function buildLogoHtml(branding: AppBranding): string {
  if (!branding.logoUrl) {
    return "";
  }

  return `<p style="margin:0 0 16px;"><img src="${escapeHtml(
    branding.logoUrl,
  )}" alt="${escapeHtml(
    branding.logoAlt,
  )}" style="display:block;max-width:220px;height:auto;border:0;" /></p>`;
}

function buildSummaryTableHtml(
  subject: string,
  rows: Array<{ label: string; value: string }>,
  theme: ResolvedAppTheme,
  branding: AppBranding,
): string {
  const logoHtml = buildLogoHtml(branding);

  if (rows.length === 0) {
    return `${logoHtml}<p><strong>${escapeHtml(subject)}</strong></p><p>(No field values submitted.)</p>`;
  }

  const styles = buildSummaryStyles(theme);
  const tableRows = rows
    .map(
      (row) =>
        `<tr><td style="${styles.cell}">${escapeHtml(row.label)}</td><td style="${styles.cell}">${formatSummaryHtmlValue(row.value)}</td></tr>`,
    )
    .join("");

  return [
    logoHtml,
    `<p><strong>${escapeHtml(subject)}</strong></p>`,
    `<table style="${styles.table}">`,
    `<thead><tr><th style="${styles.header}">Field</th><th style="${styles.header}">Value</th></tr></thead>`,
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
  fieldOptions?: readonly FormFieldOption[];
  theme?: ResolvedAppTheme;
  branding?: AppBranding;
}): Promise<{
  subject: string;
  body: string;
  htmlBody: string;
  rows: Array<{ label: string; value: string }>;
}> {
  const theme = input.theme ?? DEFAULT_RESOLVED_THEME;
  const branding = input.branding ?? DEFAULT_APP_BRANDING;
  const catalogOptions = getFormFieldOptions(input.form);
  const options: readonly FormFieldOption[] = input.fieldOptions
    ? [
        ...input.fieldOptions,
        ...catalogOptions.filter(
          (option) =>
            !input.fieldOptions!.some(
              (candidate) => candidate.value === option.value,
            ),
        ),
      ]
    : catalogOptions;
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
  const htmlBody = buildSummaryTableHtml(subject, rows, theme, branding);

  return { subject, body, htmlBody, rows };
}
