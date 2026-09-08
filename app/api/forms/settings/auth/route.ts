import {
  buildSettingsAdminSessionCookieHeader,
  clearSettingsAdminSessionCookieHeader,
  isSettingsAdminAuthenticated,
  isSettingsAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/app/api/_services/settingsAdminAuth";

export async function loader({ request }: { request: Request }) {
  return Response.json({
    protectionEnabled: isSettingsAdminPasswordConfigured(),
    authenticated: isSettingsAdminAuthenticated(request),
  });
}

export async function action({ request }: { request: Request }) {
  if (request.method === "DELETE") {
    return Response.json(
      { loggedOut: true },
      { headers: { "Set-Cookie": clearSettingsAdminSessionCookieHeader() } },
    );
  }

  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  if (!isSettingsAdminPasswordConfigured()) {
    return Response.json(
      { message: "ADMIN_PASSWORD is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const password =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!password) {
    return Response.json({ message: "Password is required." }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return Response.json({ message: "Invalid password." }, { status: 401 });
  }

  const cookieHeader = buildSettingsAdminSessionCookieHeader();
  if (!cookieHeader) {
    return Response.json(
      { message: "Could not create admin session." },
      { status: 500 },
    );
  }

  return Response.json(
    { authenticated: true },
    { headers: { "Set-Cookie": cookieHeader } },
  );
}
