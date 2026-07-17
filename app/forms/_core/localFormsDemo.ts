import {
  MOCK_AGENT_ID,
  MOCK_DEAL_ID,
  MOCK_PERSON_ID,
  MOCK_TRANSACTION_ID,
} from "@/app/api/_fixtures/constants";

export const LOCAL_DEMO_CLIENT_NAME = "Jane Client";
export const LOCAL_DEMO_AGENT_NAME = "Alex Agent";

/** True for local/dev sessions where fixture IDs may stand in for missing query params. */
export function isLocalFormsDemoEnvironment(
  environment?: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  const env = environment?.trim().toUpperCase();
  if (env === "LOCAL") {
    return true;
  }
  if (env === "PRODUCTION" || env === "STAGING") {
    return false;
  }
  return nodeEnv === "development";
}

export function getLocalDemoFixtureIds() {
  return {
    personId: String(MOCK_PERSON_ID),
    agentId: String(MOCK_AGENT_ID),
    dealId: String(MOCK_DEAL_ID),
    sisuTransactionId: String(MOCK_TRANSACTION_ID),
    clientName: LOCAL_DEMO_CLIENT_NAME,
    agentName: LOCAL_DEMO_AGENT_NAME,
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

/** When local demo is on and no client is in the URL, fill fixture query params. */
export function applyLocalDemoSearchParams(
  searchParams: Record<string, SearchParamValue>,
  localDemoEnabled: boolean,
): Record<string, SearchParamValue> {
  if (!localDemoEnabled) {
    return searchParams;
  }

  const hasClient =
    Boolean(readSingleParam(searchParams, "clientId")) ||
    Boolean(readSingleParam(searchParams, "personId"));
  if (hasClient) {
    return searchParams;
  }

  const fixtures = getLocalDemoFixtureIds();
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
