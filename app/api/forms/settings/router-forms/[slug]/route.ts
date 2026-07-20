import { updateRouterFormVisibility } from "@/app/api/_services/routerFormsRepo";
import { isFormRouterSlug } from "@/app/forms/_core/formIdentity";

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { slug: string };
}) {
  if (request.method !== "PATCH") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  const slug = params.slug;

  if (!isFormRouterSlug(slug)) {
    return Response.json({ message: "Unknown form slug." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { visible?: unknown }).visible !== "boolean"
  ) {
    return Response.json(
      { message: "Body must include boolean visible." },
      { status: 400 },
    );
  }

  const result = await updateRouterFormVisibility(
    slug,
    (body as { visible: boolean }).visible,
  );

  if (result.error || !result.data) {
    const status = result.error === "Router form not found." ? 404 : 500;
    return Response.json(
      { message: result.error ?? "Failed to update router form." },
      { status },
    );
  }

  return Response.json({ form: result.data });
}
