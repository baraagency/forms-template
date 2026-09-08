import {
  deleteEmailRecipient,
  updateEmailRecipient,
} from "@/app/api/_services/settingsQueries";
import { enforceSettingsAdminAuth } from "@/app/api/_services/settingsAdminAuth";
import {
  isSettingsFormKind,
  normalizeSettingsEnvironment,
  parseFormKindParam,
} from "@/app/forms/_core/formIdentity";

function parseId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { recipientId: string };
}) {
  const authError = enforceSettingsAdminAuth(request);
  if (authError) return authError;

  const id = parseId(params.recipientId);
  if (!id) {
    return Response.json({ message: "Invalid recipient id." }, { status: 400 });
  }

  if (request.method === "DELETE") {
    const environment = normalizeSettingsEnvironment();
    const result = await deleteEmailRecipient(id, environment);

    if (result.error || !result.data) {
      const status = result.error === "Recipient not found." ? 404 : 500;
      return Response.json(
        { message: result.error ?? "Failed to delete recipient." },
        { status },
      );
    }

    return Response.json({ deleted: true });
  }

  if (request.method === "PATCH") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return Response.json({ message: "Invalid body." }, { status: 400 });
    }

    const patch: {
      email?: string;
      form_type?: string;
      active?: boolean;
    } = {};

    if ("email" in body) {
      const email =
        typeof (body as { email?: unknown }).email === "string"
          ? (body as { email: string }).email.trim()
          : "";
      if (!email || !isValidEmail(email)) {
        return Response.json(
          { message: "A valid email is required." },
          { status: 400 },
        );
      }
      patch.email = email;
    }

    if ("form_type" in body || "form" in body) {
      const formTypeRaw =
        typeof (body as { form_type?: unknown }).form_type === "string"
          ? (body as { form_type: string }).form_type
          : typeof (body as { form?: unknown }).form === "string"
            ? (body as { form: string }).form
            : null;
      const form_type = formTypeRaw ? parseFormKindParam(formTypeRaw) : null;
      if (!form_type || !isSettingsFormKind(form_type)) {
        return Response.json(
          { message: "form_type must be a valid FormKind." },
          { status: 400 },
        );
      }
      patch.form_type = form_type;
    }

    if ("active" in body) {
      if (typeof (body as { active?: unknown }).active !== "boolean") {
        return Response.json(
          { message: "active must be a boolean." },
          { status: 400 },
        );
      }
      patch.active = (body as { active: boolean }).active;
    }

    const environment = normalizeSettingsEnvironment();
    const result = await updateEmailRecipient(id, environment, patch);

    if (result.error || !result.data) {
      const status = result.error === "Recipient not found." ? 404 : 500;
      return Response.json(
        { message: result.error ?? "Failed to update recipient." },
        { status },
      );
    }

    return Response.json({ recipient: result.data });
  }

  return Response.json({ message: "Method not allowed." }, { status: 405 });
}
