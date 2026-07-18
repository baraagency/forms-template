import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { FUBListPipelinesResponse } from "@/app/types/fub";

export async function GET() {
  const fixture = loadFixture<FUBListPipelinesResponse>("fub-pipelines.json");
  return NextResponse.json(fixture);
}
