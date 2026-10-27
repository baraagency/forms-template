import { PendingPageFormClient } from "../forms/pending/PendingPageFormClient";
import { PENDING_PAGE_DOCUMENT } from "../forms/pending/pendingPageDocument";
import { canEditFormPages } from "@/app/api/_services/settingsAdminAuth";
import { loadPublishedFormPage } from "@/app/api/_services/formPageService";
import { buildFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.pending";

export async function loader({ request }: Route.LoaderArgs) {
  const base = await buildFormLoaderData(request);
  const pageDocument = await loadPublishedFormPage(
    "pending",
    PENDING_PAGE_DOCUMENT,
  );

  return {
    ...base,
    pageDocument,
    canEditPage: canEditFormPages(request),
  };
}

export default function PendingFormPage({ loaderData }: Route.ComponentProps) {
  return (
    <PendingPageFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={loaderData.previousSubmissionFormData}
      localDemoEnabled={loaderData.localDemoEnabled}
      pageDocument={loaderData.pageDocument}
      canEditPage={loaderData.canEditPage}
    />
  );
}
