import type { RouterForm } from "@/app/types/storage";
import { FORM_ROUTER_FORM_REGISTRY } from "@/app/forms/_core/formRouterFormRegistry";
import type { FormRouterFormMeta } from "@/app/forms/_core/formRouterFormRegistry";
import { isFormRouterSlug } from "@/app/forms/_core/formIdentity";
import { requireDbPool, type StorageResult } from "./dbPool";

export async function listRouterForms(): Promise<StorageResult<RouterForm[]>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<RouterForm>(
      `SELECT slug, name, visible FROM router_forms`,
    );
    const orderIndex = new Map(
      FORM_ROUTER_FORM_REGISTRY.map((form, index) => [form.key, index]),
    );
    const rows = [...result.rows].sort((a, b) => {
      const aIndex = orderIndex.get(a.slug as FormRouterFormMeta["key"]) ?? 999;
      const bIndex = orderIndex.get(b.slug as FormRouterFormMeta["key"]) ?? 999;
      return aIndex - bIndex;
    });
    return { data: rows, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to list router forms.",
    };
  }
}

export async function updateRouterFormVisibility(
  slug: string,
  visible: boolean,
): Promise<StorageResult<RouterForm>> {
  if (!isFormRouterSlug(slug)) {
    return { data: null, error: "Unknown form slug." };
  }

  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<RouterForm>(
      `UPDATE router_forms
       SET visible = $2
       WHERE slug = $1
       RETURNING slug, name, visible`,
      [slug, visible],
    );

    if (result.rows.length === 0) {
      return { data: null, error: "Router form not found." };
    }

    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to update router form.",
    };
  }
}

/**
 * Merge DB visibility with static registry. On DB failure, returns all registry
 * forms and an error message for the caller to surface as a Notice.
 */
export async function listVisibleFormRouterForms(): Promise<{
  forms: FormRouterFormMeta[];
  warning: string | null;
}> {
  const listed = await listRouterForms();

  if (listed.error || !listed.data) {
    return {
      forms: FORM_ROUTER_FORM_REGISTRY,
      warning:
        listed.error ??
        "Could not load form visibility from the database. Showing all forms.",
    };
  }

  const visibilityBySlug = new Map(
    listed.data.map((row) => [row.slug, row] as const),
  );

  const forms = FORM_ROUTER_FORM_REGISTRY.filter((meta) => {
    const row = visibilityBySlug.get(meta.key);
    if (!row) {
      return true;
    }
    return row.visible;
  }).map((meta) => {
    const row = visibilityBySlug.get(meta.key);
    if (!row?.name) {
      return meta;
    }
    return { ...meta, title: row.name };
  });

  return { forms, warning: null };
}
