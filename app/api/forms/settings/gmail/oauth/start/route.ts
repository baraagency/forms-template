import { redirect } from "react-router";
import {
  buildGmailOAuthStartUrl,
  isGmailOAuthConfigured,
} from "@/app/api/_services/gmailOAuthService";

function setOAuthCookieHeader(state: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `gmail_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}

export async function loader() {
  if (!isGmailOAuthConfigured()) {
    return Response.json(
      {
        message:
          "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      },
      { status: 503 },
    );
  }

  const state = crypto.randomUUID();
  const url = buildGmailOAuthStartUrl(state);

  if (!url) {
    return Response.json(
      { message: "Could not build Google OAuth URL." },
      { status: 500 },
    );
  }

  return redirect(url, {
    headers: { "Set-Cookie": setOAuthCookieHeader(state) },
  });
}
