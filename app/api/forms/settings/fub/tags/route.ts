import { createFubTag, listFubTags } from "@/app/api/_services/settingsQueries";
import { parseFormKindParam } from "@/app/forms/_core/formIdentity";

export async function loader({ request }: { request: Request }) {
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

  const result = await createFubTag({ form, tag });
  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to create FUB tag." },
      { status: 500 },
    );
  }

  return Response.json({ tag: result.data }, { status: 201 });
}
