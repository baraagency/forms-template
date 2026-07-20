import {
  applyLocalDemoSearchParams,
  isLocalFormsDemoEnvironment,
} from "../forms/_core/localFormsDemo";

type SearchParamValue = string | string[] | undefined;

export function searchParamsFromRequest(
  request: Request,
): Record<string, SearchParamValue> {
  const url = new URL(request.url);
  const result: Record<string, SearchParamValue> = {};
  for (const key of url.searchParams.keys()) {
    const values = url.searchParams.getAll(key);
    result[key] = values.length <= 1 ? (values[0] ?? undefined) : values;
  }
  return result;
}

export function buildLocalDemoFormLoaderData(request: Request) {
  const resolvedSearchParams = searchParamsFromRequest(request);
  const localDemoEnabled = isLocalFormsDemoEnvironment(process.env.ENVIRONMENT);
  const effectiveSearchParams = applyLocalDemoSearchParams(
    resolvedSearchParams,
    localDemoEnabled,
  );
  const appliedLocalDemo =
    localDemoEnabled &&
    !resolvedSearchParams.clientId &&
    !resolvedSearchParams.personId;

  return {
    searchParams: effectiveSearchParams,
    localDemoEnabled: appliedLocalDemo,
  };
}
