import type {
  FormFubDealMapping,
  FormFubPersonMapping,
  FormSisuMapping,
} from "@/app/types/storage";
import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";
import { requireDbPool, type StorageResult } from "./dbPool";

export type FormFieldMappingPatch = {
  sisuFieldName: string | null;
  sisuFieldType: string | null;
  custom: boolean;
  fubPersonField: string | null;
  fubDealField: string | null;
};

export type FormFieldMappings = {
  sisu: FormSisuMapping[];
  person: FormFubPersonMapping[];
  deal: FormFubDealMapping[];
};

function clean(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

export async function listFormFieldMappings(
  form: SettingsFormKind,
): Promise<StorageResult<FormFieldMappings>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const [sisu, person, deal] = await Promise.all([
      poolResult.data.query<FormSisuMapping>(
        `SELECT id, form, field_name, sisu_field_name, sisu_field_type, custom, enabled, created_at, updated_at
         FROM form_sisu_mappings WHERE form = $1 ORDER BY field_name`,
        [form],
      ),
      poolResult.data.query<FormFubPersonMapping>(
        `SELECT id, form, field_name, fub_field_name, enabled, created_at, updated_at
         FROM form_fub_person_mappings WHERE form = $1 ORDER BY field_name`,
        [form],
      ),
      poolResult.data.query<FormFubDealMapping>(
        `SELECT id, form, field_name, fub_field_name, enabled, created_at, updated_at
         FROM form_fub_deal_mappings WHERE form = $1 ORDER BY field_name`,
        [form],
      ),
    ]);

    return {
      data: { sisu: sisu.rows, person: person.rows, deal: deal.rows },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to load mappings.",
    };
  }
}

export async function saveFormFieldMappings(
  form: SettingsFormKind,
  fieldName: string,
  patch: FormFieldMappingPatch,
): Promise<StorageResult<true>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  const sisuFieldName = clean(patch.sisuFieldName);
  const personField = clean(patch.fubPersonField);
  const dealField = clean(patch.fubDealField);
  const client = await poolResult.data.connect();

  try {
    await client.query("BEGIN");

    if (sisuFieldName) {
      await client.query(
        `INSERT INTO form_sisu_mappings
           (form, field_name, sisu_field_name, sisu_field_type, custom, enabled)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (form, field_name) DO UPDATE
         SET sisu_field_name = EXCLUDED.sisu_field_name,
             sisu_field_type = EXCLUDED.sisu_field_type,
             custom = EXCLUDED.custom,
             enabled = TRUE,
             updated_at = NOW()`,
        [
          form,
          fieldName,
          sisuFieldName,
          clean(patch.sisuFieldType),
          Boolean(patch.custom),
        ],
      );
    } else {
      await client.query(
        `UPDATE form_sisu_mappings
         SET sisu_field_name = NULL, sisu_field_type = NULL,
             custom = FALSE, enabled = FALSE, updated_at = NOW()
         WHERE form = $1 AND field_name = $2`,
        [form, fieldName],
      );
    }

    if (personField) {
      await client.query(
        `INSERT INTO form_fub_person_mappings
           (form, field_name, fub_field_name, enabled)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (form, field_name) DO UPDATE
         SET fub_field_name = EXCLUDED.fub_field_name,
             enabled = TRUE,
             updated_at = NOW()`,
        [form, fieldName, personField],
      );
    } else {
      await client.query(
        `UPDATE form_fub_person_mappings
         SET fub_field_name = NULL, enabled = FALSE, updated_at = NOW()
         WHERE form = $1 AND field_name = $2`,
        [form, fieldName],
      );
    }

    if (dealField) {
      await client.query(
        `INSERT INTO form_fub_deal_mappings
           (form, field_name, fub_field_name, enabled)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (form, field_name) DO UPDATE
         SET fub_field_name = EXCLUDED.fub_field_name,
             enabled = TRUE,
             updated_at = NOW()`,
        [form, fieldName, dealField],
      );
    } else {
      await client.query(
        `UPDATE form_fub_deal_mappings
         SET fub_field_name = NULL, enabled = FALSE, updated_at = NOW()
         WHERE form = $1 AND field_name = $2`,
        [form, fieldName],
      );
    }

    await client.query("COMMIT");
    return { data: true, error: null };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to save mappings.",
    };
  } finally {
    client.release();
  }
}

export async function pruneFormFieldMappings(
  form: SettingsFormKind,
  fieldNames: readonly string[],
): Promise<StorageResult<number>> {
  if (fieldNames.length === 0) {
    return { data: 0, error: null };
  }

  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const [sisu, person, deal] = await Promise.all([
      poolResult.data.query(
        `DELETE FROM form_sisu_mappings WHERE form = $1 AND field_name = ANY($2::text[])`,
        [form, fieldNames],
      ),
      poolResult.data.query(
        `DELETE FROM form_fub_person_mappings WHERE form = $1 AND field_name = ANY($2::text[])`,
        [form, fieldNames],
      ),
      poolResult.data.query(
        `DELETE FROM form_fub_deal_mappings WHERE form = $1 AND field_name = ANY($2::text[])`,
        [form, fieldNames],
      ),
    ]);

    return {
      data:
        (sisu.rowCount ?? 0) +
        (person.rowCount ?? 0) +
        (deal.rowCount ?? 0),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to prune mappings.",
    };
  }
}

/**
 * Editor-created fields use generated `FieldBlock-*` ids. Delete mapping rows
 * for those ids when the field is no longer in the document, including fields
 * added and removed between publishes. Semantic legacy ids are never touched.
 */
export async function pruneOrphanEditorMappings(
  form: SettingsFormKind,
  validFieldNames: readonly string[],
): Promise<StorageResult<number>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const [sisu, person, deal] = await Promise.all([
      poolResult.data.query(
        `DELETE FROM form_sisu_mappings
         WHERE form = $1 AND field_name LIKE 'FieldBlock-%'
           AND NOT (field_name = ANY($2::text[]))`,
        [form, validFieldNames],
      ),
      poolResult.data.query(
        `DELETE FROM form_fub_person_mappings
         WHERE form = $1 AND field_name LIKE 'FieldBlock-%'
           AND NOT (field_name = ANY($2::text[]))`,
        [form, validFieldNames],
      ),
      poolResult.data.query(
        `DELETE FROM form_fub_deal_mappings
         WHERE form = $1 AND field_name LIKE 'FieldBlock-%'
           AND NOT (field_name = ANY($2::text[]))`,
        [form, validFieldNames],
      ),
    ]);

    return {
      data:
        (sisu.rowCount ?? 0) +
        (person.rowCount ?? 0) +
        (deal.rowCount ?? 0),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to prune mappings.",
    };
  }
}
