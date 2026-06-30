import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";

export async function GET() {
  const fixture = loadFixture<{ vendors: Record<string, unknown> }>("sisu-vendors.json");
  return NextResponse.json(fixture);
}
