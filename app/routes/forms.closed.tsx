import { ClosedFormClient } from "../forms/closed/ClosedFormClient";
import { buildFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.closed";

export async function loader({ request }: Route.LoaderArgs) {
  return buildFormLoaderData(request);
}

export default function ClosedFormPage({ loaderData }: Route.ComponentProps) {
  return (
    <ClosedFormClient
      searchParams={loaderData.searchParams}
      previousSubmissionFormData={loaderData.previousSubmissionFormData}
      localDemoEnabled={loaderData.localDemoEnabled}
    />
  );
}
