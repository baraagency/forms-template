import { PendingFormClient } from "../forms/pending/PendingFormClient";
import { buildLocalDemoFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.pending";

export async function loader({ request }: Route.LoaderArgs) {
  return buildLocalDemoFormLoaderData(request);
}

export default function PendingFormPage({ loaderData }: Route.ComponentProps) {
  return (
    <PendingFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={null}
      localDemoEnabled={loaderData.localDemoEnabled}
    />
  );
}
