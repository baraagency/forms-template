import {
  deleteFubStage,
  updateFubStage,
} from "@/app/api/_services/settingsQueries";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";
import type { FubStageTarget } from "@/app/types/storage";

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
    return Response.json({ message: "Invalid stage id." }, { status: 400 });
  }

  if (request.method === "DELETE") {
    const result = await deleteFubStage(id);
    if (result.error || !result.data) {
      const status = result.error === "FUB stage not found." ? 404 : 500;
      return Response.json(
        { message: result.error ?? "Failed to delete FUB stage." },
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

    const patch: {
      target?: FubStageTarget;
      client_type?: string | null;
      stage_id?: number;
      stage_name?: string | null;
      enabled?: boolean;
    } = {};

    if ("target" in body) {
      const target = (body as { target?: unknown }).target;
      if (target !== "person" && target !== "deal") {
        return Response.json(
          { message: "target must be person or deal." },
          { status: 400 },
        );
      }
      patch.target = target;
    }
    if ("client_type" in body) {
      const value = (body as { client_type?: unknown }).client_type;
      patch.client_type = typeof value === "string" ? value : null;
    }
    if ("stage_id" in body) {
      const stageId = Number((body as { stage_id?: unknown }).stage_id);
      if (!Number.isInteger(stageId) || stageId <= 0) {
        return Response.json(
          { message: "stage_id must be a positive integer." },
          { status: 400 },
        );
      }
      patch.stage_id = stageId;
    }
    if ("stage_name" in body) {
      const value = (body as { stage_name?: unknown }).stage_name;
      patch.stage_name = typeof value === "string" ? value : null;
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

    const result = await updateFubStage(id, patch);
    if (result.error || !result.data) {
      const status = result.error === "FUB stage not found." ? 404 : 500;
      return Response.json(
        { message: result.error ?? "Failed to update FUB stage." },
        { status },
      );
    }

    return Response.json({ stage: result.data });
  }

  return Response.json({ message: "Method not allowed." }, { status: 405 });
}
