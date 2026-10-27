import type { StorageResult } from "@/app/api/_services/dbPool";
import {
  getTeamFieldOptions,
  type TeamFieldCatalog,
} from "@/app/forms/_core/teamFieldOptions";
import { collectPageFields } from "./formPageData";
import type { FieldBlockProps, FormPageData } from "./formPageTypes";

/**
 * Resolve SISU option snapshots for the published document. A catalog failure
 * keeps the saved snapshot and reports a warning; it must not block publishing.
 */
export async function resolvePublishedPageOptions(
  data: FormPageData,
  loadCatalog: () => Promise<StorageResult<TeamFieldCatalog>>,
): Promise<{ data: FormPageData; warnings: string[] }> {
  const sisuFields = collectPageFields(data).filter(
    (field) => field.optionSource === "sisu",
  );

  if (sisuFields.length === 0) {
    return { data, warnings: [] };
  }

  const catalogResult = await loadCatalog();
  if (catalogResult.error || !catalogResult.data) {
    return {
      data,
      warnings: [
        "SISU options could not be refreshed; keeping the saved options.",
      ],
    };
  }

  const catalog = catalogResult.data;
  const warnings: string[] = [];

  const next: FormPageData = {
    ...data,
    content: data.content.map((block) => {
      if (block.type !== "FieldBlock") {
        return block;
      }

      const field = block.props as unknown as FieldBlockProps;
      if (field.optionSource !== "sisu") {
        return block;
      }

      if (!field.sisuFieldKey) {
        warnings.push(
          `Field "${field.label}" has no SISU field key; keeping saved options.`,
        );
        return block;
      }

      const options = getTeamFieldOptions(
        catalog,
        [field.sisuFieldKey],
        field.options ?? [],
      );

      return {
        ...block,
        props: { ...block.props, options },
      };
    }),
  };

  return { data: next, warnings };
}
