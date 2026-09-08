import type {
  FUBAppointment,
  FUBAppointmentInput,
  FUBAppointmentOutcome,
  FUBAppointmentType,
  FUBDeal,
  FUBListDealsResponse,
  FUBListPeopleResponse,
  FUBListUsersResponse,
  FUBNote,
  FUBPerson,
  FUBUser,
} from "@/app/types/fub";
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

async function fubRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  body?: unknown,
  notConfiguredMessage = "FUB_API_KEY is not configured.",
): Promise<FubLiveResult<T>> {
  if (!isFubApiEnabled()) {
    return { data: null, error: notConfiguredMessage, status: 503 };
  }

  const url = `${getFubBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      method,
      headers: buildFubHeaders(),
      cache: "no-store",
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    });

    const payload = (await response.json().catch(() => ({}))) as T & {
      message?: string;
      errorMessage?: string;
    };

    if (!response.ok) {
      return {
        data: null,
        error:
          typeof payload.message === "string"
            ? payload.message
            : typeof payload.errorMessage === "string"
              ? payload.errorMessage
              : `FUB ${method} ${path} failed (HTTP ${response.status}).`,
        status: response.status,
      };
    }

    return { data: payload as T, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : `Unable to reach Follow Up Boss (${method} ${path}).`,
      status: 502,
    };
  }
}

function unwrapDeal(payload: FUBDeal | { deal?: FUBDeal }): FUBDeal {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "deal" in payload &&
    typeof (payload as { deal?: unknown }).deal === "object" &&
    (payload as { deal?: unknown }).deal !== null
  ) {
    return (payload as { deal: FUBDeal }).deal;
  }
  return payload as FUBDeal;
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

  const result = await fubRequest<FUBListPeopleResponse>(
    "GET",
    `/people?${params.toString()}`,
  );

  if (result.error || !result.data) {
    return result;
  }

  const people = Array.isArray(result.data.people) ? result.data.people : [];
  return {
    data: {
      people,
      _metadata: result.data._metadata ?? { total: people.length },
    },
    error: null,
  };
}

/**
 * Live GET /users — list agents/users for form selects.
 */
export async function fetchLiveFubUsers(query?: {
  limit?: number;
  offset?: number;
}): Promise<FubLiveResult<FUBListUsersResponse>> {
  if (!isFubApiEnabled()) {
    return { data: null, error: "FUB_API_KEY is not configured.", status: 503 };
  }

  const params = new URLSearchParams();
  params.set("limit", String(query?.limit ?? 100));
  if (query?.offset !== undefined) {
    params.set("offset", String(query.offset));
  }

  const result = await fubRequest<FUBListUsersResponse>(
    "GET",
    `/users?${params.toString()}`,
  );

  if (result.error || !result.data) {
    return result;
  }

  const users = Array.isArray(result.data.users) ? result.data.users : [];
  return {
    data: {
      users,
      _metadata: result.data._metadata ?? { total: users.length },
    },
    error: null,
  };
}

/**
 * Live GET /users/{id}.
 */
export async function fetchLiveFubUser(
  userId: string,
): Promise<FubLiveResult<FUBUser>> {
  const trimmed = userId.trim();
  if (!trimmed) {
    return { data: null, error: "FUB user id is required.", status: 400 };
  }

  return fubRequest<FUBUser>("GET", `/users/${encodeURIComponent(trimmed)}`);
}

/**
 * Live GET /people/{id}.
 */
export async function fetchLiveFubPerson(
  personId: string,
  fields?: string,
): Promise<FubLiveResult<FUBPerson>> {
  const trimmed = personId.trim();
  if (!trimmed) {
    return { data: null, error: "FUB person id is required.", status: 400 };
  }

  const params = new URLSearchParams();
  if (fields?.trim()) {
    params.set("fields", fields.trim());
  }
  const query = params.toString();
  const path = `/people/${encodeURIComponent(trimmed)}${
    query ? `?${query}` : ""
  }`;

  return fubRequest<FUBPerson>("GET", path);
}

export async function createLiveFubNote(
  noteData: Partial<FUBNote> & { personId: string | number; body: string },
): Promise<FubLiveResult<FUBNote>> {
  return fubRequest<FUBNote>("POST", "/notes", {
    ...noteData,
    personId: Number(noteData.personId),
  });
}

export async function createLiveFubDeal(
  dealData: Partial<FUBDeal>,
): Promise<FubLiveResult<FUBDeal>> {
  const result = await fubRequest<FUBDeal | { deal?: FUBDeal }>(
    "POST",
    "/deals",
    dealData,
  );
  if (result.error || !result.data) {
    return { data: null, error: result.error ?? "FUB create deal failed.", status: result.status };
  }
  return { data: unwrapDeal(result.data), error: null };
}

/**
 * Live GET /deals — optional personId / status / fields / limit filters.
 */
export async function fetchLiveFubDeals(query: {
  personId?: number;
  status?: "Active" | "Archived" | "Deleted";
  fields?: string;
  limit?: number;
  offset?: number;
}): Promise<FubLiveResult<FUBListDealsResponse>> {
  if (!isFubApiEnabled()) {
    return { data: null, error: "FUB_API_KEY is not configured.", status: 503 };
  }

  const params = new URLSearchParams();
  if (query.personId !== undefined) {
    params.set("personId", String(query.personId));
  }
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.fields) {
    params.set("fields", query.fields);
  }
  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }
  if (query.offset !== undefined) {
    params.set("offset", String(query.offset));
  }

  const result = await fubRequest<FUBListDealsResponse>(
    "GET",
    `/deals?${params.toString()}`,
  );

  if (result.error || !result.data) {
    return result;
  }

  const deals = Array.isArray(result.data.deals) ? result.data.deals : [];
  return {
    data: {
      deals,
      _metadata: result.data._metadata ?? { total: deals.length },
    },
    error: null,
  };
}

export async function updateLiveFubDeal(
  dealId: string | number,
  dealData: Partial<FUBDeal>,
): Promise<FubLiveResult<FUBDeal>> {
  const result = await fubRequest<FUBDeal | { deal?: FUBDeal }>(
    "PUT",
    `/deals/${dealId}`,
    dealData,
  );
  if (result.error || !result.data) {
    return { data: null, error: result.error ?? "FUB update deal failed.", status: result.status };
  }
  return { data: unwrapDeal(result.data), error: null };
}

export async function updateLiveFubPerson(
  personId: string | number,
  personData: Partial<FUBPerson>,
): Promise<FubLiveResult<FUBPerson>> {
  return fubRequest<FUBPerson>("PUT", `/people/${personId}`, personData);
}

export async function createLiveFubAppointment(
  appointmentData: FUBAppointmentInput,
): Promise<FubLiveResult<FUBAppointment>> {
  return fubRequest<FUBAppointment>("POST", "/appointments", appointmentData);
}

export async function getLiveFubAppointment(
  appointmentId: string | number,
): Promise<FubLiveResult<FUBAppointment>> {
  return fubRequest<FUBAppointment>("GET", `/appointments/${appointmentId}`);
}

export async function updateLiveFubAppointment(
  appointmentId: string | number,
  appointmentData: Partial<FUBAppointmentInput>,
): Promise<FubLiveResult<FUBAppointment>> {
  return fubRequest<FUBAppointment>(
    "PUT",
    `/appointments/${appointmentId}`,
    appointmentData,
  );
}

/**
 * Update outcome on an existing appointment while preserving start/end
 * (FUB requires start/end on PUT).
 */
export async function updateLiveFubAppointmentOutcome(
  appointmentId: string | number,
  outcomeId: number,
): Promise<FubLiveResult<FUBAppointment>> {
  const existing = await getLiveFubAppointment(appointmentId);
  if (existing.error || !existing.data) {
    return {
      data: null,
      error: existing.error ?? "Follow Up Boss appointment not found.",
      status: existing.status ?? 404,
    };
  }

  const start = existing.data.start;
  const end = existing.data.end;
  if (typeof start !== "string" || typeof end !== "string" || !start || !end) {
    return {
      data: null,
      error:
        "Follow Up Boss appointment is missing required start and end times.",
      status: 400,
    };
  }

  return updateLiveFubAppointment(appointmentId, {
    outcomeId,
    start,
    end,
  });
}

export async function fetchLiveFubAppointmentOutcomes(): Promise<
  FubLiveResult<FUBAppointmentOutcome[]>
> {
  const result = await fubRequest<{
    appointmentoutcomes?: FUBAppointmentOutcome[];
  }>("GET", "/appointmentOutcomes?limit=100&sort=orderWeight");

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ?? "Failed to load FUB appointment outcomes.",
      status: result.status,
    };
  }

  return {
    data: Array.isArray(result.data.appointmentoutcomes)
      ? result.data.appointmentoutcomes
      : [],
    error: null,
  };
}

export async function fetchLiveFubAppointmentTypes(): Promise<
  FubLiveResult<FUBAppointmentType[]>
> {
  const result = await fubRequest<{
    appointmenttypes?: FUBAppointmentType[];
  }>("GET", "/appointmentTypes?limit=100&sort=orderWeight");

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ?? "Failed to load FUB appointment types.",
      status: result.status,
    };
  }

  return {
    data: Array.isArray(result.data.appointmenttypes)
      ? result.data.appointmenttypes
      : [],
    error: null,
  };
}

function collectTagsFromPeople(people: FUBPerson[]): string[] {
  const tags = new Set<string>();
  for (const person of people) {
    for (const tag of person.tags ?? []) {
      const trimmed = typeof tag === "string" ? tag.trim() : "";
      if (trimmed) tags.add(trimmed);
    }
  }
  return [...tags].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
}

/**
 * Discover tag strings from live FUB people records (fields=tags).
 */
export async function fetchLiveFubTags(): Promise<FubLiveResult<{ tags: string[] }>> {
  if (!isFubApiEnabled()) {
    return { data: null, error: "FUB_API_KEY is not configured.", status: 503 };
  }

  const tagSet = new Set<string>();
  const limit = 100;
  const maxPages = 5;

  for (let page = 0; page < maxPages; page += 1) {
    const params = new URLSearchParams({
      fields: "tags",
      limit: String(limit),
      offset: String(page * limit),
    });

    const result = await fubRequest<FUBListPeopleResponse>(
      "GET",
      `/people?${params.toString()}`,
    );

    if (result.error || !result.data) {
      if (page === 0) {
        return {
          data: null,
          error: result.error ?? "Failed to load FUB tags.",
          status: result.status,
        };
      }
      break;
    }

    for (const tag of collectTagsFromPeople(result.data.people ?? [])) {
      tagSet.add(tag);
    }

    const total = result.data._metadata?.total;
    const fetched = (page + 1) * limit;
    const peopleCount = result.data.people?.length ?? 0;
    if (peopleCount < limit) break;
    if (typeof total === "number" && fetched >= total) break;
  }

  return {
    data: {
      tags: [...tagSet].sort((left, right) =>
        left.localeCompare(right, undefined, { sensitivity: "base" }),
      ),
    },
    error: null,
  };
}
