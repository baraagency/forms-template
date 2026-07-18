import { NextResponse } from "next/server";
import { updateSisuMapping } from "@/app/api/_services/settingsQueries";

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

  const patch: {
    sisu_field_name?: string | null;
    sisu_field_type?: string | null;
    custom?: boolean;
    enabled?: boolean;
  } = {};

  if ("sisu_field_name" in body) {
    const value = (body as { sisu_field_name?: unknown }).sisu_field_name;
    patch.sisu_field_name =
      typeof value === "string" ? value.trim() || null : null;
  }
  if ("sisu_field_type" in body) {
    const value = (body as { sisu_field_type?: unknown }).sisu_field_type;
    patch.sisu_field_type =
      typeof value === "string" ? value.trim() || null : null;
  }
  if ("custom" in body) {
    if (typeof (body as { custom?: unknown }).custom !== "boolean") {
      return NextResponse.json(
        { message: "custom must be a boolean." },
        { status: 400 },
      );
    }
    patch.custom = (body as { custom: boolean }).custom;
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

  const result = await updateSisuMapping(id, patch);
  if (result.error || !result.data) {
    const status = result.error === "SISU mapping not found." ? 404 : 500;
    return NextResponse.json(
      { message: result.error ?? "Failed to update SISU mapping." },
      { status },
    );
  }

  return NextResponse.json({ mapping: result.data });
}
