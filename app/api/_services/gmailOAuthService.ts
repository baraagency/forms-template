import { google } from "googleapis";
import { normalizeSettingsEnvironment } from "@/app/forms/_core/formIdentity";
import {
  deactivateGmailCredential,
  getGmailCredentialForEnvironment,
  upsertGmailCredential,
} from "./settingsQueries";

const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "email",
];

export function getAppBaseUrl(): string {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return "http://localhost:5173";
}

export function getGmailOAuthRedirectUri(): string {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }
  return `${getAppBaseUrl()}/api/forms/settings/gmail/oauth/callback`;
}

export function getGmailOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    getGmailOAuthRedirectUri(),
  );
}

export function isGmailOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function buildGmailOAuthStartUrl(state: string): string | null {
  const client = getGmailOAuthClient();
  if (!client) {
    return null;
  }

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: OAUTH_SCOPES,
    state,
  });
}

export async function exchangeGmailOAuthCode(code: string) {
  const client = getGmailOAuthClient();
  if (!client) {
    return { error: "Google OAuth is not configured." as const };
  }

  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    return {
      error:
        "Google did not return a refresh token. Disconnect the app in your Google account and try again." as const,
    };
  }

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email?.trim();

  if (!email) {
    return { error: "Could not read the Google account email." as const };
  }

  const environment = normalizeSettingsEnvironment();
  const saved = await upsertGmailCredential({
    environment,
    email,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token ?? null,
    expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  });

  if (saved.error || !saved.data) {
    return { error: saved.error ?? "Failed to store Gmail credentials." };
  }

  return { data: saved.data, error: null };
}

export async function getGmailStatusForCurrentEnvironment() {
  const environment = normalizeSettingsEnvironment();
  const configured = isGmailOAuthConfigured();
  const credential = await getGmailCredentialForEnvironment(environment);

  if (credential.error) {
    return {
      data: null,
      error: credential.error,
    };
  }

  const row = credential.data;
  const connected = Boolean(row?.active && row.refresh_token);

  return {
    data: {
      environment,
      oauthConfigured: configured,
      connected,
      email: connected ? row?.email ?? null : null,
      updatedAt: connected ? row?.updated_at ?? null : null,
    },
    error: null,
  };
}

export async function disconnectGmailForCurrentEnvironment() {
  const environment = normalizeSettingsEnvironment();
  return deactivateGmailCredential(environment);
}
