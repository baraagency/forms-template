import { NextResponse } from "next/server";
import { getGmailStatusForCurrentEnvironment } from "@/app/api/_services/gmailOAuthService";

export async function GET() {
  const result = await getGmailStatusForCurrentEnvironment();

  if (result.error || !result.data) {
    return NextResponse.json(
      { message: result.error ?? "Failed to load Gmail status." },
      { status: 500 },
    );
  }

  return NextResponse.json(result.data);
}
