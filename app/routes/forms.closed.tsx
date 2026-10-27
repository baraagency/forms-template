import { ClosedPageFormClient } from "../forms/closed/ClosedPageFormClient";
import { CLOSED_PAGE_DOCUMENT } from "../forms/closed/closedPageDocument";
import { loadPublishedFormPage } from "@/app/api/_services/formPageService";
import { canEditFormPages } from "@/app/api/_services/settingsAdminAuth";
import { buildFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.closed";

export async function loader({ request }: Route.LoaderArgs) {
  const base = await buildFormLoaderData(request);
  const pageDocument = await loadPublishedFormPage(
    "closed",
    CLOSED_PAGE_DOCUMENT,
  );

  return {
    ...base,
    pageDocument,
    canEditPage: canEditFormPages(request),
  };
}

export default function ClosedFormPage({ loaderData }: Route.ComponentProps) {
  return (
    <ClosedPageFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={loaderData.previousSubmissionFormData}
      localDemoEnabled={loaderData.localDemoEnabled}
      pageDocument={loaderData.pageDocument}
      canEditPage={loaderData.canEditPage}
    />
  );
}
