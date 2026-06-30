import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";

export async function GET() {
  const fixture = loadFixture<{ fields: Record<string, unknown> }>("sisu-team-fields.json");
  return NextResponse.json(fixture);
}
