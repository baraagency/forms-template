import { NextResponse } from "next/server";
import { deleteFubTag, updateFubTag } from "@/app/api/_services/settingsQueries";

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
    return NextResponse.json({ message: "Invalid tag id." }, { status: 400 });
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

  const patch: { tag?: string; enabled?: boolean } = {};

  if ("tag" in body) {
    const tag =
      typeof (body as { tag?: unknown }).tag === "string"
        ? (body as { tag: string }).tag.trim()
        : "";
    if (!tag) {
      return NextResponse.json({ message: "tag is required." }, { status: 400 });
    }
    patch.tag = tag;
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

  const result = await updateFubTag(id, patch);
  if (result.error || !result.data) {
    const status = result.error === "FUB tag not found." ? 404 : 500;
    return NextResponse.json(
      { message: result.error ?? "Failed to update FUB tag." },
      { status },
    );
  }

  return NextResponse.json({ tag: result.data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "Invalid tag id." }, { status: 400 });
  }

  const result = await deleteFubTag(id);
  if (result.error || !result.data) {
    const status = result.error === "FUB tag not found." ? 404 : 500;
    return NextResponse.json(
      { message: result.error ?? "Failed to delete FUB tag." },
      { status },
    );
  }

  return NextResponse.json({ deleted: true });
}
