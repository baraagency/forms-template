CREATE TABLE IF NOT EXISTS "app_audit_log" (
  "id" BIGSERIAL PRIMARY KEY,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "event_type" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'info',
  "deal_fub_id" INTEGER,
  "lead_fub_id" INTEGER,
  "submission_id" INTEGER,
  "message" TEXT NOT NULL,
  "metadata" JSONB
);

CREATE INDEX IF NOT EXISTS "ix_audit_log_created_at"
  ON "app_audit_log" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "ix_audit_log_event_type"
  ON "app_audit_log" ("event_type");

CREATE INDEX IF NOT EXISTS "ix_audit_log_deal_fub_id"
  ON "app_audit_log" ("deal_fub_id");

CREATE INDEX IF NOT EXISTS "ix_audit_log_submission_id"
  ON "app_audit_log" ("submission_id");
