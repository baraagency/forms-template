import { enforcePageEditorAdmin } from "@/app/api/_services/settingsAdminAuth";
import {
  getFormPage,
  publishFormPage,
} from "@/app/api/_services/formPageQueries";
import { pruneFormFieldMappings, pruneOrphanEditorMappings } from "@/app/api/_services/formMappingQueries";
import { loadSisuTeamFieldCatalog } from "@/app/api/_services/sisuTeamFieldsService";
import { loadSisuTeamAgentOptions } from "@/app/api/_services/sisuTeamAgentOptionsService";
import { loadSisuVendorOptions } from "@/app/api/_services/sisuVendorOptionsService";
import { loadFubUserOptions } from "@/app/api/_services/fubUserOptionsService";
import { loadFubAppointmentTypeOptions } from "@/app/api/_services/fubAppointmentTypeOptionsService";
import { isSettingsFormKind } from "@/app/forms/_core/formIdentity";
import {
  MAX_PAGE_BYTES,
  collectPageFields,
  parseFormPageData,
} from "@/app/forms/editor/formPageData";
import {
  findRemovedPublishedFields,
  resolvePublishedPageOptions,
} from "@/app/forms/editor/formPagePublish";
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

  const resolved = await resolvePublishedPageOptions(parsed.data, {
    loadSisuTeamFields: loadSisuTeamFieldCatalog,
    loadSisuAgents: loadSisuTeamAgentOptions,
    loadSisuVendors: loadSisuVendorOptions,
    loadFubUsers: loadFubUserOptions,
    loadFubAppointmentTypes: loadFubAppointmentTypeOptions,
  });
  const publishable = parseFormPageData(resolved.data, { forPublish: true });
  if (!publishable.ok) {
    return Response.json({ message: publishable.error }, { status: 400 });
  }

  const previousPage = await getFormPage(form);
  const previousParsed =
    previousPage.data?.published
      ? parseFormPageData(previousPage.data.published, { forPublish: true })
      : null;

  const result = await publishFormPage(
    form,
    publishable.data as unknown as JsonValue,
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

  const warnings = [...resolved.warnings];
  const removed = findRemovedPublishedFields(
    previousParsed?.ok ? previousParsed.data : null,
    publishable.data,
  );

  if (removed.length > 0) {
    const pruned = await pruneFormFieldMappings(
      form,
      removed.map((field) => field.id),
    );
    if (pruned.error) {
      warnings.push(
        `Page published, but mappings for removed fields could not be pruned: ${pruned.error}`,
      );
    } else if ((pruned.data ?? 0) > 0) {
      warnings.push(
        `Removed mappings for: ${removed.map((field) => field.label).join(", ")}.`,
      );
    }
  }

  const validIds = collectPageFields(publishable.data).map((field) => field.id);
  const orphans = await pruneOrphanEditorMappings(form, validIds);
  if (orphans.error) {
    warnings.push(
      `Page published, but mappings for deleted editor fields could not be pruned: ${orphans.error}`,
    );
  } else if ((orphans.data ?? 0) > 0) {
    warnings.push("Removed mappings for deleted editor fields.");
  }

  return Response.json({
    version: result.version,
    warnings,
  });
}
