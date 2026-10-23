import {
  getAppTheme,
  saveAppBranding,
} from "@/app/api/_services/appThemeService";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";
import {
  MAX_LOGO_ALT_LENGTH,
  MAX_LOGO_URL_LENGTH,
  normalizeLogoAlt,
  normalizeLogoUrl,
} from "@/app/theme/appTheme";

export async function loader({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  const payload = await getAppTheme();

  return Response.json({
    logoUrl: payload.branding.logoUrl,
    logoAlt: payload.branding.logoAlt,
  });
}

export async function action({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  if (request.method !== "PUT") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json(
      { message: "Body must include logoUrl and logoAlt." },
      { status: 400 },
    );
  }

  const rawLogoUrl = (body as { logoUrl?: unknown }).logoUrl;
  const rawLogoAlt = (body as { logoAlt?: unknown }).logoAlt;

  if (typeof rawLogoUrl !== "string" || typeof rawLogoAlt !== "string") {
    return Response.json(
      { message: "Body must include string logoUrl and logoAlt." },
      { status: 400 },
    );
  }

  const trimmedUrl = rawLogoUrl.trim();
  if (trimmedUrl.length > MAX_LOGO_URL_LENGTH) {
    return Response.json(
      { message: "Logo URL is too long." },
      { status: 400 },
    );
  }

  const logoUrl = trimmedUrl ? normalizeLogoUrl(trimmedUrl) : null;
  if (trimmedUrl && !logoUrl) {
    return Response.json(
      {
        message:
          "Logo URL must be an absolute http(s) URL, e.g. https://example.com/logo.png.",
      },
      { status: 400 },
    );
  }

  if (rawLogoAlt.trim().length > MAX_LOGO_ALT_LENGTH) {
    return Response.json(
      { message: `Logo alt text must be ${MAX_LOGO_ALT_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const logoAlt = normalizeLogoAlt(rawLogoAlt);
  const result = await saveAppBranding({ logoUrl, logoAlt });

  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to save branding." },
      { status: 500 },
    );
  }

  return Response.json({
    logoUrl: result.data.branding.logoUrl,
    logoAlt: result.data.branding.logoAlt,
  });
}
