import {
  applyDemoSearchParams,
  isFormsDemoMode,
} from "../forms/_core/localFormsDemo";
import { parsePositiveInteger } from "../forms/_core/formRouterUtils";
import { buildPreviousSubmissionFormDataFromRecord } from "../forms/_core/previousSubmissionPrefill";
import { findLatestFormSubmissionByDealFubId } from "@/app/api/_services/formSubmissionQueries";
import type { JsonValue } from "@/app/types/storage";

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

function readSingleSearchParamValue(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function parseDealFubIdFromSearchParams(
  searchParams: Record<string, SearchParamValue>,
): number | null {
  const rawDealId = readSingleSearchParamValue(searchParams.dealId);
  if (!rawDealId || rawDealId === "create-new") {
    return null;
  }

  return parsePositiveInteger(rawDealId);
}

export function buildLocalDemoFormLoaderData(request: Request) {
  const resolvedSearchParams = searchParamsFromRequest(request);
  const demoModeEnabled = isFormsDemoMode(process.env.DEMO_MODE);
  const effectiveSearchParams = applyDemoSearchParams(
    resolvedSearchParams,
    demoModeEnabled,
  );
  const appliedDemoMode =
    demoModeEnabled &&
    !resolvedSearchParams.clientId &&
    !resolvedSearchParams.personId;

  return {
    searchParams: effectiveSearchParams,
    localDemoEnabled: appliedDemoMode,
  };
}

export async function buildFormLoaderData(request: Request) {
  const base = buildLocalDemoFormLoaderData(request);
  const dealFubId = parseDealFubIdFromSearchParams(base.searchParams);
  let previousSubmissionFormData: JsonValue | null = null;

  if (dealFubId) {
    const submissionResult = await findLatestFormSubmissionByDealFubId(dealFubId);
    previousSubmissionFormData = buildPreviousSubmissionFormDataFromRecord(
      submissionResult.data,
    );
  }

  return {
    ...base,
    previousSubmissionFormData,
  };
}
