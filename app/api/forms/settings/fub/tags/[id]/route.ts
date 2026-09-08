import { deleteFubTag, updateFubTag } from "@/app/api/_services/settingsQueries";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";

function parseId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  const id = parseId(params.id);
  if (!id) {
    return Response.json({ message: "Invalid tag id." }, { status: 400 });
  }

  if (request.method === "DELETE") {
    const result = await deleteFubTag(id);
    if (result.error || !result.data) {
      const status = result.error === "FUB tag not found." ? 404 : 500;
      return Response.json(
        { message: result.error ?? "Failed to delete FUB tag." },
        { status },
      );
    }

    return Response.json({ deleted: true });
  }

  if (request.method === "PATCH") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return Response.json({ message: "Invalid body." }, { status: 400 });
    }

    const patch: { tag?: string; enabled?: boolean } = {};

    if ("tag" in body) {
      const tag =
        typeof (body as { tag?: unknown }).tag === "string"
          ? (body as { tag: string }).tag.trim()
          : "";
      if (!tag) {
        return Response.json({ message: "tag is required." }, { status: 400 });
      }
      patch.tag = tag;
    }
    if ("enabled" in body) {
      if (typeof (body as { enabled?: unknown }).enabled !== "boolean") {
        return Response.json(
          { message: "enabled must be a boolean." },
          { status: 400 },
        );
      }
      patch.enabled = (body as { enabled: boolean }).enabled;
    }

    const result = await updateFubTag(id, patch);
    if (result.error || !result.data) {
      const status = result.error === "FUB tag not found." ? 404 : 500;
      return Response.json(
        { message: result.error ?? "Failed to update FUB tag." },
        { status },
      );
    }

    return Response.json({ tag: result.data });
  }

  return Response.json({ message: "Method not allowed." }, { status: 405 });
}
