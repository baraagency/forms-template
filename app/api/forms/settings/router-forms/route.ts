import { NextResponse } from "next/server";
import { listRouterForms } from "@/app/api/_services/routerFormsRepo";

export async function GET() {
  const result = await listRouterForms();

  if (result.error || !result.data) {
    return NextResponse.json(
      { message: result.error ?? "Failed to load router forms." },
      { status: 500 },
    );
  }

  return NextResponse.json({ forms: result.data });
}
