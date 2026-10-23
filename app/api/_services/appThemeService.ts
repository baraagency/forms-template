import {
  DEFAULT_APP_BRANDING,
  DEFAULT_THEME_SELECTION,
  buildThemeCss,
  normalizeHexColor,
  normalizeLogoAlt,
  normalizeLogoUrl,
  resolveAppTheme,
  type AppBranding,
  type ResolvedAppTheme,
  type ThemeSelection,
} from "@/app/theme/appTheme";
import { requireDbPool, type StorageResult } from "./dbPool";

export type AppThemePayload = {
  selection: ThemeSelection;
  resolved: ResolvedAppTheme;
  branding: AppBranding;
  css: string;
};

type AppThemeRow = {
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  logo_alt: string;
};

const CACHE_TTL_MS = 30_000;
const FALLBACK_TTL_MS = 5_000;
const QUERY_TIMEOUT_MS = 1_500;

let cached: { payload: AppThemePayload; expiresAt: number } | null = null;
let inFlight: Promise<AppThemePayload> | null = null;
let cacheVersion = 0;

function selectionFromRow(row: AppThemeRow | undefined): ThemeSelection {
  if (!row) {
    return DEFAULT_THEME_SELECTION;
  }

  return {
    primaryColor:
      normalizeHexColor(row.primary_color) ??
      DEFAULT_THEME_SELECTION.primaryColor,
    secondaryColor:
      normalizeHexColor(row.secondary_color) ??
      DEFAULT_THEME_SELECTION.secondaryColor,
  };
}

function brandingFromRow(row: AppThemeRow | undefined): AppBranding {
  if (!row) {
    return DEFAULT_APP_BRANDING;
  }

  return {
    logoUrl: normalizeLogoUrl(row.logo_url),
    logoAlt: normalizeLogoAlt(row.logo_alt),
  };
}

function buildPayload(
  selection: ThemeSelection,
  branding: AppBranding = DEFAULT_APP_BRANDING,
): AppThemePayload {
  const resolved = resolveAppTheme(selection);
  return {
    selection,
    resolved,
    branding,
    css: buildThemeCss(resolved),
  };
}

const DEFAULT_PAYLOAD = buildPayload(
  DEFAULT_THEME_SELECTION,
  DEFAULT_APP_BRANDING,
);

function cacheFallback(
  payload: AppThemePayload,
  version: number,
): AppThemePayload {
  if (version === cacheVersion) {
    cached = { payload, expiresAt: Date.now() + FALLBACK_TTL_MS };
  }
  return payload;
}

function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), milliseconds);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

async function loadThemeFromDb(version: number): Promise<AppThemePayload> {
  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return cacheFallback(DEFAULT_PAYLOAD, version);
  }

  try {
    const result = await withTimeout(
      poolResult.data.query<AppThemeRow>(
        `SELECT primary_color, secondary_color, logo_url, logo_alt
         FROM app_theme_settings
         WHERE id = 1
         LIMIT 1`,
      ),
      QUERY_TIMEOUT_MS,
    );

    if (!result) {
      return cacheFallback(DEFAULT_PAYLOAD, version);
    }

    const row = result.rows[0];
    const payload = buildPayload(
      selectionFromRow(row),
      brandingFromRow(row),
    );
    if (version === cacheVersion) {
      cached = { payload, expiresAt: Date.now() + CACHE_TTL_MS };
    }
    return payload;
  } catch {
    return cacheFallback(DEFAULT_PAYLOAD, version);
  }
}

/**
 * Current appearance for this deployment. Falls back to the template tokens
 * when the database is unavailable; never throws during rendering.
 */
export async function getAppTheme(): Promise<AppThemePayload> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  if (inFlight) {
    return inFlight;
  }

  const version = cacheVersion;
  const promise = loadThemeFromDb(version).finally(() => {
    if (inFlight === promise) {
      inFlight = null;
    }
  });
  inFlight = promise;
  return promise;
}

export function invalidateAppThemeCache(): void {
  cached = null;
  inFlight = null;
  cacheVersion += 1;
}

export async function saveAppTheme(
  selection: ThemeSelection,
): Promise<StorageResult<AppThemePayload>> {
  const primaryColor = normalizeHexColor(selection.primaryColor);
  const secondaryColor = normalizeHexColor(selection.secondaryColor);

  if (!primaryColor || !secondaryColor) {
    return {
      data: null,
      error: "Primary and secondary colors must be hex values.",
    };
  }

  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return {
      data: null,
      error: poolResult.error ?? "Database unavailable.",
    };
  }

  try {
    const result = await poolResult.data.query<AppThemeRow>(
      `INSERT INTO app_theme_settings
         (id, primary_color, secondary_color, updated_at)
       VALUES (1, $1, $2, NOW())
       ON CONFLICT (id) DO UPDATE SET
         primary_color = EXCLUDED.primary_color,
         secondary_color = EXCLUDED.secondary_color,
         updated_at = NOW()
       RETURNING primary_color, secondary_color, logo_url, logo_alt`,
      [primaryColor, secondaryColor],
    );

    const row = result.rows[0];
    const payload = buildPayload(
      selectionFromRow(row),
      brandingFromRow(row),
    );
    invalidateAppThemeCache();
    cached = { payload, expiresAt: Date.now() + CACHE_TTL_MS };
    return { data: payload, error: null };
  } catch (error) {
    invalidateAppThemeCache();
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save appearance settings.",
    };
  }
}

export async function saveAppBranding(
  branding: AppBranding,
): Promise<StorageResult<AppThemePayload>> {
  const rawLogoUrl = branding.logoUrl?.trim() ?? "";
  const logoUrl = rawLogoUrl ? normalizeLogoUrl(rawLogoUrl) : null;

  if (rawLogoUrl && !logoUrl) {
    return {
      data: null,
      error: "Logo URL must be an absolute http(s) URL.",
    };
  }

  const logoAlt = normalizeLogoAlt(branding.logoAlt);

  const poolResult = requireDbPool();
  if (poolResult.error || !poolResult.data) {
    return {
      data: null,
      error: poolResult.error ?? "Database unavailable.",
    };
  }

  try {
    const result = await poolResult.data.query<AppThemeRow>(
      `INSERT INTO app_theme_settings
         (id, primary_color, secondary_color, logo_url, logo_alt, updated_at)
       VALUES (1, $1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET
         logo_url = EXCLUDED.logo_url,
         logo_alt = EXCLUDED.logo_alt,
         updated_at = NOW()
       RETURNING primary_color, secondary_color, logo_url, logo_alt`,
      [
        DEFAULT_THEME_SELECTION.primaryColor,
        DEFAULT_THEME_SELECTION.secondaryColor,
        logoUrl,
        logoAlt,
      ],
    );

    const row = result.rows[0];
    const payload = buildPayload(
      selectionFromRow(row),
      brandingFromRow(row),
    );
    invalidateAppThemeCache();
    cached = { payload, expiresAt: Date.now() + CACHE_TTL_MS };
    return { data: payload, error: null };
  } catch (error) {
    invalidateAppThemeCache();
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save branding settings.",
    };
  }
}
