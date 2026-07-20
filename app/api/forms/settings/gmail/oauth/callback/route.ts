import { redirect } from "react-router";
import {
  exchangeGmailOAuthCode,
  getAppBaseUrl,
} from "@/app/api/_services/gmailOAuthService";

function clearOAuthCookieHeader() {
  return "gmail_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

function settingsRedirectUrl(params: Record<string, string>) {
  const url = new URL("/forms/settings", getAppBaseUrl());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function settingsRedirect(params: Record<string, string>) {
  return redirect(settingsRedirectUrl(params), {
    headers: { "Set-Cookie": clearOAuthCookieHeader() },
  });
}

export async function loader({ request }: { request: Request }) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  const cookieHeader = request.headers.get("cookie") ?? "";
  const expectedState = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("gmail_oauth_state="))
    ?.slice("gmail_oauth_state=".length);

  if (error) {
    return settingsRedirect({
      gmail: "error",
      message: error,
    });
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return settingsRedirect({
      gmail: "error",
      message: "Invalid OAuth state. Try connecting again.",
    });
  }

  try {
    const result = await exchangeGmailOAuthCode(code);
    if (result.error) {
      return settingsRedirect({
        gmail: "error",
        message: result.error,
      });
    }

    return settingsRedirect({ gmail: "connected" });
  } catch (exchangeError) {
    return settingsRedirect({
      gmail: "error",
      message:
        exchangeError instanceof Error
          ? exchangeError.message
          : "Gmail OAuth exchange failed.",
    });
  }
}
