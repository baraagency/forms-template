import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { FUBListStagesResponse } from "@/app/types/fub";

export async function GET() {
  const fixture = loadFixture<FUBListStagesResponse>("fub-stages.json");
  return NextResponse.json(fixture);
}
