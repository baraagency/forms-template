import { ClosedFormClient } from "./ClosedFormClient";
import {
  applyLocalDemoSearchParams,
  isLocalFormsDemoEnvironment,
} from "../_core/localFormsDemo";

type SearchParamValue = string | string[] | undefined;
type ClosedSearchParams = Record<string, SearchParamValue>;

export default async function ClosedPage({
  searchParams,
}: {
  searchParams: Promise<ClosedSearchParams>;
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
    <ClosedFormClient
      searchParams={effectiveSearchParams}
      localDemoEnabled={appliedLocalDemo}
    />
  );
}
