import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { FUBDeal } from "@/app/types/fub";

function parsePositiveInteger(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const personId = parsePositiveInteger(url.searchParams.get("personId"));

  if (!personId) {
    return NextResponse.json({ message: "A valid personId is required." }, { status: 400 });
  }

  const fixture = loadFixture<{ deals: FUBDeal[] }>("fub-deals.json");
  return NextResponse.json({ deals: fixture.deals });
}
