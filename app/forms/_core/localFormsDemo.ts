import {
  MOCK_AGENT_ID,
  MOCK_DEAL_ID,
  MOCK_PERSON_ID,
  MOCK_TRANSACTION_ID,
} from "@/app/api/_fixtures/constants";

export const DEMO_CLIENT_NAME = "Jane Client";
export const DEMO_AGENT_NAME = "Alex Agent";

/** True only when DEMO_MODE is explicitly set to "true" (case-insensitive). */
export function isFormsDemoMode(
  demoMode: string | undefined = process.env.DEMO_MODE,
): boolean {
  return demoMode?.trim().toLowerCase() === "true";
}

export function getDemoFixtureIds() {
  return {
    personId: String(MOCK_PERSON_ID),
    agentId: String(MOCK_AGENT_ID),
    dealId: String(MOCK_DEAL_ID),
    sisuTransactionId: String(MOCK_TRANSACTION_ID),
    clientName: DEMO_CLIENT_NAME,
    agentName: DEMO_AGENT_NAME,
  } as const;
}

type SearchParamValue = string | string[] | undefined;

function readSingleParam(
  searchParams: Record<string, SearchParamValue>,
  key: string,
): string {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}

/** When demo mode is on and no client is in the URL, fill fixture query params. */
export function applyDemoSearchParams(
  searchParams: Record<string, SearchParamValue>,
  demoModeEnabled: boolean,
): Record<string, SearchParamValue> {
  if (!demoModeEnabled) {
    return searchParams;
  }

  const hasClient =
    Boolean(readSingleParam(searchParams, "clientId")) ||
    Boolean(readSingleParam(searchParams, "personId"));
  if (hasClient) {
    return searchParams;
  }

  const fixtures = getDemoFixtureIds();
  return {
    ...searchParams,
    clientId: fixtures.personId,
    agentId: readSingleParam(searchParams, "agentId") || fixtures.agentId,
    dealId: readSingleParam(searchParams, "dealId") || fixtures.dealId,
    sisuTransactionId:
      readSingleParam(searchParams, "sisuTransactionId") ||
      fixtures.sisuTransactionId,
    clientName:
      readSingleParam(searchParams, "clientName") || fixtures.clientName,
    agentName: readSingleParam(searchParams, "agentName") || fixtures.agentName,
  };
}
