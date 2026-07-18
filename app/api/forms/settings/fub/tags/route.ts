import { NextResponse } from "next/server";
import { createFubTag, listFubTags } from "@/app/api/_services/settingsQueries";
import { parseFormKindParam } from "@/app/forms/_core/formIdentity";

export async function GET(request: Request) {
  const form = parseFormKindParam(new URL(request.url).searchParams.get("form"));
  if (!form) {
    return NextResponse.json(
      { message: "Query form is required (FormKind or slug)." },
      { status: 400 },
    );
  }

  const result = await listFubTags(form);
  if (result.error || !result.data) {
    return NextResponse.json(
      { message: result.error ?? "Failed to list FUB tags." },
      { status: 500 },
    );
  }

  return NextResponse.json({ form, tags: result.data });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const form = parseFormKindParam(
    typeof (body as { form?: unknown }).form === "string"
      ? (body as { form: string }).form
      : null,
  );
  const tag =
    typeof (body as { tag?: unknown }).tag === "string"
      ? (body as { tag: string }).tag.trim()
      : "";

  if (!form) {
    return NextResponse.json({ message: "form is required." }, { status: 400 });
  }
  if (!tag) {
    return NextResponse.json({ message: "tag is required." }, { status: 400 });
  }

  const result = await createFubTag({ form, tag });
  if (result.error || !result.data) {
    return NextResponse.json(
      { message: result.error ?? "Failed to create FUB tag." },
      { status: 500 },
    );
  }

  return NextResponse.json({ tag: result.data }, { status: 201 });
}
