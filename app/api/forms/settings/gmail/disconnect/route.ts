import { NextResponse } from "next/server";
import { disconnectGmailForCurrentEnvironment } from "@/app/api/_services/gmailOAuthService";

export async function POST() {
  const result = await disconnectGmailForCurrentEnvironment();

  if (result.error || !result.data) {
    return NextResponse.json(
      { message: result.error ?? "Failed to disconnect Gmail." },
      { status: 500 },
    );
  }

  return NextResponse.json({ disconnected: true });
}
