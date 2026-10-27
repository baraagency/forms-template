CREATE TABLE IF NOT EXISTS form_pages (
  form TEXT PRIMARY KEY,
  draft JSONB NOT NULL,
  published JSONB,
  schema_version INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_form_pages_published_at
  ON form_pages (published_at DESC NULLS LAST);
