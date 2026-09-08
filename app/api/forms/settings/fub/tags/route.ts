import {
  createFubTag,
  listFubTags,
  replaceFubTagsForClientType,
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

  const result = await listFubTags(form);
  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to list FUB tags." },
      { status: 500 },
    );
  }

  return Response.json({ form, tags: result.data });
}

export async function action({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  if (request.method === "PUT") {
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

    if (!form) {
      return Response.json({ message: "form is required." }, { status: 400 });
    }

    const requiresClientType = formSupportsFubClientType(form);
    const clientType = normalizeFubClientType(
      typeof (body as { client_type?: unknown }).client_type === "string"
        ? (body as { client_type: string }).client_type
        : null,
    );
    const tags = Array.isArray((body as { tags?: unknown }).tags)
      ? (body as { tags: unknown[] }).tags.filter(
          (tag): tag is string => typeof tag === "string",
        )
      : null;

    if (requiresClientType && !clientType) {
      return Response.json(
        { message: "client_type must be Buyer or Seller." },
        { status: 400 },
      );
    }
    if (!tags) {
      return Response.json(
        { message: "tags must be an array of strings." },
        { status: 400 },
      );
    }

    const result = await replaceFubTagsForClientType({
      form,
      client_type: requiresClientType ? clientType : null,
      tags,
    });
    if (result.error || !result.data) {
      return Response.json(
        { message: result.error ?? "Failed to replace FUB tags." },
        { status: 500 },
      );
    }

    return Response.json({ tags: result.data });
  }

  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
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
    return Response.json({ message: "form is required." }, { status: 400 });
  }
  if (!tag) {
    return Response.json({ message: "tag is required." }, { status: 400 });
  }

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

  const result = await createFubTag({
    form,
    client_type: requiresClientType ? clientType : null,
    tag,
  });
  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to create FUB tag." },
      { status: 500 },
    );
  }

  return Response.json({ tag: result.data }, { status: 201 });
}
