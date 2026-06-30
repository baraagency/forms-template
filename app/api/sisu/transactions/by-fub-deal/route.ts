import { NextResponse } from "next/server";
import { MOCK_DEAL_ID } from "@/app/api/_fixtures/constants";
import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { SISUTransaction } from "@/app/types/sisu";

function parseDealId(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dealId = parseDealId(url.searchParams.get("dealId"));

  if (!dealId) {
    return NextResponse.json({ message: "A valid dealId is required." }, { status: 400 });
  }

  if (dealId !== String(MOCK_DEAL_ID)) {
    return NextResponse.json(
      { message: "No SISU transaction found for the selected FUB deal." },
      { status: 404 },
    );
  }

  const fixture = loadFixture<{ transaction: SISUTransaction }>("sisu-transaction-789.json");
  return NextResponse.json(fixture);
}
