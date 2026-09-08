import {
  createEmailRecipient,
  listEmailRecipients,
} from "@/app/api/_services/settingsQueries";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";
import {
  isSettingsFormKind,
  normalizeSettingsEnvironment,
  parseFormKindParam,
} from "@/app/forms/_core/formIdentity";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function loader({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  const environment = normalizeSettingsEnvironment();
  const formParam = new URL(request.url).searchParams.get("form");
  const formType = formParam ? parseFormKindParam(formParam) : null;

  if (formParam && !formType) {
    return Response.json(
      { message: "Query form must be a valid FormKind or slug." },
      { status: 400 },
    );
  }

  const result = await listEmailRecipients(
    environment,
    formType ?? undefined,
  );

  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to list recipients." },
      { status: 500 },
    );
  }

  return Response.json({
    environment,
    form: formType,
    recipients: result.data,
  });
}

export async function action({ request }: { request: Request }) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ message: "Invalid body." }, { status: 400 });
  }

  const email =
    typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";
  const formTypeRaw =
    typeof (body as { form_type?: unknown }).form_type === "string"
      ? (body as { form_type: string }).form_type
      : typeof (body as { form?: unknown }).form === "string"
        ? (body as { form: string }).form
        : null;
  const form_type = formTypeRaw ? parseFormKindParam(formTypeRaw) : null;

  if (!email || !isValidEmail(email)) {
    return Response.json(
      { message: "A valid email is required." },
      { status: 400 },
    );
  }

  if (!form_type || !isSettingsFormKind(form_type)) {
    return Response.json(
      { message: "form_type is required (FormKind)." },
      { status: 400 },
    );
  }

  const environment = normalizeSettingsEnvironment();
  const result = await createEmailRecipient({
    environment,
    email,
    form_type,
    active: true,
  });

  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to create recipient." },
      { status: 500 },
    );
  }

  return Response.json({ recipient: result.data }, { status: 201 });
}
