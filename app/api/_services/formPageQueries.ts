import type { FormPageRow, JsonValue } from "@/app/types/storage";
import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";
import { requireDbPool, type StorageResult } from "./dbPool";

export type FormPageWriteResult =
  | { ok: true; version: number }
  | { ok: false; conflict: true }
  | { ok: false; error: string };

export async function getFormPage(
  form: SettingsFormKind,
): Promise<StorageResult<FormPageRow | null>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormPageRow>(
      `SELECT form, draft, published, schema_version, version, updated_at, published_at
       FROM form_pages
       WHERE form = $1`,
      [form],
    );
    return { data: result.rows[0] ?? null, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to load form page.",
    };
  }
}

export async function saveFormPageDraft(
  form: SettingsFormKind,
  draft: JsonValue,
  expectedVersion: number,
): Promise<FormPageWriteResult> {
  return writeFormPage({
    form,
    draft,
    expectedVersion,
    publish: false,
  });
}

export async function publishFormPage(
  form: SettingsFormKind,
  draft: JsonValue,
  expectedVersion: number,
): Promise<FormPageWriteResult> {
  return writeFormPage({
    form,
    draft,
    expectedVersion,
    publish: true,
  });
}

async function writeFormPage(input: {
  form: SettingsFormKind;
  draft: JsonValue;
  expectedVersion: number;
  publish: boolean;
}): Promise<FormPageWriteResult> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return {
      ok: false,
      error: poolResult.error ?? "Database unavailable.",
    };
  }

  const serialized = JSON.stringify(input.draft);

  try {
    const result = input.publish
      ? await poolResult.data.query<{ version: number }>(
          `INSERT INTO form_pages (form, draft, published, version, published_at)
           VALUES ($1, $2::jsonb, $2::jsonb, 1, NOW())
           ON CONFLICT (form) DO UPDATE
           SET draft = EXCLUDED.draft,
               published = EXCLUDED.draft,
               version = form_pages.version + 1,
               updated_at = NOW(),
               published_at = NOW()
           WHERE form_pages.version = $3
           RETURNING version`,
          [input.form, serialized, input.expectedVersion],
        )
      : await poolResult.data.query<{ version: number }>(
          `INSERT INTO form_pages (form, draft, version)
           VALUES ($1, $2::jsonb, 1)
           ON CONFLICT (form) DO UPDATE
           SET draft = EXCLUDED.draft,
               version = form_pages.version + 1,
               updated_at = NOW()
           WHERE form_pages.version = $3
           RETURNING version`,
          [input.form, serialized, input.expectedVersion],
        );

    const row = result.rows[0];
    if (!row) {
      return { ok: false, conflict: true };
    }

    return { ok: true, version: row.version };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to write form page.",
    };
  }
}
