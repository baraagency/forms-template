-- Hosted logo/banner used by the app header, summary emails, and FUB notes.
-- Null logo_url means the built-in /logo-banner.png; logo_alt falls back to
-- "Bara Agency" when blank.
ALTER TABLE "public"."app_theme_settings"
  ADD COLUMN IF NOT EXISTS "logo_url" TEXT,
  ADD COLUMN IF NOT EXISTS "logo_alt" TEXT NOT NULL DEFAULT 'Bara Agency';

COMMENT ON COLUMN "public"."app_theme_settings"."logo_url"
  IS 'Absolute http(s) URL for the hosted logo; NULL uses /logo-banner.png.';

COMMENT ON COLUMN "public"."app_theme_settings"."logo_alt"
  IS 'Accessible alt text for the header logo and summary-email/FUB-note logo.';
