import { getGmailStatusForCurrentEnvironment } from "@/app/api/_services/gmailOAuthService";

export async function loader() {
  const result = await getGmailStatusForCurrentEnvironment();

  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to load Gmail status." },
      { status: 500 },
    );
  }

  return Response.json(result.data);
}
