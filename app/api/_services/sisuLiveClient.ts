import type {
  SISUDropdownOption,
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
    return options
      .map((item, index) => {
        if (typeof item === "string") {
          return { key: String(index), value: item, label: item };
        }
        if (typeof item === "object" && item !== null) {
          const fallbackValue = String(index);
          const value = "value" in item ? item.value : fallbackValue;
          return {
            key: "key" in item ? String(item.key) : fallbackValue,
            value: String(value),
            label: getOptionLabel(
              "label" in item ? item.label : item,
              String(value),
            ),
          };
        }
        return null;
      })
      .filter((item): item is SISUDropdownOption => item !== null);
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
