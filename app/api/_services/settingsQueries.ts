import type {
  FormEmailRecipient,
  FormFubDealMapping,
  FormFubPersonMapping,
  FormFubStage,
  FormFubTag,
  FormKind,
  FormSisuMapping,
  FubStageTarget,
  GmailAccountCredential,
} from "@/app/types/storage";
import { isSettingsFormKind } from "@/app/forms/_core/formIdentity";
import {
  isLockedClientTypeSisuMapping,
  sortByFormFieldAppearanceOrder,
} from "@/app/forms/settings/formFieldCatalog";
import { requireDbPool, type StorageResult } from "./dbPool";

export async function getGmailCredentialForEnvironment(
  environment: string,
): Promise<StorageResult<GmailAccountCredential | null>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<GmailAccountCredential>(
      `SELECT id, created_at, updated_at, environment, email, refresh_token,
              access_token, expiry_date, active
       FROM gmail_account_credentials
       WHERE environment = $1
       LIMIT 1`,
      [environment],
    );
    return { data: result.rows[0] ?? null, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to load Gmail credential.",
    };
  }
}

export async function upsertGmailCredential(input: {
  environment: string;
  email: string;
  refresh_token: string;
  access_token?: string | null;
  expiry_date?: Date | null;
}): Promise<StorageResult<GmailAccountCredential>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<GmailAccountCredential>(
      `INSERT INTO gmail_account_credentials
         (environment, email, refresh_token, access_token, expiry_date, active, updated_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
       ON CONFLICT (environment) DO UPDATE SET
         email = EXCLUDED.email,
         refresh_token = EXCLUDED.refresh_token,
         access_token = EXCLUDED.access_token,
         expiry_date = EXCLUDED.expiry_date,
         active = TRUE,
         updated_at = NOW()
       RETURNING id, created_at, updated_at, environment, email, refresh_token,
                 access_token, expiry_date, active`,
      [
        input.environment,
        input.email,
        input.refresh_token,
        input.access_token ?? null,
        input.expiry_date ?? null,
      ],
    );
    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to save Gmail credential.",
    };
  }
}

export async function deactivateGmailCredential(
  environment: string,
): Promise<StorageResult<boolean>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    await poolResult.data.query(
      `DELETE FROM gmail_account_credentials WHERE environment = $1`,
      [environment],
    );
    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to disconnect Gmail credential.",
    };
  }
}

export async function listEmailRecipients(
  environment: string,
  formType?: string,
): Promise<StorageResult<FormEmailRecipient[]>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = formType
      ? await poolResult.data.query<FormEmailRecipient>(
          `SELECT id, created_at, email, form_type, active, environment
           FROM form_email_recipients
           WHERE environment = $1 AND form_type = $2
           ORDER BY lower(email) ASC, id ASC`,
          [environment, formType],
        )
      : await poolResult.data.query<FormEmailRecipient>(
          `SELECT id, created_at, email, form_type, active, environment
           FROM form_email_recipients
           WHERE environment = $1
           ORDER BY form_type ASC, lower(email) ASC, id ASC`,
          [environment],
        );
    return { data: result.rows, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to list recipients.",
    };
  }
}

export async function createEmailRecipient(input: {
  environment: string;
  email: string;
  form_type: string;
  active?: boolean;
}): Promise<StorageResult<FormEmailRecipient>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormEmailRecipient>(
      `INSERT INTO form_email_recipients (environment, email, form_type, active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at, email, form_type, active, environment`,
      [
        input.environment,
        input.email.trim().toLowerCase(),
        input.form_type,
        input.active ?? true,
      ],
    );
    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to create recipient.",
    };
  }
}

export async function updateEmailRecipient(
  id: number,
  environment: string,
  patch: {
    email?: string;
    form_type?: string;
    active?: boolean;
  },
): Promise<StorageResult<FormEmailRecipient>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormEmailRecipient>(
      `UPDATE form_email_recipients
       SET email = COALESCE($3, email),
           form_type = COALESCE($4, form_type),
           active = COALESCE($5, active)
       WHERE id = $1 AND environment = $2
       RETURNING id, created_at, email, form_type, active, environment`,
      [
        id,
        environment,
        patch.email?.trim().toLowerCase() ?? null,
        patch.form_type ?? null,
        patch.active ?? null,
      ],
    );

    if (result.rows.length === 0) {
      return { data: null, error: "Recipient not found." };
    }

    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to update recipient.",
    };
  }
}

export async function deleteEmailRecipient(
  id: number,
  environment: string,
): Promise<StorageResult<boolean>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query(
      `DELETE FROM form_email_recipients WHERE id = $1 AND environment = $2`,
      [id, environment],
    );
    if ((result.rowCount ?? 0) === 0) {
      return { data: null, error: "Recipient not found." };
    }
    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to delete recipient.",
    };
  }
}

export async function listSisuMappings(
  form: FormKind,
): Promise<StorageResult<FormSisuMapping[]>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormSisuMapping>(
      `SELECT id, form, field_name, sisu_field_name, sisu_field_type, custom, enabled,
              created_at, updated_at
       FROM form_sisu_mappings
       WHERE form = $1
       ORDER BY field_name ASC`,
      [form],
    );
    const rows = isSettingsFormKind(form)
      ? sortByFormFieldAppearanceOrder(form, result.rows)
      : result.rows;
    return { data: rows, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to list SISU mappings.",
    };
  }
}

export async function updateSisuMapping(
  id: number,
  patch: {
    sisu_field_name?: string | null;
    sisu_field_type?: string | null;
    custom?: boolean;
    enabled?: boolean;
  },
): Promise<StorageResult<FormSisuMapping>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const existing = await poolResult.data.query<{
      form: string;
      field_name: string;
    }>(`SELECT form, field_name FROM form_sisu_mappings WHERE id = $1`, [id]);
    const row = existing.rows[0];
    if (!row) {
      return { data: null, error: "SISU mapping not found." };
    }
    if (
      isSettingsFormKind(row.form) &&
      isLockedClientTypeSisuMapping(row.form, row.field_name)
    ) {
      return {
        data: null,
        error: "The Client Type mapping is fixed and cannot be edited.",
      };
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to load SISU mapping.",
    };
  }

  const sets: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;

  if ("sisu_field_name" in patch) {
    sets.push(`sisu_field_name = $${++idx}`);
    values.push(patch.sisu_field_name);
  }
  if ("sisu_field_type" in patch) {
    sets.push(`sisu_field_type = $${++idx}`);
    values.push(patch.sisu_field_type);
  }
  if ("custom" in patch && patch.custom !== undefined) {
    sets.push(`custom = $${++idx}`);
    values.push(patch.custom);
  }
  if ("enabled" in patch && patch.enabled !== undefined) {
    sets.push(`enabled = $${++idx}`);
    values.push(patch.enabled);
  }

  if (sets.length === 1) {
    return { data: null, error: "No SISU mapping fields to update." };
  }

  try {
    const result = await poolResult.data.query<FormSisuMapping>(
      `UPDATE form_sisu_mappings SET ${sets.join(", ")}
       WHERE id = $1
       RETURNING id, form, field_name, sisu_field_name, sisu_field_type, custom, enabled,
                 created_at, updated_at`,
      [id, ...values],
    );

    if (result.rows.length === 0) {
      return { data: null, error: "SISU mapping not found." };
    }

    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to update SISU mapping.",
    };
  }
}

export async function listFubStages(
  form: FormKind,
): Promise<StorageResult<FormFubStage[]>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormFubStage>(
      `SELECT id, form, target, client_type, stage_id, stage_name, enabled,
              created_at, updated_at
       FROM form_fub_stages
       WHERE form = $1
       ORDER BY target ASC, stage_id ASC`,
      [form],
    );
    return { data: result.rows, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to list FUB stages.",
    };
  }
}

/**
 * Sets the single desired stage for a form + target + client type.
 * Clears prior desired stages for that triple, then inserts the new row when provided.
 */
export async function setDesiredFubStage(input: {
  form: FormKind;
  target: FubStageTarget;
  client_type: string | null;
  stage_id: number | null;
  stage_name?: string | null;
}): Promise<StorageResult<FormFubStage | null>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  const client = await poolResult.data.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM form_fub_stages
       WHERE form = $1 AND target = $2 AND client_type IS NOT DISTINCT FROM $3`,
      [input.form, input.target, input.client_type],
    );

    if (input.stage_id === null) {
      await client.query("COMMIT");
      return { data: null, error: null };
    }

    const result = await client.query<FormFubStage>(
      `INSERT INTO form_fub_stages
         (form, target, client_type, stage_id, stage_name, enabled)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, form, target, client_type, stage_id, stage_name, enabled,
                 created_at, updated_at`,
      [
        input.form,
        input.target,
        input.client_type,
        input.stage_id,
        input.stage_name?.trim() || null,
      ],
    );
    await client.query("COMMIT");
    return { data: result.rows[0] ?? null, error: null };
  } catch (error) {
    await client.query("ROLLBACK");
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to set FUB stage.",
    };
  } finally {
    client.release();
  }
}

export async function createFubStage(input: {
  form: FormKind;
  target: FubStageTarget;
  client_type?: string | null;
  stage_id: number;
  stage_name?: string | null;
  enabled?: boolean;
}): Promise<StorageResult<FormFubStage>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormFubStage>(
      `INSERT INTO form_fub_stages
         (form, target, client_type, stage_id, stage_name, enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, form, target, client_type, stage_id, stage_name, enabled,
                 created_at, updated_at`,
      [
        input.form,
        input.target,
        input.client_type?.trim() || null,
        input.stage_id,
        input.stage_name?.trim() || null,
        input.enabled ?? true,
      ],
    );
    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create FUB stage.",
    };
  }
}

export async function updateFubStage(
  id: number,
  patch: {
    target?: FubStageTarget;
    client_type?: string | null;
    stage_id?: number;
    stage_name?: string | null;
    enabled?: boolean;
  },
): Promise<StorageResult<FormFubStage>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  const sets: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;

  if (patch.target !== undefined) {
    sets.push(`target = $${++idx}`);
    values.push(patch.target);
  }
  if ("client_type" in patch) {
    sets.push(`client_type = $${++idx}`);
    values.push(patch.client_type?.trim() || null);
  }
  if (patch.stage_id !== undefined) {
    sets.push(`stage_id = $${++idx}`);
    values.push(patch.stage_id);
  }
  if ("stage_name" in patch) {
    sets.push(`stage_name = $${++idx}`);
    values.push(patch.stage_name?.trim() || null);
  }
  if (patch.enabled !== undefined) {
    sets.push(`enabled = $${++idx}`);
    values.push(patch.enabled);
  }

  try {
    const result = await poolResult.data.query<FormFubStage>(
      `UPDATE form_fub_stages SET ${sets.join(", ")}
       WHERE id = $1
       RETURNING id, form, target, client_type, stage_id, stage_name, enabled,
                 created_at, updated_at`,
      [id, ...values],
    );
    if (result.rows.length === 0) {
      return { data: null, error: "FUB stage not found." };
    }
    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update FUB stage.",
    };
  }
}

export async function deleteFubStage(id: number): Promise<StorageResult<boolean>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query(
      `DELETE FROM form_fub_stages WHERE id = $1`,
      [id],
    );
    if ((result.rowCount ?? 0) === 0) {
      return { data: null, error: "FUB stage not found." };
    }
    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to delete FUB stage.",
    };
  }
}

export async function listFubTags(
  form: FormKind,
): Promise<StorageResult<FormFubTag[]>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormFubTag>(
      `SELECT id, form, client_type, tag, enabled, created_at, updated_at
       FROM form_fub_tags
       WHERE form = $1
       ORDER BY client_type ASC NULLS LAST, lower(tag) ASC`,
      [form],
    );
    return { data: result.rows, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to list FUB tags.",
    };
  }
}

export async function createFubTag(input: {
  form: FormKind;
  client_type: string | null;
  tag: string;
  enabled?: boolean;
}): Promise<StorageResult<FormFubTag>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormFubTag>(
      `INSERT INTO form_fub_tags (form, client_type, tag, enabled)
       VALUES ($1, $2, $3, $4)
       RETURNING id, form, client_type, tag, enabled, created_at, updated_at`,
      [input.form, input.client_type, input.tag.trim(), input.enabled ?? true],
    );
    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create FUB tag.",
    };
  }
}

export async function updateFubTag(
  id: number,
  patch: { tag?: string; enabled?: boolean },
): Promise<StorageResult<FormFubTag>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  const sets: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;

  if (patch.tag !== undefined) {
    sets.push(`tag = $${++idx}`);
    values.push(patch.tag.trim());
  }
  if (patch.enabled !== undefined) {
    sets.push(`enabled = $${++idx}`);
    values.push(patch.enabled);
  }

  try {
    const result = await poolResult.data.query<FormFubTag>(
      `UPDATE form_fub_tags SET ${sets.join(", ")}
       WHERE id = $1
       RETURNING id, form, client_type, tag, enabled, created_at, updated_at`,
      [id, ...values],
    );
    if (result.rows.length === 0) {
      return { data: null, error: "FUB tag not found." };
    }
    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update FUB tag.",
    };
  }
}

export async function deleteFubTag(id: number): Promise<StorageResult<boolean>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query(
      `DELETE FROM form_fub_tags WHERE id = $1`,
      [id],
    );
    if ((result.rowCount ?? 0) === 0) {
      return { data: null, error: "FUB tag not found." };
    }
    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to delete FUB tag.",
    };
  }
}

export async function replaceFubTagsForClientType(input: {
  form: FormKind;
  client_type: string | null;
  tags: string[];
}): Promise<StorageResult<FormFubTag[]>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  const normalizedTags = [
    ...new Set(
      input.tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    ),
  ].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );

  const client = await poolResult.data.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM form_fub_tags WHERE form = $1 AND client_type IS NOT DISTINCT FROM $2`,
      [input.form, input.client_type],
    );

    for (const tag of normalizedTags) {
      await client.query(
        `INSERT INTO form_fub_tags (form, client_type, tag, enabled)
         VALUES ($1, $2, $3, true)`,
        [input.form, input.client_type, tag],
      );
    }

    const result = await client.query<FormFubTag>(
      `SELECT id, form, client_type, tag, enabled, created_at, updated_at
       FROM form_fub_tags
       WHERE form = $1 AND client_type IS NOT DISTINCT FROM $2
       ORDER BY lower(tag) ASC`,
      [input.form, input.client_type],
    );
    await client.query("COMMIT");
    return { data: result.rows, error: null };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to replace FUB tags.",
    };
  } finally {
    client.release();
  }
}

async function listFieldMappings<T extends FormFubPersonMapping | FormFubDealMapping>(
  table: "form_fub_person_mappings" | "form_fub_deal_mappings",
  form: FormKind,
): Promise<StorageResult<T[]>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<T>(
      `SELECT id, form, field_name, fub_field_name, enabled, created_at, updated_at
       FROM ${table}
       WHERE form = $1
       ORDER BY field_name ASC`,
      [form],
    );
    const rows = isSettingsFormKind(form)
      ? sortByFormFieldAppearanceOrder(form, result.rows)
      : result.rows;
    return { data: rows, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : `Failed to list ${table}.`,
    };
  }
}

async function updateFieldMapping<T extends FormFubPersonMapping | FormFubDealMapping>(
  table: "form_fub_person_mappings" | "form_fub_deal_mappings",
  id: number,
  patch: { fub_field_name?: string | null; enabled?: boolean },
): Promise<StorageResult<T>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  const sets: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;

  if ("fub_field_name" in patch) {
    sets.push(`fub_field_name = $${++idx}`);
    values.push(patch.fub_field_name);
  }
  if (patch.enabled !== undefined) {
    sets.push(`enabled = $${++idx}`);
    values.push(patch.enabled);
  }

  try {
    const result = await poolResult.data.query<T>(
      `UPDATE ${table} SET ${sets.join(", ")}
       WHERE id = $1
       RETURNING id, form, field_name, fub_field_name, enabled, created_at, updated_at`,
      [id, ...values],
    );
    if (result.rows.length === 0) {
      return { data: null, error: "Mapping not found." };
    }
    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update mapping.",
    };
  }
}

export function listPersonMappings(form: FormKind) {
  return listFieldMappings<FormFubPersonMapping>("form_fub_person_mappings", form);
}

export function updatePersonMapping(
  id: number,
  patch: { fub_field_name?: string | null; enabled?: boolean },
) {
  return updateFieldMapping<FormFubPersonMapping>(
    "form_fub_person_mappings",
    id,
    patch,
  );
}

export function listDealMappings(form: FormKind) {
  return listFieldMappings<FormFubDealMapping>("form_fub_deal_mappings", form);
}

export function updateDealMapping(
  id: number,
  patch: { fub_field_name?: string | null; enabled?: boolean },
) {
  return updateFieldMapping<FormFubDealMapping>(
    "form_fub_deal_mappings",
    id,
    patch,
  );
}
