import { loadFixture } from "@/app/api/_mock/loadFixture";
import { fetchLiveFubAppointmentTypes } from "@/app/api/_services/fubLiveClient";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
import type { StorageResult } from "@/app/api/_services/dbPool";
import type { FieldOption } from "@/app/forms/editor/formPageTypes";

type AppointmentTypesFixture = {
  appointmentTypes: Array<{ id: number; name: string }>;
};

/** FUB appointment types as publish-time option snapshots. */
export async function loadFubAppointmentTypeOptions(): Promise<
  StorageResult<FieldOption[]>
> {
  if (isFubApiEnabled()) {
    const live = await fetchLiveFubAppointmentTypes();
    if (live.error || !live.data) {
      return {
        data: null,
        error: live.error ?? "Failed to load FUB appointment types.",
      };
    }

    return {
      data: [...live.data]
        .filter((type) => Number.isInteger(type.id) && type.id > 0)
        .sort((left, right) => {
          const leftWeight =
            typeof left.orderWeight === "number"
              ? left.orderWeight
              : Number.MAX_SAFE_INTEGER;
          const rightWeight =
            typeof right.orderWeight === "number"
              ? right.orderWeight
              : Number.MAX_SAFE_INTEGER;
          return (
            leftWeight - rightWeight ||
            left.name.localeCompare(right.name) ||
            left.id - right.id
          );
        })
        .map((type) => ({
          value: String(type.id),
          label: type.name.trim(),
        })),
      error: null,
    };
  }

  const fixture = loadFixture<AppointmentTypesFixture>(
    "fub-appointment-types.json",
  );
  return {
    data: [...fixture.appointmentTypes]
      .filter((type) => Number.isInteger(type.id) && type.id > 0)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((type) => ({ value: String(type.id), label: type.name })),
    error: null,
  };
}
