import type { StorageResult } from "@/app/api/_services/dbPool";
import {
  getTeamFieldOptions,
  type TeamFieldCatalog,
} from "@/app/forms/_core/teamFieldOptions";
import { collectPageFields } from "./formPageData";
import type { FieldBlockProps, FieldOption, FormPageData } from "./formPageTypes";

export type PublishOptionLoaders = {
  loadSisuTeamFields: () => Promise<StorageResult<TeamFieldCatalog>>;
  loadSisuAgents: (roleFilter: string) => Promise<StorageResult<FieldOption[]>>;
  loadSisuVendors: (group: string) => Promise<StorageResult<FieldOption[]>>;
  loadFubUsers: () => Promise<StorageResult<FieldOption[]>>;
  loadFubAppointmentTypes: () => Promise<StorageResult<FieldOption[]>>;
};

function replaceOptions(
  data: FormPageData,
  fieldId: string,
  options: FieldOption[],
): FormPageData {
  return {
    ...data,
    content: data.content.map((block) => {
      if (block.type !== "FieldBlock" || block.props.id !== fieldId) {
        return block;
      }
      return { ...block, props: { ...block.props, options } };
    }),
  };
}

export function findRemovedPublishedFields(
  previous: FormPageData | null,
  next: FormPageData,
): FieldBlockProps[] {
  if (!previous) {
    return [];
  }
  const nextIds = new Set(collectPageFields(next).map((field) => field.id));
  return collectPageFields(previous).filter((field) => !nextIds.has(field.id));
}

/**
 * Resolve every dynamic option source into the published snapshot. A catalog
 * failure keeps the saved snapshot and reports a warning; it must not block
 * publishing.
 */
export async function resolvePublishedPageOptions(
  data: FormPageData,
  loaders: PublishOptionLoaders,
): Promise<{ data: FormPageData; warnings: string[] }> {
  const fields = collectPageFields(data);
  const warnings: string[] = [];
  let next = data;

  const sisuFields = fields.filter((field) => field.optionSource === "sisu");
  if (sisuFields.length > 0) {
    const catalogResult = await loaders.loadSisuTeamFields();
    if (catalogResult.error || !catalogResult.data) {
      warnings.push(
        "SISU options could not be refreshed; keeping the saved options.",
      );
    } else {
      for (const field of sisuFields) {
        if (!field.sisuFieldKey) {
          warnings.push(
            `Field "${field.label}" has no SISU field key; keeping saved options.`,
          );
          continue;
        }
        next = replaceOptions(
          next,
          field.id,
          getTeamFieldOptions(
            catalogResult.data,
            [field.sisuFieldKey],
            field.options ?? [],
          ),
        );
      }
    }
  }

  const agentFilters = new Set(
    fields
      .filter((field) => field.optionSource === "sisuAgents")
      .map((field) => field.optionFilter?.trim())
      .filter((filter): filter is string => Boolean(filter)),
  );
  for (const filter of agentFilters) {
    const result = await loaders.loadSisuAgents(filter);
    if (result.error || !result.data) {
      warnings.push(
        `SISU agent options (${filter}) could not be refreshed; keeping saved options.`,
      );
      continue;
    }
    for (const field of fields) {
      if (
        field.optionSource === "sisuAgents" &&
        field.optionFilter?.trim() === filter
      ) {
        next = replaceOptions(next, field.id, result.data);
      }
    }
  }

  const vendorGroups = new Set(
    fields
      .filter((field) => field.optionSource === "sisuVendors")
      .map((field) => field.optionFilter?.trim())
      .filter((filter): filter is string => Boolean(filter)),
  );
  for (const group of vendorGroups) {
    const result = await loaders.loadSisuVendors(group);
    if (result.error || !result.data) {
      warnings.push(
        `SISU vendor options (${group}) could not be refreshed; keeping saved options.`,
      );
      continue;
    }
    for (const field of fields) {
      if (
        field.optionSource === "sisuVendors" &&
        field.optionFilter?.trim() === group
      ) {
        next = replaceOptions(next, field.id, result.data);
      }
    }
  }

  const fubUserFields = fields.filter(
    (field) => field.optionSource === "fubUsers",
  );
  if (fubUserFields.length > 0) {
    const result = await loaders.loadFubUsers();
    if (result.error || !result.data) {
      warnings.push(
        "FUB user options could not be refreshed; keeping saved options.",
      );
    } else {
      for (const field of fubUserFields) {
        next = replaceOptions(next, field.id, result.data);
      }
    }
  }

  const fubAppointmentTypeFields = fields.filter(
    (field) => field.optionSource === "fubAppointmentTypes",
  );
  if (fubAppointmentTypeFields.length > 0) {
    const result = await loaders.loadFubAppointmentTypes();
    if (result.error || !result.data) {
      warnings.push(
        "FUB appointment type options could not be refreshed; keeping saved options.",
      );
    } else {
      for (const field of fubAppointmentTypeFields) {
        next = replaceOptions(next, field.id, result.data);
      }
    }
  }

  return { data: next, warnings };
}
