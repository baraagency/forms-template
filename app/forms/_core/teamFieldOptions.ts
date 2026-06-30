import type { SISUTeamFieldsCatalogResponse } from "@/app/types/sisu";

export type TeamFieldSelectOption = {
  value: string;
  label: string;
};

export type TeamFieldCatalog = SISUTeamFieldsCatalogResponse["fields"];

function normalizeLookupValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getTeamFieldOptions(
  fields: TeamFieldCatalog,
  candidates: string[],
  fallbackOptions: TeamFieldSelectOption[],
  options: { useOptionKeyAsValue?: boolean } = {},
): TeamFieldSelectOption[] {
  const normalizedCandidates = new Set(candidates.map(normalizeLookupValue));
  const exactField = candidates.find((candidate) => fields[candidate]?.options.length);

  const field =
    (exactField ? fields[exactField] : undefined) ??
    Object.values(fields).find((entry) => {
      const normalizedName = normalizeLookupValue(entry.name);
      const normalizedLabel = normalizeLookupValue(entry.label);
      return normalizedCandidates.has(normalizedName) || normalizedCandidates.has(normalizedLabel);
    });

  if (!field?.options.length) {
    return fallbackOptions;
  }

  return field.options.map((option) => ({
    value: String(options.useOptionKeyAsValue ? option.key ?? option.value : option.value),
    label: option.label,
  }));
}
