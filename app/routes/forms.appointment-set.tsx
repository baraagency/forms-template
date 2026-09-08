import { AppointmentSetFormClient } from "../forms/appointment-set/AppointmentSetFormClient";
import { buildFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.appointment-set";

export async function loader({ request }: Route.LoaderArgs) {
  return buildFormLoaderData(request);
}

export default function AppointmentSetFormPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <AppointmentSetFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={loaderData.previousSubmissionFormData}
      localDemoEnabled={loaderData.localDemoEnabled}
    />
  );
}
