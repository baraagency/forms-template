-- Add enabled flag so settings can keep disabled mapping templates.
ALTER TABLE "form_sisu_mappings"
  ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS "ix_form_sisu_mappings_form_enabled"
  ON "form_sisu_mappings" ("form", "enabled");
