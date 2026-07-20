import { listRouterForms } from "@/app/api/_services/routerFormsRepo";

export async function loader() {
  const result = await listRouterForms();

  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to load router forms." },
      { status: 500 },
    );
  }

  return Response.json({ forms: result.data });
}
