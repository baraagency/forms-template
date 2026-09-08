import { disconnectGmailForCurrentEnvironment } from "@/app/api/_services/gmailOAuthService";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";

export async function action({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  const result = await disconnectGmailForCurrentEnvironment();

  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to disconnect Gmail." },
      { status: 500 },
    );
  }

  return Response.json({ disconnected: true });
}
