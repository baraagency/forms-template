import { AppointmentSetPageFormClient } from "../forms/appointment-set/AppointmentSetPageFormClient";
import { APPOINTMENT_SET_PAGE_DOCUMENT } from "../forms/appointment-set/appointmentSetPageDocument";
import { canEditFormPages } from "@/app/api/_services/settingsAdminAuth";
import { loadPublishedFormPage } from "@/app/api/_services/formPageService";
import { buildFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.appointment-set";

export async function loader({ request }: Route.LoaderArgs) {
  const base = await buildFormLoaderData(request);
  const pageDocument = await loadPublishedFormPage(
    "appointmentSet",
    APPOINTMENT_SET_PAGE_DOCUMENT,
  );

  return {
    ...base,
    pageDocument,
    canEditPage: canEditFormPages(request),
  };
}

export default function AppointmentSetFormPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <AppointmentSetPageFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={loaderData.previousSubmissionFormData}
      localDemoEnabled={loaderData.localDemoEnabled}
      pageDocument={loaderData.pageDocument}
      canEditPage={loaderData.canEditPage}
    />
  );
}
