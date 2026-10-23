import {
  getAppTheme,
  saveAppTheme,
} from "@/app/api/_services/appThemeService";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";
import {
  DEFAULT_THEME_SELECTION,
  normalizeHexColor,
} from "@/app/theme/appTheme";

export async function loader({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  const payload = await getAppTheme();

  return Response.json({
    primaryColor: payload.selection.primaryColor,
    secondaryColor: payload.selection.secondaryColor,
    resolved: payload.resolved,
    defaults: DEFAULT_THEME_SELECTION,
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
      { message: "Body must include primaryColor and secondaryColor." },
      { status: 400 },
    );
  }

  const primaryColor = normalizeHexColor(
    (body as { primaryColor?: unknown }).primaryColor,
  );
  const secondaryColor = normalizeHexColor(
    (body as { secondaryColor?: unknown }).secondaryColor,
  );

  if (!primaryColor || !secondaryColor) {
    return Response.json(
      {
        message:
          "Primary and secondary colors must be hex values like #003A55.",
      },
      { status: 400 },
    );
  }

  const result = await saveAppTheme({ primaryColor, secondaryColor });

  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to save appearance." },
      { status: 500 },
    );
  }

  return Response.json({
    primaryColor: result.data.selection.primaryColor,
    secondaryColor: result.data.selection.secondaryColor,
    resolved: result.data.resolved,
    defaults: DEFAULT_THEME_SELECTION,
  });
}
