-- Per-client-type FUB tags (Buyer / Seller), matching form_fub_stages.client_type.
ALTER TABLE "form_fub_tags"
  ADD COLUMN IF NOT EXISTS "client_type" TEXT;

DROP INDEX IF EXISTS "ix_form_fub_tags_form_tag_lower";

CREATE UNIQUE INDEX IF NOT EXISTS "ix_form_fub_tags_form_client_type_tag_lower"
  ON "form_fub_tags" ("form", "client_type", lower("tag"))
  NULLS NOT DISTINCT;
