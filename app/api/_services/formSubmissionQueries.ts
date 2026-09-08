import type {
  FormKind,
  FormSubmission,
  FormSubmissionInsert,
  JsonValue,
} from "@/app/types/storage";
import { requireDbPool, type StorageResult } from "./dbPool";

export async function insertFormSubmission(
  input: FormSubmissionInsert,
): Promise<StorageResult<FormSubmission>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormSubmission>(
      `INSERT INTO form_submissions
         (form, lead_fub_id, deal_fub_id, form_data, lead_type, appointment_id, successful)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at, form, lead_fub_id, deal_fub_id, form_data,
                 lead_type, appointment_id, successful`,
      [
        input.form,
        input.lead_fub_id ?? null,
        input.deal_fub_id ?? null,
        input.form_data ?? null,
        input.lead_type ?? null,
        input.appointment_id ?? null,
        input.successful ?? null,
      ],
    );
    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to insert form submission.",
    };
  }
}

export async function updateFormSubmission(
  id: number,
  patch: {
    deal_fub_id?: number | null;
    appointment_id?: string | null;
    successful?: boolean | null;
    form_data?: JsonValue | null;
    lead_type?: string | null;
  },
): Promise<StorageResult<FormSubmission>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if ("deal_fub_id" in patch) {
    sets.push(`deal_fub_id = $${idx++}`);
    values.push(patch.deal_fub_id ?? null);
  }
  if ("appointment_id" in patch) {
    sets.push(`appointment_id = $${idx++}`);
    values.push(patch.appointment_id ?? null);
  }
  if ("successful" in patch) {
    sets.push(`successful = $${idx++}`);
    values.push(patch.successful ?? null);
  }
  if ("form_data" in patch) {
    sets.push(`form_data = $${idx++}`);
    values.push(patch.form_data ?? null);
  }
  if ("lead_type" in patch) {
    sets.push(`lead_type = $${idx++}`);
    values.push(patch.lead_type ?? null);
  }

  if (sets.length === 0) {
    return { data: null, error: "No form submission fields to update." };
  }

  values.push(id);

  try {
    const result = await poolResult.data.query<FormSubmission>(
      `UPDATE form_submissions
       SET ${sets.join(", ")}
       WHERE id = $${idx}
       RETURNING id, created_at, form, lead_fub_id, deal_fub_id, form_data,
                 lead_type, appointment_id, successful`,
      values,
    );

    if (result.rows.length === 0) {
      return { data: null, error: "Form submission not found." };
    }

    return { data: result.rows[0], error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update form submission.",
    };
  }
}

/**
 * Find the most recent successful appointment-set submission for a deal
 * that stored a FUB appointment id (used by appointment-met updates).
 */
export async function findLatestAppointmentIdByDealFubId(
  dealFubId: number,
): Promise<StorageResult<string | null>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<{ appointment_id: string | null }>(
      `SELECT appointment_id
       FROM form_submissions
       WHERE form = 'appointmentSet'
         AND deal_fub_id = $1
         AND appointment_id IS NOT NULL
         AND appointment_id <> ''
         AND (successful IS NULL OR successful = TRUE)
       ORDER BY created_at DESC
       LIMIT 1`,
      [dealFubId],
    );
    const appointmentId = result.rows[0]?.appointment_id?.trim() || null;
    return { data: appointmentId, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load prior appointment id.",
    };
  }
}

export type { FormKind, FormSubmission };

export async function findLatestFormSubmissionByDealFubId(
  dealFubId: number,
): Promise<StorageResult<FormSubmission | null>> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return { data: null, error: poolResult.error ?? "Database unavailable." };
  }

  try {
    const result = await poolResult.data.query<FormSubmission>(
      `SELECT id, created_at, form, lead_fub_id, deal_fub_id, form_data,
              lead_type, appointment_id, successful
       FROM form_submissions
       WHERE (deal_fub_id = $1 OR form_data->>'dealId' = $1::text)
         AND (successful IS NULL OR successful = TRUE)
       ORDER BY
         CASE
           WHEN COALESCE(TRIM(form_data->>'sisuTransactionId'), '') ~ '^[0-9]+$'
             AND (form_data->>'sisuTransactionId')::numeric > 0
           THEN 0
           ELSE 1
         END,
         created_at DESC
       LIMIT 1`,
      [dealFubId],
    );

    return { data: result.rows[0] ?? null, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load prior form submission.",
    };
  }
}
