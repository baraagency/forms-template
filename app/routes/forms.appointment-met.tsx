import { AppointmentMetFormClient } from "../forms/appointment-met/AppointmentMetFormClient";
import { buildLocalDemoFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.appointment-met";

export async function loader({ request }: Route.LoaderArgs) {
  return buildLocalDemoFormLoaderData(request);
}

export default function AppointmentMetFormPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <AppointmentMetFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={null}
      localDemoEnabled={loaderData.localDemoEnabled}
    />
  );
}
