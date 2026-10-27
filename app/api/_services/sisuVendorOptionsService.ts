import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { StorageResult } from "@/app/api/_services/dbPool";
import type { FieldOption } from "@/app/forms/editor/formPageTypes";

type VendorsFixture = {
  vendors: Record<string, Array<{ value: string; label: string }>>;
};

/** SISU vendor group as publish-time option snapshots. */
export async function loadSisuVendorOptions(
  group: string,
): Promise<StorageResult<FieldOption[]>> {
  const fixture = loadFixture<VendorsFixture>("sisu-vendors.json");
  const options = fixture.vendors[group] ?? [];

  return {
    data: options.map((option) => ({
      value: option.value,
      label: option.label,
    })),
    error: null,
  };
}
