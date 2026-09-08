import { AppointmentMetFormClient } from "../forms/appointment-met/AppointmentMetFormClient";
import { buildFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.appointment-met";

export async function loader({ request }: Route.LoaderArgs) {
  return buildFormLoaderData(request);
}

export default function AppointmentMetFormPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <AppointmentMetFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={loaderData.previousSubmissionFormData}
      localDemoEnabled={loaderData.localDemoEnabled}
    />
  );
}
