import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";
import { collectPageFields, parseFormPageData } from "@/app/forms/editor/formPageData";
import type { FormPageData } from "@/app/forms/editor/formPageTypes";
import type { FormFieldOption } from "@/app/forms/settings/formFieldCatalog";
import { getFormPageFallback } from "@/app/forms/pageDocumentRegistry";
import { getFormPage } from "./formPageQueries";

export async function loadDraftFormPage(
  form: SettingsFormKind,
  fallback: FormPageData,
): Promise<{ data: FormPageData; version: number }> {
  const result = await getFormPage(form);
  if (result.error || !result.data) {
    return { data: fallback, version: 0 };
  }

  const parsed = parseFormPageData(result.data.draft);
  return parsed.ok
    ? { data: parsed.data, version: result.data.version }
    : { data: fallback, version: result.data.version };
}

export async function loadPublishedFormPage(
  form: SettingsFormKind,
  fallback: FormPageData,
): Promise<FormPageData> {
  const result = await getFormPage(form);
  if (result.error || !result.data?.published) {
    return fallback;
  }

  const parsed = parseFormPageData(result.data.published, {
    forPublish: true,
  });
  return parsed.ok ? parsed.data : fallback;
}

/** Published field labels/order, then legacy catalog fields for hidden keys. */
export async function loadPublishedFormFieldOptions(
  form: SettingsFormKind,
): Promise<FormFieldOption[]> {
  const page = await loadPublishedFormPage(form, getFormPageFallback(form));
  return collectPageFields(page).map((field) => ({
    value: field.id,
    label: field.label,
  }));
}
