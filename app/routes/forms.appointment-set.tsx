import { AppointmentSetFormClient } from "../forms/appointment-set/AppointmentSetFormClient";
import { buildLocalDemoFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.appointment-set";

export async function loader({ request }: Route.LoaderArgs) {
  return buildLocalDemoFormLoaderData(request);
}

export default function AppointmentSetFormPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <AppointmentSetFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={null}
      localDemoEnabled={loaderData.localDemoEnabled}
    />
  );
}
