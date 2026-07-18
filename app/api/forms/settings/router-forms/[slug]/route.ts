import { NextResponse } from "next/server";
import { updateRouterFormVisibility } from "@/app/api/_services/routerFormsRepo";
import { isFormRouterSlug } from "@/app/forms/_core/formIdentity";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  if (!isFormRouterSlug(slug)) {
    return NextResponse.json({ message: "Unknown form slug." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { visible?: unknown }).visible !== "boolean"
  ) {
    return NextResponse.json(
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
    return NextResponse.json(
      { message: result.error ?? "Failed to update router form." },
      { status },
    );
  }

  return NextResponse.json({ form: result.data });
}
