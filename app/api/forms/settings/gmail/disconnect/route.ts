import { disconnectGmailForCurrentEnvironment } from "@/app/api/_services/gmailOAuthService";

export async function action({ request }: { request: Request }) {
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
