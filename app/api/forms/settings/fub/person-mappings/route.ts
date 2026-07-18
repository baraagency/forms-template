import { NextResponse } from "next/server";
import { listPersonMappings } from "@/app/api/_services/settingsQueries";
import { parseFormKindParam } from "@/app/forms/_core/formIdentity";

export async function GET(request: Request) {
  const form = parseFormKindParam(new URL(request.url).searchParams.get("form"));
  if (!form) {
    return NextResponse.json(
      { message: "Query form is required (FormKind or slug)." },
      { status: 400 },
    );
  }

  const result = await listPersonMappings(form);
  if (result.error || !result.data) {
    return NextResponse.json(
      { message: result.error ?? "Failed to list person mappings." },
      { status: 500 },
    );
  }

  return NextResponse.json({ form, mappings: result.data });
}
