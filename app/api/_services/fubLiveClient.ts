import type { FUBListPeopleResponse, FUBPerson } from "@/app/types/fub";
import { isFubApiEnabled } from "./fubApiMode";

export type FubLiveResult<T> =
  | { data: T; error: null }
  | { data: null; error: string; status?: number };

function getFubBaseUrl(): string {
  return (
    process.env.FUB_API_URL ||
    process.env.NEXT_PUBLIC_FUB_API_URL ||
    "https://api.followupboss.com/v1"
  ).replace(/\/$/, "");
}

function buildFubHeaders(): HeadersInit {
  const apiKey = process.env.FUB_API_KEY?.trim() ?? "";
  const system =
    process.env.FUB_X_SYSTEM?.trim() ||
    process.env.FUB_SYSTEM?.trim() ||
    "";
  const systemKey =
    process.env.FUB_X_SYSTEM_KEY?.trim() ||
    process.env.FUB_SYSTEM_KEY?.trim() ||
    "";

  return {
    accept: "application/json",
    "content-type": "application/json",
    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    "X-System": system,
    "X-System-Key": systemKey,
  };
}

/**
 * Live GET /people — Authorization: Basic base64("{FUB_API_KEY}:") + X-System headers.
 */
export async function fetchLiveFubPeople(query: {
  fields?: string;
  limit?: number;
  assignedUserId?: number;
}): Promise<FubLiveResult<FUBListPeopleResponse>> {
  if (!isFubApiEnabled()) {
    return { data: null, error: "FUB_API_KEY is not configured.", status: 503 };
  }

  const params = new URLSearchParams();
  if (query.fields) {
    params.set("fields", query.fields);
  }
  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }
  if (query.assignedUserId !== undefined) {
    params.set("assignedUserId", String(query.assignedUserId));
  }

  const url = `${getFubBaseUrl()}/people?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: buildFubHeaders(),
      cache: "no-store",
    });

    const payload = (await response.json()) as FUBListPeopleResponse & {
      message?: string;
      people?: FUBPerson[];
    };

    if (!response.ok) {
      return {
        data: null,
        error:
          typeof payload.message === "string"
            ? payload.message
            : `FUB people request failed (HTTP ${response.status}).`,
        status: response.status,
      };
    }

    const people = Array.isArray(payload.people) ? payload.people : [];
    return {
      data: {
        people,
        _metadata: payload._metadata ?? { total: people.length },
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to reach Follow Up Boss people.",
      status: 502,
    };
  }
}
