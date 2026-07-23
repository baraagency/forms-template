import { loadFixture } from "@/app/api/_mock/loadFixture";
import { fetchLiveFubAppointmentTypes } from "@/app/api/_services/fubLiveClient";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
import type { FUBAppointmentType } from "@/app/types/fub";

type AppointmentTypeOption = {
  id: number;
  name: string;
};

type AppointmentTypesFixture = {
  appointmentTypes: AppointmentTypeOption[];
};

function mapAppointmentTypes(types: FUBAppointmentType[]): AppointmentTypeOption[] {
  return [...types]
    .filter(
      (type) =>
        Number.isInteger(type.id) &&
        type.id > 0 &&
        typeof type.name === "string" &&
        type.name.trim().length > 0,
    )
    .sort((left, right) => {
      const leftWeight =
        typeof left.orderWeight === "number"
          ? left.orderWeight
          : Number.MAX_SAFE_INTEGER;
      const rightWeight =
        typeof right.orderWeight === "number"
          ? right.orderWeight
          : Number.MAX_SAFE_INTEGER;
      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight;
      }
      return left.name.localeCompare(right.name) || left.id - right.id;
    })
    .map((type) => ({
      id: type.id,
      name: type.name.trim(),
    }));
}

export async function loader() {
  if (isFubApiEnabled()) {
    const live = await fetchLiveFubAppointmentTypes();
    if (live.error || !live.data) {
      return Response.json(
        { message: live.error ?? "Failed to load FUB appointment types." },
        { status: live.status ?? 502 },
      );
    }

    return Response.json({
      appointmentTypes: mapAppointmentTypes(live.data),
    });
  }

  const fixture = loadFixture<AppointmentTypesFixture>(
    "fub-appointment-types.json",
  );
  return Response.json({
    appointmentTypes: mapAppointmentTypes(fixture.appointmentTypes),
  });
}
