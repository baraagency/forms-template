import {
  createFubStage,
  listFubStages,
  setDesiredFubStage,
} from "@/app/api/_services/settingsQueries";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";
import { parseFormKindParam } from "@/app/forms/_core/formIdentity";
import {
  formSupportsFubClientType,
  normalizeFubClientType,
} from "@/app/forms/_core/fubClientTypeSettings";

export async function loader({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  const form = parseFormKindParam(new URL(request.url).searchParams.get("form"));
  if (!form) {
    return Response.json(
      { message: "Query form is required (FormKind or slug)." },
      { status: 400 },
    );
  }

  const result = await listFubStages(form);
  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to list FUB stages." },
      { status: 500 },
    );
  }

  return Response.json({ form, stages: result.data });
}

export async function action({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  if (request.method === "PUT") {
    /** Set the single desired stage for form + target + client type. */
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return Response.json({ message: "Invalid body." }, { status: 400 });
    }

    const form = parseFormKindParam(
      typeof (body as { form?: unknown }).form === "string"
        ? (body as { form: string }).form
        : null,
    );
    const target = (body as { target?: unknown }).target;
    const stageIdRaw = (body as { stage_id?: unknown }).stage_id;
    const stageId =
      stageIdRaw === null || stageIdRaw === ""
        ? null
        : Number(stageIdRaw);

    if (!form) {
      return Response.json({ message: "form is required." }, { status: 400 });
    }
    if (target !== "person" && target !== "deal") {
      return Response.json(
        { message: "target must be person or deal." },
        { status: 400 },
      );
    }
    if (stageId !== null && (!Number.isInteger(stageId) || stageId <= 0)) {
      return Response.json(
        { message: "stage_id must be a positive integer or null." },
        { status: 400 },
      );
    }

    const stageName =
      typeof (body as { stage_name?: unknown }).stage_name === "string"
        ? (body as { stage_name: string }).stage_name
        : null;
    const requiresClientType = formSupportsFubClientType(form);
    const clientType = normalizeFubClientType(
      typeof (body as { client_type?: unknown }).client_type === "string"
        ? (body as { client_type: string }).client_type
        : null,
    );

    if (requiresClientType && !clientType) {
      return Response.json(
        { message: "client_type must be Buyer or Seller." },
        { status: 400 },
      );
    }

    const result = await setDesiredFubStage({
      form,
      target,
      client_type: requiresClientType ? clientType : null,
      stage_id: stageId,
      stage_name: stageName,
    });

    if (result.error) {
      return Response.json(
        { message: result.error ?? "Failed to set FUB stage." },
        { status: 500 },
      );
    }

    return Response.json({ stage: result.data });
  }

  if (request.method === "POST") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return Response.json({ message: "Invalid body." }, { status: 400 });
    }

    const form = parseFormKindParam(
      typeof (body as { form?: unknown }).form === "string"
        ? (body as { form: string }).form
        : null,
    );
    const target = (body as { target?: unknown }).target;
    const stageId = Number((body as { stage_id?: unknown }).stage_id);

    if (!form) {
      return Response.json({ message: "form is required." }, { status: 400 });
    }
    if (target !== "person" && target !== "deal") {
      return Response.json(
        { message: "target must be person or deal." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(stageId) || stageId <= 0) {
      return Response.json(
        { message: "stage_id must be a positive integer." },
        { status: 400 },
      );
    }

    const clientType =
      typeof (body as { client_type?: unknown }).client_type === "string"
        ? (body as { client_type: string }).client_type
        : null;
    const stageName =
      typeof (body as { stage_name?: unknown }).stage_name === "string"
        ? (body as { stage_name: string }).stage_name
        : null;

    const result = await createFubStage({
      form,
      target,
      client_type: clientType,
      stage_id: stageId,
      stage_name: stageName,
    });

    if (result.error || !result.data) {
      return Response.json(
        { message: result.error ?? "Failed to create FUB stage." },
        { status: 500 },
      );
    }

    return Response.json({ stage: result.data }, { status: 201 });
  }

  return Response.json({ message: "Method not allowed." }, { status: 405 });
}
