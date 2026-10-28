import {
  enforcePageEditorAdmin,
} from "@/app/api/_services/settingsAdminAuth";
import {
  listFormFieldMappings,
  saveFormFieldMappings,
  type FormFieldMappingPatch,
} from "@/app/api/_services/formMappingQueries";
import { isSettingsFormKind } from "@/app/forms/_core/formIdentity";
import { isLockedClientTypeSisuMapping } from "@/app/forms/settings/formFieldCatalog";

function readOptionalString(value: unknown): string | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" ? value : undefined;
}

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { form?: string };
}) {
  const authError = enforcePageEditorAdmin(request);
  if (authError) return authError;

  const form = params.form;
  if (!form || !isSettingsFormKind(form)) {
    return Response.json({ message: "Unknown form." }, { status: 400 });
  }

  const result = await listFormFieldMappings(form);
  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to load mappings." },
      { status: 500 },
    );
  }

  return Response.json({ form, ...result.data });
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { form?: string };
}) {
  if (request.method !== "PUT") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  const authError = enforcePageEditorAdmin(request);
  if (authError) return authError;

  const form = params.form;
  if (!form || !isSettingsFormKind(form)) {
    return Response.json({ message: "Unknown form." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const fieldName =
    typeof record.fieldName === "string" ? record.fieldName.trim() : "";
  if (!fieldName) {
    return Response.json({ message: "fieldName is required." }, { status: 400 });
  }

  const sisuFieldName = readOptionalString(record.sisuFieldName);
  const sisuFieldType = readOptionalString(record.sisuFieldType);
  const fubPersonField = readOptionalString(record.fubPersonField);
  const fubDealField = readOptionalString(record.fubDealField);
  const custom = record.custom === undefined ? false : Boolean(record.custom);

  if (
    sisuFieldName === undefined ||
    sisuFieldType === undefined ||
    fubPersonField === undefined ||
    fubDealField === undefined
  ) {
    return Response.json(
      { message: "Mapping targets must be strings or null." },
      { status: 400 },
    );
  }

  if (
    isLockedClientTypeSisuMapping(form, fieldName) &&
    sisuFieldName !== "type_id"
  ) {
    return Response.json(
      { message: "The Client Type mapping is fixed to type_id." },
      { status: 400 },
    );
  }

  const patch: FormFieldMappingPatch = {
    sisuFieldName,
    sisuFieldType,
    custom,
    fubPersonField,
    fubDealField,
  };

  const result = await saveFormFieldMappings(form, fieldName, patch);
  if (result.error) {
    return Response.json({ message: result.error }, { status: 500 });
  }

  return Response.json({ ok: true });
}
