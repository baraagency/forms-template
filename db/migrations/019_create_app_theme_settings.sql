-- Single-row appearance settings for the deployment.
-- Product mapping: primary = structure (headings, labels, page wash, body text),
-- secondary = actions (primary CTA, selected states, action accents).
CREATE TABLE IF NOT EXISTS "public"."app_theme_settings" (
  "id" SMALLINT NOT NULL DEFAULT 1,
  "primary_color" TEXT NOT NULL,
  "secondary_color" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "app_theme_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "app_theme_settings_singleton" CHECK ("id" = 1),
  CONSTRAINT "app_theme_settings_hex" CHECK (
    "primary_color" ~ '^#[0-9a-f]{6}$' AND
    "secondary_color" ~ '^#[0-9a-f]{6}$'
  )
);

COMMENT ON TABLE "public"."app_theme_settings"
  IS 'Admin-selected primary (structure) and secondary (action) colors. Absence means template defaults.';

COMMENT ON COLUMN "public"."app_theme_settings"."primary_color"
  IS 'Structure color: headings, labels, body text, page wash. Maps to --palette-2.';

COMMENT ON COLUMN "public"."app_theme_settings"."secondary_color"
  IS 'Action color: primary CTA, selected states, action accents. Maps to --palette-1.';
