import type { FUBDeal, FUBPerson, FUBUser } from "@/app/types/fub";

export type FormRouterQuery = {
  personId: string | null;
  agentId: string | null;
  context: string | null;
  signature: string | null;
};

export type FormRouterFubContext = {
  clientName?: string;
  fubUserId?: number;
  fubUserName?: string;
  fubPersonId?: number;
  accountId?: number;
} | null;

export type FormRouterFormKey = "pending";

export type AgentOption = {
  id: number;
  name: string;
};

const SELLER_PIPELINE_ID = 17;

export function parsePositiveInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseFormRouterQuery(search: string): FormRouterQuery {
  const params = new URLSearchParams(search);

  return {
    personId: params.get("personId") ?? params.get("clientId"),
    agentId: params.get("agentId"),
    context: params.get("context"),
    signature: params.get("signature"),
  };
}

export function hasFubContext(
  query: Pick<FormRouterQuery, "context" | "signature">,
  contextData: FormRouterFubContext,
): boolean {
  return Boolean(
    query.context ||
    query.signature ||
    contextData?.fubPersonId ||
    contextData?.fubUserId ||
    contextData?.accountId ||
    contextData?.clientName,
  );
}

export function buildFormRouteUrl(
  pathname: string,
  values: {
    clientId: number;
    agentId: number | null;
    clientName: string;
    agentName?: string | null;
    dealId?: string | null;
    sisuTransactionId?: string | null;
    context?: string | null;
    signature?: string | null;
  },
): string {
  const params = new URLSearchParams();
  params.set("clientId", String(values.clientId));

  if (values.agentId) {
    params.set("agentId", String(values.agentId));
  }
  if (values.agentName?.trim()) {
    params.set("agentName", values.agentName.trim());
  }

  const trimmedClientName = values.clientName.trim();
  if (trimmedClientName) {
    params.set("clientName", trimmedClientName);
  }
  if (parsePositiveInteger(values.dealId ?? null)) {
    params.set("dealId", values.dealId!);
  }
  if (values.sisuTransactionId) {
    params.set("sisuTransactionId", values.sisuTransactionId);
  }

  const context = values.context?.trim();
  if (context) {
    params.set("context", context);
  }

  const signature = values.signature?.trim();
  if (signature) {
    params.set("signature", signature);
  }

  return `${pathname}?${params.toString()}`;
}

type FormRouterReturnQuery = {
  clientId?: string | number | null;
  context?: string | null;
  signature?: string | null;
};

function readTrimmedSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}

export function buildFormRouterReturnUrl(
  clientId?: string | number | null,
  extra?: Omit<FormRouterReturnQuery, "clientId">,
): string {
  const params = new URLSearchParams();
  const value =
    typeof clientId === "number" ? String(clientId) : clientId?.trim();

  if (value) {
    params.set("clientId", value);
  }

  const context = extra?.context?.trim();
  if (context) {
    params.set("context", context);
  }

  const signature = extra?.signature?.trim();
  if (signature) {
    params.set("signature", signature);
  }

  const query = params.toString();
  return query ? `/forms?${query}` : "/forms";
}

export function buildFormRouterReturnUrlFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  options?: { personId?: string },
): string {
  return buildFormRouterReturnUrl(
    options?.personId?.trim() ||
      readTrimmedSearchParam(searchParams, "clientId") ||
      readTrimmedSearchParam(searchParams, "personId"),
    {
      context: readTrimmedSearchParam(searchParams, "context"),
      signature: readTrimmedSearchParam(searchParams, "signature"),
    },
  );
}

export function getContextBadge(
  queryPersonId: string | null,
  contextPersonId: number | null,
): string {
  if (queryPersonId) {
    return `clientId: ${queryPersonId}`;
  }

  if (contextPersonId) {
    return `clientId: ${contextPersonId}`;
  }

  return "No CRM identifier provided";
}

export function mapFubUserToAgentOption(user: FUBUser): AgentOption {
  const id = Number(user.id);
  const nameParts = [user.firstName, user.lastName].filter(Boolean);
  const displayName =
    nameParts.join(" ").trim() || user.email || `User ${user.id}`;

  return {
    id,
    name: displayName,
  };
}

export function getPersonLabel(person: FUBPerson): string {
  const nameParts = [person.firstName, person.lastName].filter(Boolean);
  return nameParts.join(" ").trim() || person.email || `Person #${person.id}`;
}

export function getDealLabel(deal: FUBDeal): string {
  if (typeof deal.name === "string" && deal.name.trim()) {
    return deal.name.trim();
  }

  const idLabel = `Deal #${deal.id ?? "Unknown"}`;
  if (typeof deal.status === "string" && deal.status.trim()) {
    return `${idLabel} - ${deal.status.trim()}`;
  }

  return idLabel;
}

export function getDealStageLabel(deal: FUBDeal): string | null {
  if (typeof deal.stageName === "string" && deal.stageName.trim()) {
    return deal.stageName.trim();
  }

  if (typeof deal.stage === "string" && deal.stage.trim()) {
    return deal.stage.trim();
  }

  if (typeof deal.stageId === "string" || typeof deal.stageId === "number") {
    return `Stage #${deal.stageId}`;
  }

  return null;
}

function normalizeDealStatus(deal: FUBDeal): string {
  return typeof deal.status === "string"
    ? deal.status.trim().toLowerCase()
    : "";
}

function normalizeDealStage(deal: FUBDeal): string {
  const stageLabel = getDealStageLabel(deal);
  return stageLabel ? stageLabel.toLowerCase() : normalizeDealStatus(deal);
}

function isInactiveDeal(deal: FUBDeal): boolean {
  const stage = normalizeDealStage(deal);
  const stageId =
    typeof deal.stageId === "number" ? deal.stageId : Number(deal.stageId);

  return (
    stageId === 179 ||
    stageId === 187 ||
    stage.includes("closed") ||
    stage.includes("lost")
  );
}

function getDealPipelineId(deal: FUBDeal): number {
  const pipelineId = deal.pipelineId ?? deal.piplineId;
  return typeof pipelineId === "number" ? pipelineId : Number(pipelineId);
}

function isSellerDeal(deal: FUBDeal): boolean {
  return getDealPipelineId(deal) === SELLER_PIPELINE_ID;
}

export function getDealTypeLabel(deal: FUBDeal): "Buyer" | "Seller" {
  if (isSellerDeal(deal)) {
    return "Seller";
  }

  const stage = normalizeDealStage(deal);
  if (stage.includes("seller")) {
    return "Seller";
  }
  if (stage.includes("buyer")) {
    return "Buyer";
  }

  return "Buyer";
}

export function filterDealsForForm(deals: FUBDeal[]): FUBDeal[] {
  return deals.filter((deal) => !isInactiveDeal(deal));
}

export function getDealSisuTransactionId(
  deal: FUBDeal | undefined,
): string | null {
  if (!deal) {
    return null;
  }

  const value = deal.customSisuTransactionId ?? deal.customSISUID;
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}
