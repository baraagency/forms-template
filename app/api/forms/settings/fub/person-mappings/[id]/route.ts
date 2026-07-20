import { updatePersonMapping } from "@/app/api/_services/settingsQueries";

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
  if (request.method !== "PATCH") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  const id = parseId(params.id);
  if (!id) {
    return Response.json({ message: "Invalid mapping id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ message: "Invalid body." }, { status: 400 });
  }

  const patch: { fub_field_name?: string | null; enabled?: boolean } = {};

  if ("fub_field_name" in body) {
    const value = (body as { fub_field_name?: unknown }).fub_field_name;
    patch.fub_field_name =
      typeof value === "string" ? value.trim() || null : null;
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

  const result = await updatePersonMapping(id, patch);
  if (result.error || !result.data) {
    const status = result.error === "Mapping not found." ? 404 : 500;
    return Response.json(
      { message: result.error ?? "Failed to update person mapping." },
      { status },
    );
  }

  return Response.json({ mapping: result.data });
}
