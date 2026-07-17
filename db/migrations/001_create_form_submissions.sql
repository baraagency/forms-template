-- Unified form submissions.
-- Expected "form" values: pending, closed, agreementSigned, appointmentSet, appointmentMet.
CREATE TABLE IF NOT EXISTS "form_submissions" (
  "id" SERIAL PRIMARY KEY,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "form" TEXT NOT NULL,
  "lead_fub_id" INTEGER,
  "deal_fub_id" INTEGER,
  "form_data" JSONB,
  "lead_type" TEXT,
  "appointment_id" TEXT,
  "successful" BOOLEAN
);

CREATE INDEX IF NOT EXISTS "ix_form_submissions_form_created_at"
  ON "form_submissions" ("form", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "ix_form_submissions_deal_fub_id"
  ON "form_submissions" ("deal_fub_id");

CREATE INDEX IF NOT EXISTS "ix_form_submissions_lead_fub_id"
  ON "form_submissions" ("lead_fub_id");
