import { enforcePageEditorAdmin } from "@/app/api/_services/settingsAdminAuth";
import { publishFormPage } from "@/app/api/_services/formPageQueries";
import { isSettingsFormKind } from "@/app/forms/_core/formIdentity";
import {
  MAX_PAGE_BYTES,
  parseFormPageData,
} from "@/app/forms/editor/formPageData";
import type { JsonValue } from "@/app/types/storage";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { form?: string };
}) {
  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  const authError = enforcePageEditorAdmin(request);
  if (authError) return authError;

  const form = params.form;
  if (!form || !isSettingsFormKind(form)) {
    return Response.json({ message: "Unknown form." }, { status: 400 });
  }

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_PAGE_BYTES) {
    return Response.json({ message: "Page document is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  const version = body.version;
  if (
    typeof version !== "number" ||
    !Number.isInteger(version) ||
    version < 0
  ) {
    return Response.json({ message: "Invalid page version." }, { status: 400 });
  }

  const parsed = parseFormPageData(body.data);
  if (!parsed.ok) {
    return Response.json({ message: parsed.error }, { status: 400 });
  }

  const result = await publishFormPage(
    form,
    parsed.data as unknown as JsonValue,
    version,
  );

  if (!result.ok) {
    if ("conflict" in result) {
      return Response.json(
        { message: "This page changed elsewhere." },
        { status: 409 },
      );
    }
    return Response.json({ message: result.error }, { status: 500 });
  }

  return Response.json({ version: result.version, warnings: [] });
}
