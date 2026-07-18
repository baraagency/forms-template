import { AppointmentMetFormClient } from "./AppointmentMetFormClient";
import {
  applyLocalDemoSearchParams,
  isLocalFormsDemoEnvironment,
} from "../_core/localFormsDemo";

type SearchParamValue = string | string[] | undefined;
type AppointmentMetSearchParams = Record<string, SearchParamValue>;

export default async function AppointmentMetPage({
  searchParams,
}: {
  searchParams: Promise<AppointmentMetSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const localDemoEnabled = isLocalFormsDemoEnvironment(process.env.ENVIRONMENT);
  const effectiveSearchParams = applyLocalDemoSearchParams(
    resolvedSearchParams,
    localDemoEnabled,
  );
  const appliedLocalDemo =
    localDemoEnabled &&
    !resolvedSearchParams.clientId &&
    !resolvedSearchParams.personId;

  return (
    <AppointmentMetFormClient
      searchParams={effectiveSearchParams}
      previousSubmissionFormData={null}
      localDemoEnabled={appliedLocalDemo}
    />
  );
}
