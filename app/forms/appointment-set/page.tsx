import { AppointmentSetFormClient } from "./AppointmentSetFormClient";
import {
  applyLocalDemoSearchParams,
  isLocalFormsDemoEnvironment,
} from "../_core/localFormsDemo";

type SearchParamValue = string | string[] | undefined;
type AppointmentSetSearchParams = Record<string, SearchParamValue>;

export default async function AppointmentSetPage({
  searchParams,
}: {
  searchParams: Promise<AppointmentSetSearchParams>;
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
    <AppointmentSetFormClient
      searchParams={effectiveSearchParams}
      previousSubmissionFormData={null}
      localDemoEnabled={appliedLocalDemo}
    />
  );
}
