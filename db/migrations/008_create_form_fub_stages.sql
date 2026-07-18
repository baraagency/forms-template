-- Per-form FUB stage configuration (person or deal targets).
-- form = FormKind: pending | closed | appointmentSet | appointmentMet
CREATE TABLE IF NOT EXISTS "form_fub_stages" (
  "id" BIGSERIAL PRIMARY KEY,
  "form" TEXT NOT NULL,
  "target" TEXT NOT NULL CHECK ("target" IN ('person', 'deal')),
  "client_type" TEXT,
  "stage_id" INTEGER NOT NULL,
  "stage_name" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT ("form", "target", "client_type", "stage_id")
);

CREATE INDEX IF NOT EXISTS "ix_form_fub_stages_form"
  ON "form_fub_stages" ("form");
