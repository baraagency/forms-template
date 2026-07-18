import { NextResponse } from "next/server";
import { updatePersonMapping } from "@/app/api/_services/settingsQueries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "Invalid mapping id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const patch: { fub_field_name?: string | null; enabled?: boolean } = {};

  if ("fub_field_name" in body) {
    const value = (body as { fub_field_name?: unknown }).fub_field_name;
    patch.fub_field_name =
      typeof value === "string" ? value.trim() || null : null;
  }
  if ("enabled" in body) {
    if (typeof (body as { enabled?: unknown }).enabled !== "boolean") {
      return NextResponse.json(
        { message: "enabled must be a boolean." },
        { status: 400 },
      );
    }
    patch.enabled = (body as { enabled: boolean }).enabled;
  }

  const result = await updatePersonMapping(id, patch);
  if (result.error || !result.data) {
    const status = result.error === "Mapping not found." ? 404 : 500;
    return NextResponse.json(
      { message: result.error ?? "Failed to update person mapping." },
      { status },
    );
  }

  return NextResponse.json({ mapping: result.data });
}
