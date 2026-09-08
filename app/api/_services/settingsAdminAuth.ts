import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "settings_admin_auth";
const SESSION_SCOPE = "settings-admin-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAdminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value || null;
}

export function isSettingsAdminPasswordConfigured(): boolean {
  return Boolean(getAdminPassword());
}

export function buildSettingsAdminSessionToken(): string | null {
  const password = getAdminPassword();
  if (!password) {
    return null;
  }

  return createHmac("sha256", password).update(SESSION_SCOPE).digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) {
    return false;
  }

  const providedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export function readSettingsAdminSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!entry) {
    return null;
  }

  const value = entry.slice(COOKIE_NAME.length + 1);
  return value || null;
}

export function isSettingsAdminAuthenticated(request: Request): boolean {
  if (!isSettingsAdminPasswordConfigured()) {
    return true;
  }

  const expected = buildSettingsAdminSessionToken();
  const actual = readSettingsAdminSessionToken(request);
  if (!expected || !actual) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export function buildSettingsAdminSessionCookieHeader(): string | null {
  const token = buildSettingsAdminSessionToken();
  if (!token) {
    return null;
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function clearSettingsAdminSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function enforceSettingsAdminAuth(request: Request): Response | null {
  if (!isSettingsAdminPasswordConfigured()) {
    return null;
  }

  if (isSettingsAdminAuthenticated(request)) {
    return null;
  }

  return Response.json(
    { message: "Settings access requires admin authentication." },
    { status: 401 },
  );
}
