import { listRouterForms } from "@/app/api/_services/routerFormsRepo";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";

export async function loader({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  const result = await listRouterForms();

  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to load router forms." },
      { status: 500 },
    );
  }

  return Response.json({ forms: result.data });
}
