-- Per-form FUB tags applied on submit (future workflows).
CREATE TABLE IF NOT EXISTS "form_fub_tags" (
  "id" BIGSERIAL PRIMARY KEY,
  "form" TEXT NOT NULL,
  "tag" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "ix_form_fub_tags_form_tag_lower"
  ON "form_fub_tags" ("form", lower("tag"));

CREATE INDEX IF NOT EXISTS "ix_form_fub_tags_form"
  ON "form_fub_tags" ("form");
