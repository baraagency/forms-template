import { AppointmentMetPageFormClient } from "../forms/appointment-met/AppointmentMetPageFormClient";
import { APPOINTMENT_MET_PAGE_DOCUMENT } from "../forms/appointment-met/appointmentMetPageDocument";
import { canEditFormPages } from "@/app/api/_services/settingsAdminAuth";
import { loadPublishedFormPage } from "@/app/api/_services/formPageService";
import { buildFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.appointment-met";

export async function loader({ request }: Route.LoaderArgs) {
  const base = await buildFormLoaderData(request);
  const pageDocument = await loadPublishedFormPage(
    "appointmentMet",
    APPOINTMENT_MET_PAGE_DOCUMENT,
  );

  return {
    ...base,
    pageDocument,
    canEditPage: canEditFormPages(request),
  };
}

export default function AppointmentMetFormPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <AppointmentMetPageFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={loaderData.previousSubmissionFormData}
      localDemoEnabled={loaderData.localDemoEnabled}
      pageDocument={loaderData.pageDocument}
      canEditPage={loaderData.canEditPage}
    />
  );
}
