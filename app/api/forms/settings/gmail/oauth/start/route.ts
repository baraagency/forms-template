import { NextResponse } from "next/server";
import {
  buildGmailOAuthStartUrl,
  isGmailOAuthConfigured,
} from "@/app/api/_services/gmailOAuthService";

export async function GET() {
  if (!isGmailOAuthConfigured()) {
    return NextResponse.json(
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
    return NextResponse.json(
      { message: "Could not build Google OAuth URL." },
      { status: 500 },
    );
  }

  const response = NextResponse.redirect(url);
  response.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
