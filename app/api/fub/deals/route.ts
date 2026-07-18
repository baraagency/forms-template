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
  const fields = url.searchParams.get("fields") ?? "";
  const wantsAllFields = fields
    .split(",")
    .map((part) => part.trim())
    .includes("allFields");
  const limit = parsePositiveInteger(url.searchParams.get("limit"));

  if (wantsAllFields) {
    const deal = loadFixture<FUBDeal>("fub-deal-all-fields.json");
    return NextResponse.json({
      deals: [deal],
      _metadata: { total: 1, limit: limit ?? "1" },
    });
  }

  if (!personId) {
    return NextResponse.json(
      { message: "A valid personId is required." },
      { status: 400 },
    );
  }

  const fixture = loadFixture<{ deals: FUBDeal[] }>("fub-deals.json");
  return NextResponse.json({ deals: fixture.deals });
}
