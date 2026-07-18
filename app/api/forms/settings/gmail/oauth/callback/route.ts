import { NextResponse } from "next/server";
import {
  exchangeGmailOAuthCode,
  getAppBaseUrl,
} from "@/app/api/_services/gmailOAuthService";

function settingsRedirect(params: Record<string, string>) {
  const url = new URL("/forms/settings", getAppBaseUrl());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
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
    const response = settingsRedirect({
      gmail: "error",
      message: error,
    });
    response.cookies.delete("gmail_oauth_state");
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = settingsRedirect({
      gmail: "error",
      message: "Invalid OAuth state. Try connecting again.",
    });
    response.cookies.delete("gmail_oauth_state");
    return response;
  }

  try {
    const result = await exchangeGmailOAuthCode(code);
    if (result.error) {
      const response = settingsRedirect({
        gmail: "error",
        message: result.error,
      });
      response.cookies.delete("gmail_oauth_state");
      return response;
    }

    const response = settingsRedirect({ gmail: "connected" });
    response.cookies.delete("gmail_oauth_state");
    return response;
  } catch (exchangeError) {
    const response = settingsRedirect({
      gmail: "error",
      message:
        exchangeError instanceof Error
          ? exchangeError.message
          : "Gmail OAuth exchange failed.",
    });
    response.cookies.delete("gmail_oauth_state");
    return response;
  }
}
