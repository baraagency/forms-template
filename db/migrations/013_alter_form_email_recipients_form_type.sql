-- Migrate form_email_recipients from form_types text[] + unique email
-- to form_type text (one row per form), with non-unique emails.
-- Idempotent for DBs that already have form_type from a fresh 005.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_email_recipients'
      AND column_name = 'form_types'
  ) THEN
    ALTER TABLE public.form_email_recipients
      ADD COLUMN IF NOT EXISTS form_type text;

    WITH expanded AS (
      SELECT
        r.id,
        r.created_at,
        r.email,
        r.active,
        r.environment,
        u.form_type,
        u.ordinality
      FROM public.form_email_recipients r
      CROSS JOIN LATERAL unnest(r.form_types)
        WITH ORDINALITY AS u(form_type, ordinality)
      WHERE cardinality(r.form_types) > 0
    ),
    first_types AS (
      SELECT DISTINCT ON (id) id, form_type
      FROM expanded
      ORDER BY id, ordinality
    )
    UPDATE public.form_email_recipients AS r
    SET form_type = first_types.form_type
    FROM first_types
    WHERE r.id = first_types.id
      AND (r.form_type IS NULL OR r.form_type = '');

    INSERT INTO public.form_email_recipients (
      created_at, email, form_type, active, environment
    )
    SELECT
      e.created_at,
      e.email,
      e.form_type,
      e.active,
      e.environment
    FROM (
      SELECT
        r.id,
        r.created_at,
        r.email,
        r.active,
        r.environment,
        u.form_type,
        u.ordinality
      FROM public.form_email_recipients r
      CROSS JOIN LATERAL unnest(r.form_types)
        WITH ORDINALITY AS u(form_type, ordinality)
      WHERE cardinality(r.form_types) > 0
    ) e
    WHERE e.ordinality > 1;

    UPDATE public.form_email_recipients
    SET form_type = 'pending'
    WHERE form_type IS NULL OR form_type = '';

    ALTER TABLE public.form_email_recipients
      ALTER COLUMN form_type SET NOT NULL;

    ALTER TABLE public.form_email_recipients
      DROP COLUMN form_types;
  END IF;
END $$;

DROP INDEX IF EXISTS form_email_recipients_environment_email_key;

CREATE INDEX IF NOT EXISTS form_email_recipients_environment_idx
  ON public.form_email_recipients USING btree (environment);

CREATE INDEX IF NOT EXISTS form_email_recipients_environment_form_type_idx
  ON public.form_email_recipients USING btree (environment, form_type);
