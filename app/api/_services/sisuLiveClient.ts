import type {
  SISUCreateTransactionRequest,
  SISUCreateTransactionResponse,
  SISUDropdownOption,
  SISUFindAgentRequest,
  SISUFindAgentResponse,
  SISUTeamField,
  SISUTeamFieldCatalogEntry,
  SISUTeamFieldsCatalogResponse,
  SISUTeamFieldsResponse,
} from "@/app/types/sisu";
import { isSisuApiEnabled } from "./sisuApiMode";

function normalizeSisuStatusCode(statusCode: unknown): number | null {
  if (typeof statusCode === "number" && Number.isFinite(statusCode)) {
    return statusCode;
  }

  if (typeof statusCode === "string" && statusCode.trim()) {
    const parsed = Number(statusCode);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getSisuBaseUrl(): string {
  return (process.env.SISU_API_URL || "https://api.sisu.co/api").replace(
    /\/$/,
    "",
  );
}

export type SisuLiveResult<T> =
  | { data: T; error: null }
  | { data: null; error: string; status?: number };

/**
 * Live GET /v1/team/fields — Authorization: Basic {SISU_API_KEY} (raw key, not base64).
 */
export async function fetchLiveSisuTeamFields(): Promise<
  SisuLiveResult<SISUTeamFieldsResponse>
> {
  if (!isSisuApiEnabled()) {
    return { data: null, error: "SISU_API_KEY is not configured.", status: 503 };
  }

  const apiKey = process.env.SISU_API_KEY!.trim();
  const url = `${getSisuBaseUrl()}/v1/team/fields`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json()) as SISUTeamFieldsResponse & {
      status_code?: unknown;
      status?: unknown;
      message?: unknown;
    };

    if (!response.ok) {
      return {
        data: null,
        error:
          typeof payload.message === "string"
            ? payload.message
            : `SISU team fields request failed (HTTP ${response.status}).`,
        status: response.status,
      };
    }

    const sisuStatus = normalizeSisuStatusCode(payload.status_code);
    if (sisuStatus !== null && sisuStatus < 0) {
      return {
        data: null,
        error:
          typeof payload.status === "string"
            ? payload.status
            : "SISU team fields returned an error status.",
        status: 502,
      };
    }

    if (!payload.fields || typeof payload.fields !== "object") {
      return {
        data: null,
        error: "SISU team fields response missing fields.",
        status: 502,
      };
    }

    return { data: payload, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to reach SISU team fields.",
      status: 502,
    };
  }
}

function getOptionLabel(value: unknown, fallback: string): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (typeof value === "object" && value !== null) {
    for (const key of ["name", "label", "value", "text"]) {
      if (!(key in value)) continue;
      const candidate = value[key as keyof typeof value];
      if (typeof candidate === "string" || typeof candidate === "number") {
        return String(candidate).trim();
      }
    }
  }

  return fallback;
}

function isEnabledOption(value: unknown): boolean {
  if (typeof value !== "object" || value === null || !("is_enabled" in value)) {
    return true;
  }

  const enabled = value.is_enabled;
  if (typeof enabled === "boolean") {
    return enabled;
  }
  if (typeof enabled === "string") {
    return ["y", "yes", "true", "1"].includes(enabled.trim().toLowerCase());
  }

  return Boolean(enabled);
}

function transformFieldOptions(options: unknown): SISUDropdownOption[] | null {
  if (!options) return null;

  if (typeof options === "object" && !Array.isArray(options)) {
    return Object.entries(options)
      .filter(([, option]) => isEnabledOption(option))
      .map(([value, label]) => ({
        key: value,
        value,
        label: getOptionLabel(label, value),
      }));
  }

  if (Array.isArray(options)) {
    const mapped: SISUDropdownOption[] = [];
    for (const [index, item] of options.entries()) {
      if (typeof item === "string") {
        mapped.push({ key: String(index), value: item, label: item });
        continue;
      }
      if (typeof item === "object" && item !== null) {
        const fallbackValue = String(index);
        const value = "value" in item ? item.value : fallbackValue;
        mapped.push({
          key: "key" in item ? String(item.key) : fallbackValue,
          value: String(value),
          label: getOptionLabel(
            "label" in item ? item.label : item,
            String(value),
          ),
        });
      }
    }
    return mapped;
  }

  return null;
}

function hasMetadataShape(field: object) {
  return (
    "name" in field ||
    "label" in field ||
    "type" in field ||
    "field_name" in field ||
    "field_label" in field ||
    "field_type" in field ||
    "custom" in field ||
    "is_custom" in field ||
    "isCustom" in field ||
    "required" in field ||
    "optional" in field
  );
}

function getCustomValue(field: SISUTeamField) {
  const candidate: unknown =
    field.custom ?? field.is_custom ?? field.isCustom ?? false;

  if (typeof candidate === "boolean") {
    return candidate;
  }

  if (typeof candidate === "string") {
    return candidate.toLowerCase() === "true";
  }

  return Boolean(candidate);
}

function normalizeTeamField(
  fieldName: string,
  field: SISUTeamField | Record<string, string>,
): SISUTeamFieldCatalogEntry {
  const isMetadataField =
    typeof field === "object" && field !== null && hasMetadataShape(field);

  const teamField = isMetadataField ? (field as SISUTeamField) : null;
  const rawOptions =
    teamField?.options ??
    (!isMetadataField && typeof field === "object" && field !== null
      ? field
      : null);

  return {
    name: teamField?.name ?? teamField?.field_name ?? fieldName,
    label: teamField?.field_label ?? teamField?.label ?? fieldName,
    type: teamField?.field_type ?? teamField?.type ?? (rawOptions ? "select" : null),
    custom: teamField ? getCustomValue(teamField) : false,
    options: transformFieldOptions(rawOptions) ?? [],
  };
}

export function normalizeSisuTeamFieldCatalog(
  rawFields: Record<string, SISUTeamField | Record<string, string>>,
): SISUTeamFieldsCatalogResponse["fields"] {
  return Object.fromEntries(
    Object.entries(rawFields).map(([fieldName, field]) => [
      fieldName,
      normalizeTeamField(fieldName, field),
    ]),
  );
}

async function sisuRequest<T>(
  method: "GET" | "POST" | "PUT",
  path: string,
  body?: unknown,
): Promise<SisuLiveResult<T>> {
  if (!isSisuApiEnabled()) {
    return { data: null, error: "SISU_API_KEY is not configured.", status: 503 };
  }

  const apiKey = process.env.SISU_API_KEY!.trim();
  const url = `${getSisuBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      cache: "no-store",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const payload = (await response.json().catch(() => ({}))) as T & {
      status_code?: unknown;
      status?: unknown;
      message?: unknown;
    };

    if (!response.ok) {
      return {
        data: null,
        error:
          typeof payload.message === "string"
            ? payload.message
            : `SISU ${method} ${path} failed (HTTP ${response.status}).`,
        status: response.status,
      };
    }

    const sisuStatus = normalizeSisuStatusCode(payload.status_code);
    if (sisuStatus !== null && sisuStatus < 0) {
      return {
        data: null,
        error:
          typeof payload.status === "string"
            ? payload.status
            : typeof payload.message === "string"
              ? payload.message
              : "SISU returned an error status.",
        status: 502,
      };
    }

    return { data: payload as T, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : `Unable to reach SISU (${method} ${path}).`,
      status: 502,
    };
  }
}

/**
 * Create or update a SISU transaction via POST/PUT /v1/client/edit-client.
 * When `transactionId` is provided, uses PUT to update.
 */
export async function createOrUpdateLiveSisuTransaction(
  payload: SISUCreateTransactionRequest,
  transactionId?: number,
): Promise<SisuLiveResult<SISUCreateTransactionResponse>> {
  if (transactionId !== undefined && Number.isInteger(transactionId) && transactionId > 0) {
    return sisuRequest<SISUCreateTransactionResponse>(
      "PUT",
      `/v1/client/edit-client/${transactionId}`,
      payload,
    );
  }

  return sisuRequest<SISUCreateTransactionResponse>(
    "POST",
    "/v1/client/edit-client",
    payload,
  );
}

export function pickSisuAgentIdFromFindResponse(
  payload: SISUFindAgentResponse | null | undefined,
  email: string,
): number | undefined {
  const agents = payload?.agents;
  if (!agents || agents.length === 0) {
    return undefined;
  }

  const target = email.trim().toLowerCase();
  const exactMatch = agents.find((agent) => {
    const agentEmail = agent.email?.toLowerCase() || "";
    const archivedEmail = agent.archived_email?.toLowerCase() || "";
    return agentEmail === target || archivedEmail === target;
  });

  const bestAgent = exactMatch || agents[0];
  const agentId = bestAgent?.agent_id;
  return typeof agentId === "number" && Number.isFinite(agentId)
    ? agentId
    : undefined;
}

/**
 * Live POST /v1/agent/find-agent — body: { email }.
 */
export async function findLiveSisuAgentByEmail(
  email: string,
): Promise<SisuLiveResult<SISUFindAgentResponse>> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { data: null, error: "Agent email is required.", status: 400 };
  }

  const body = { email: trimmed } satisfies SISUFindAgentRequest;
  return sisuRequest<SISUFindAgentResponse>("POST", "/v1/agent/find-agent", body);
}

/**
 * Resolve best SISU agent_id for an email (exact / archived match, else first).
 */
export async function resolveLiveSisuAgentIdByEmail(
  email: string,
): Promise<SisuLiveResult<number>> {
  const result = await findLiveSisuAgentByEmail(email);
  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ?? "Failed to find SISU agent.",
      status: result.status,
    };
  }

  const agentId = pickSisuAgentIdFromFindResponse(result.data, email);
  if (agentId === undefined) {
    return {
      data: null,
      error: `No SISU agent found for email: ${email.trim()}`,
      status: 404,
    };
  }

  return { data: agentId, error: null };
}
