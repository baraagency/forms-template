-- Form field → FUB deal API field mappings.
CREATE TABLE IF NOT EXISTS "form_fub_deal_mappings" (
  "id" BIGSERIAL PRIMARY KEY,
  "form" TEXT NOT NULL,
  "field_name" TEXT NOT NULL,
  "fub_field_name" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("form", "field_name")
);

CREATE INDEX IF NOT EXISTS "ix_form_fub_deal_mappings_form"
  ON "form_fub_deal_mappings" ("form");
