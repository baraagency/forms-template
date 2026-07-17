-- Unified SISU field mappings per form.
-- Expected "form" values: pending, closed, agreementSigned, appointmentSet, appointmentMet.
CREATE TABLE IF NOT EXISTS "form_sisu_mappings" (
  "id" BIGSERIAL PRIMARY KEY,
  "form" TEXT NOT NULL,
  "field_name" TEXT NOT NULL,
  "sisu_field_name" TEXT,
  "sisu_field_type" TEXT,
  "custom" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("form", "field_name")
);

CREATE INDEX IF NOT EXISTS "ix_form_sisu_mappings_form"
  ON "form_sisu_mappings" ("form");
