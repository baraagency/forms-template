import { SUBMISSION_SUMMARY_EMAIL_FAILURE_MESSAGE } from "./submissionConstants";

export type SubmissionFormType =
  | "pending"
  | "appointment-set"
  | "appointment-met"
  | "closed";

export { SUBMISSION_SUMMARY_EMAIL_FAILURE_MESSAGE };

/** Heroku router terminates requests after 30 seconds (H12). */
export const HEROKU_REQUEST_TIMEOUT_MS = 30_000;

/** Reserve a small buffer before the router's 30-second cutoff. */
export const HEROKU_REQUEST_BUDGET_MS = 29_500;

/** Max time for post-workflow email within the Heroku budget. */
export const POST_SUBMISSION_SIDE_EFFECT_TIMEOUT_MS = HEROKU_REQUEST_BUDGET_MS;

export const FORM_SUBMIT_REQUEST_TIMEOUT_MS = HEROKU_REQUEST_TIMEOUT_MS;

export const FORM_SUBMIT_CLIENT_TIMEOUT_MESSAGE =
  "The submission request timed out after 30 seconds before the server could confirm completion. Please verify Follow Up Boss and SISU before submitting again.";

export const FORM_SUBMIT_GATEWAY_TIMEOUT_MESSAGE =
  "The submission request timed out on the server before a confirmation could be returned. Please verify Follow Up Boss and SISU before submitting again.";

export const FORM_SUBMIT_SIDE_EFFECT_TIMEOUT_MESSAGE =
  "The submission finished, but summary email could not be confirmed before the request deadline. Please verify Follow Up Boss for the latest client updates.";

export function isFormSubmitClientTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

export function isFormSubmitGatewayTimeoutStatus(status: number): boolean {
  return status === 408 || status === 503 || status === 504;
}

export async function parseSubmitFormResponsePayload(
  response: Response,
): Promise<unknown> {
  return response.json().catch(() => ({}));
}

export function getSubmissionTimeoutWarning(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const timeoutWarning = (payload as { timeoutWarning?: unknown }).timeoutWarning;
  return typeof timeoutWarning === "string" && timeoutWarning.trim()
    ? timeoutWarning.trim()
    : null;
}

export function getFormSubmitFailureMessage(
  response: Response,
  payload: unknown,
  fallbackMessage: string,
): string {
  if (isFormSubmitGatewayTimeoutStatus(response.status)) {
    return FORM_SUBMIT_GATEWAY_TIMEOUT_MESSAGE;
  }

  return getSubmissionErrorMessage(payload, fallbackMessage);
}

export async function submitFormRequest(
  url: string,
  body: unknown,
  timeoutMs: number = FORM_SUBMIT_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

type SubmissionSummaryEmailPayload = {
  sent?: boolean;
  message?: string;
};

export type SubmissionRouteParams = {
  formType: SubmissionFormType;
  personId?: string;
  agentId?: string;
  dealId?: string;
  dealName?: string;
  clientName?: string;
  agentName?: string;
  address?: string;
  sisuTransactionId?: string;
  debugKey?: string;
  emailWarning?: string;
  timeoutWarning?: string;
};

export type SubmittedDebugRecord = {
  formType: SubmissionFormType;
  storedAt: string;
  deal?: unknown;
  transaction?: unknown;
};

type SubmittedDebugPayload = {
  deal?: unknown;
  transaction?: unknown;
};

const submissionDebugStoragePrefix = "jcre:forms:submission-debug:";
const submissionDebugEnvironments = new Set(["LOCAL", "STAGING"]);

export const submissionFormLabels: Record<SubmissionFormType, string> = {
  pending: "Pending",
  "appointment-set": "Appointment Set",
  "appointment-met": "Appointment Met",
  closed: "Closed",
};

export const submissionFormPaths: Record<SubmissionFormType, string> = {
  pending: "/forms/pending",
  "appointment-set": "/forms/appointment-set",
  "appointment-met": "/forms/appointment-met",
  closed: "/forms/closed",
};

function appendOptionalParam(params: URLSearchParams, key: string, value?: string) {
  const trimmedValue = value?.trim();
  if (trimmedValue) {
    params.set(key, trimmedValue);
  }
}

function appendOptionalDealIdParam(params: URLSearchParams, value?: string) {
  const trimmedValue = value?.trim();
  const parsed = Number(trimmedValue);
  if (Number.isInteger(parsed) && parsed > 0) {
    params.set("dealId", trimmedValue!);
  }
}

export function buildPostSubmissionHref({
  formType,
  personId,
  agentId,
  dealId,
  dealName,
  clientName,
  agentName,
  address,
  sisuTransactionId,
  debugKey,
  emailWarning,
  timeoutWarning,
}: SubmissionRouteParams): string {
  const params = new URLSearchParams({ form: formType });
  appendOptionalParam(params, "personId", personId);
  appendOptionalParam(params, "agentId", agentId);
  appendOptionalDealIdParam(params, dealId);
  appendOptionalParam(params, "dealName", dealName);
  appendOptionalParam(params, "clientName", clientName);
  appendOptionalParam(params, "agentName", agentName);
  appendOptionalParam(params, "address", address);
  appendOptionalParam(params, "sisuTransactionId", sisuTransactionId);
  appendOptionalParam(params, "debugKey", debugKey);
  appendOptionalParam(params, "emailWarning", emailWarning);
  appendOptionalParam(params, "timeoutWarning", timeoutWarning);

  return `/forms/submitted?${params.toString()}`;
}

export function buildSubmittedAddress(
  ...parts: Array<string | undefined>
): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export function getSubmittedSisuTransactionId(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    return "";
  }

  const transaction = (payload as { transaction?: unknown }).transaction;
  if (typeof transaction !== "object" || transaction === null) {
    return "";
  }

  for (const key of ["client_id", "transaction_id", "id"]) {
    const value = (transaction as Record<string, unknown>)[key];
    if (typeof value === "string" || typeof value === "number") {
      const stringValue = String(value).trim();
      if (stringValue) {
        return stringValue;
      }
    }
  }

  return "";
}

export function getSubmittedFubDealId(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    return "";
  }

  const dealId = (payload as { dealId?: unknown }).dealId;
  if (typeof dealId === "string" || typeof dealId === "number") {
    const stringValue = String(dealId).trim();
    if (stringValue) {
      return stringValue;
    }
  }

  const deal = (payload as { deal?: unknown }).deal;
  if (typeof deal !== "object" || deal === null) {
    return "";
  }

  const value = (deal as Record<string, unknown>).id;
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  const stringValue = String(value).trim();
  return stringValue ? stringValue : "";
}

export function getSubmittedFubDealName(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    return "";
  }

  const dealName = (payload as { dealName?: unknown }).dealName;
  if (typeof dealName === "string" && dealName.trim()) {
    return dealName.trim();
  }

  const deal = (payload as { deal?: unknown }).deal;
  if (typeof deal !== "object" || deal === null) {
    return "";
  }

  const name = (deal as Record<string, unknown>).name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return "";
}

export function isSubmissionDebugEnvironment(environment: string | undefined): boolean {
  return submissionDebugEnvironments.has(environment?.trim().toUpperCase() ?? "");
}

function getSubmittedDebugPayload(payload: unknown): SubmittedDebugPayload | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const debugPayload = (payload as { debug?: unknown }).debug;
  if (typeof debugPayload !== "object" || debugPayload === null) {
    return null;
  }

  const recordPayload = debugPayload as SubmittedDebugPayload;
  return recordPayload.deal === undefined && recordPayload.transaction === undefined
    ? null
    : recordPayload;
}

export function storeSubmittedDebugRecord(
  formType: SubmissionFormType,
  payload: unknown,
): string {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return "";
  }
  const recordPayload = getSubmittedDebugPayload(payload);
  if (!recordPayload) {
    return "";
  }

  const randomKey =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const debugKey = `${formType}-${randomKey}`;
  const record: SubmittedDebugRecord = {
    formType,
    storedAt: new Date().toISOString(),
    deal: recordPayload.deal,
    transaction: recordPayload.transaction,
  };

  try {
    window.sessionStorage.setItem(
      `${submissionDebugStoragePrefix}${debugKey}`,
      JSON.stringify(record),
    );
  } catch {
    return "";
  }

  return debugKey;
}

export function readSubmittedDebugRecord(
  debugKey: string,
): SubmittedDebugRecord | null {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return null;
  }

  const trimmedDebugKey = debugKey.trim();
  if (!trimmedDebugKey) {
    return null;
  }

  const storedValue = window.sessionStorage.getItem(
    `${submissionDebugStoragePrefix}${trimmedDebugKey}`,
  );
  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as SubmittedDebugRecord;
    return typeof parsedValue === "object" && parsedValue !== null ? parsedValue : null;
  } catch {
    return null;
  }
}

export function buildSubmittedFormHref({
  formType,
  personId,
  agentId,
  dealId,
  clientName,
}: SubmissionRouteParams): string {
  const params = new URLSearchParams();
  appendOptionalParam(params, "personId", personId);
  appendOptionalParam(params, "agentId", agentId);
  appendOptionalDealIdParam(params, dealId);
  appendOptionalParam(params, "clientName", clientName);

  const query = params.toString();
  return `${submissionFormPaths[formType]}${query ? `?${query}` : ""}`;
}

export function buildSubmittedRouterHref({
  personId,
}: Pick<SubmissionRouteParams, "personId">): string {
  const params = new URLSearchParams();
  appendOptionalParam(params, "clientId", personId);

  const query = params.toString();
  return query ? `/forms?${query}` : "/forms";
}

function getSubmissionSummaryEmailPayload(payload: unknown): SubmissionSummaryEmailPayload | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const email = (payload as { email?: unknown }).email;
  if (typeof email !== "object" || email === null) {
    return null;
  }

  return email as SubmissionSummaryEmailPayload;
}

export function getSubmissionSummaryEmailWarning(payload: unknown): string | null {
  const email = getSubmissionSummaryEmailPayload(payload);
  if (!email || email.sent !== false) {
    return null;
  }

  const message = typeof email.message === "string" ? email.message.trim() : "";
  return message || SUBMISSION_SUMMARY_EMAIL_FAILURE_MESSAGE;
}

export function getSubmissionErrorMessage(
  payload: unknown,
  fallbackMessage: string,
): string {
  if (typeof payload !== "object" || payload === null) {
    return fallbackMessage;
  }

  const responsePayload = payload as {
    error?: unknown;
    errors?: unknown;
    message?: unknown;
    step?: unknown;
  };

  const formattedErrors = formatValidationErrors(responsePayload.errors);

  if (typeof responsePayload.error === "string" && responsePayload.error.trim()) {
    return responsePayload.error;
  }

  if (typeof responsePayload.message === "string" && responsePayload.message.trim()) {
    const message = responsePayload.message.trim().replace(/[.:;]\s*$/, "");
    return formattedErrors
      ? `${message}: ${formattedErrors}`
      : responsePayload.message;
  }

  const emailWarning = getSubmissionSummaryEmailWarning(payload);
  if (emailWarning) {
    return emailWarning;
  }

  return fallbackMessage;
}

function formatFieldLabel(fieldName: string): string {
  return fieldName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValidationErrors(errors: unknown): string {
  if (typeof errors !== "object" || errors === null || Array.isArray(errors)) {
    return "";
  }

  return Object.entries(errors as Record<string, unknown>)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([fieldName, value]) => `${formatFieldLabel(fieldName)}: ${value}`)
    .join("; ");
}
