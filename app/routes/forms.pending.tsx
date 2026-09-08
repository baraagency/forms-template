import { PendingFormClient } from "../forms/pending/PendingFormClient";
import { buildFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.pending";

export async function loader({ request }: Route.LoaderArgs) {
  return buildFormLoaderData(request);
}

export default function PendingFormPage({ loaderData }: Route.ComponentProps) {
  return (
    <PendingFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={loaderData.previousSubmissionFormData}
      localDemoEnabled={loaderData.localDemoEnabled}
    />
  );
}
