import { NextResponse } from "next/server";
import {
  createEmailRecipient,
  listEmailRecipients,
} from "@/app/api/_services/settingsQueries";
import {
  isSettingsFormKind,
  normalizeSettingsEnvironment,
  parseFormKindParam,
} from "@/app/forms/_core/formIdentity";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(request: Request) {
  const environment = normalizeSettingsEnvironment();
  const formParam = new URL(request.url).searchParams.get("form");
  const formType = formParam ? parseFormKindParam(formParam) : null;

  if (formParam && !formType) {
    return NextResponse.json(
      { message: "Query form must be a valid FormKind or slug." },
      { status: 400 },
    );
  }

  const result = await listEmailRecipients(
    environment,
    formType ?? undefined,
  );

  if (result.error || !result.data) {
    return NextResponse.json(
      { message: result.error ?? "Failed to list recipients." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    environment,
    form: formType,
    recipients: result.data,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
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
    return NextResponse.json(
      { message: "A valid email is required." },
      { status: 400 },
    );
  }

  if (!form_type || !isSettingsFormKind(form_type)) {
    return NextResponse.json(
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
    return NextResponse.json(
      { message: result.error ?? "Failed to create recipient." },
      { status: 500 },
    );
  }

  return NextResponse.json({ recipient: result.data }, { status: 201 });
}
