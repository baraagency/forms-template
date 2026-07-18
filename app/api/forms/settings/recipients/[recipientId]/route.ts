import { NextResponse } from "next/server";
import {
  deleteEmailRecipient,
  updateEmailRecipient,
} from "@/app/api/_services/settingsQueries";
import {
  isSettingsFormKind,
  normalizeSettingsEnvironment,
  parseFormKindParam,
} from "@/app/forms/_core/formIdentity";

type RouteContext = {
  params: Promise<{ recipientId: string }>;
};

function parseId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { recipientId } = await context.params;
  const id = parseId(recipientId);
  if (!id) {
    return NextResponse.json({ message: "Invalid recipient id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
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
      return NextResponse.json(
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
      return NextResponse.json(
        { message: "form_type must be a valid FormKind." },
        { status: 400 },
      );
    }
    patch.form_type = form_type;
  }

  if ("active" in body) {
    if (typeof (body as { active?: unknown }).active !== "boolean") {
      return NextResponse.json(
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
    return NextResponse.json(
      { message: result.error ?? "Failed to update recipient." },
      { status },
    );
  }

  return NextResponse.json({ recipient: result.data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { recipientId } = await context.params;
  const id = parseId(recipientId);
  if (!id) {
    return NextResponse.json({ message: "Invalid recipient id." }, { status: 400 });
  }

  const environment = normalizeSettingsEnvironment();
  const result = await deleteEmailRecipient(id, environment);

  if (result.error || !result.data) {
    const status = result.error === "Recipient not found." ? 404 : 500;
    return NextResponse.json(
      { message: result.error ?? "Failed to delete recipient." },
      { status },
    );
  }

  return NextResponse.json({ deleted: true });
}
