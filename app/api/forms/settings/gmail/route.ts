import { getGmailStatusForCurrentEnvironment } from "@/app/api/_services/gmailOAuthService";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";

export async function loader({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  const result = await getGmailStatusForCurrentEnvironment();

  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to load Gmail status." },
      { status: 500 },
    );
  }

  return Response.json(result.data);
}
