import { ClosedFormClient } from "../forms/closed/ClosedFormClient";
import { buildLocalDemoFormLoaderData } from "./formLoaderUtils";
import type { Route } from "./+types/forms.closed";

export async function loader({ request }: Route.LoaderArgs) {
  return buildLocalDemoFormLoaderData(request);
}

export default function ClosedFormPage({ loaderData }: Route.ComponentProps) {
  return (
    <ClosedFormClient
      searchParams={loaderData.searchParams}
      localDemoEnabled={loaderData.localDemoEnabled}
    />
  );
}
