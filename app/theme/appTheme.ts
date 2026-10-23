import { designTokens } from "@/app/generated/design-tokens";
import {
  WHITE,
  chooseReadableTextOnFill,
  darkenUntilContrast,
  hexToRgb,
  hslToRgb,
  isChromatic,
  mixHex,
  mixRgb,
  normalizeHexColor,
  pickReadableTextColor,
  rgbToHex,
  rgbToHsl,
  type RgbColor,
} from "./colorMath";

export { normalizeHexColor };

export type ThemeSelection = {
  /** Structure: headings, labels, page wash, body text. Maps to --palette-2. */
  primaryColor: string;
  /** Actions: primary CTA, selected states, action accents. Maps to --palette-1. */
  secondaryColor: string;
};

export type AppBranding = {
  /** Absolute http(s) URL for the hosted logo; null uses /logo-banner.png. */
  logoUrl: string | null;
  logoAlt: string;
};

export const DEFAULT_APP_BRANDING: AppBranding = {
  logoUrl: null,
  logoAlt: "Bara Agency",
};

export const MAX_LOGO_URL_LENGTH = 2048;
export const MAX_LOGO_ALT_LENGTH = 200;

/** Accepts absolute http(s) URLs only; never fetches the URL server-side. */
export function normalizeLogoUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_LOGO_URL_LENGTH) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function normalizeLogoAlt(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_APP_BRANDING.logoAlt;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_APP_BRANDING.logoAlt;
  }

  return trimmed.slice(0, MAX_LOGO_ALT_LENGTH);
}

export type ResolvedAppTheme = {
  structure: string;
  structureText: string;
  action: string;
  actionText: string;
  /** Selected-state hover: darkens for white labels, lightens for dark labels. */
  actionHover: string;
  accent: string;
  accentSoft: string;
  background: string;
  body: string;
  placeholder: string;
  iconMuted: string;
  successBg: string;
  successColor: string;
  warningBg: string;
  warningColor: string;
  cardBg: string;
  error: string;
  /** Border for summary-email / FUB-note tables. */
  emailBorder: string;
  isDefault: boolean;
};

const CARD_BG = designTokens.cardBg;
const ERROR_COLOR = designTokens.palette3;
const PAGE_WASH_AMOUNT = 0.06;
// Structure text targets more headroom so hover tints (up to 14% action)
// still clear WCAG AA; body targets 6.0 for accent hover tints; action and
// status text target 5.5.
const STRUCTURE_CONTRAST = 6.5;
const BODY_CONTRAST = 6.0;
const ACTION_CONTRAST = 5.5;
const STATUS_CONTRAST = 5.5;
const FOCUS_CONTRAST = 3.15;

export const DEFAULT_THEME_SELECTION: ThemeSelection = {
  primaryColor: designTokens.palette2,
  secondaryColor: designTokens.palette1,
};

function buildDefaultTheme(): ResolvedAppTheme {
  const structure = hexToRgb(designTokens.palette2) ?? { r: 0, g: 58, b: 85 };

  return {
    structure: designTokens.palette2,
    structureText: pickReadableTextColor(structure),
    action: designTokens.palette1,
    actionText: designTokens.btnPrimaryColor,
    actionHover: mixHex(designTokens.palette1, "#000000", 0.22),
    accent: designTokens.brandSky,
    accentSoft: designTokens.brandSkySoft,
    background: designTokens.background,
    body: designTokens.bodyColor,
    placeholder: designTokens.placeholderColor,
    iconMuted: designTokens.iconMuted,
    successBg: mixHex(designTokens.cardBg, designTokens.brandSky, 0.14),
    successColor: designTokens.palette2,
    warningBg: mixHex(designTokens.cardBg, designTokens.palette1, 0.12),
    warningColor: mixHex(designTokens.palette3, "#000000", 0.15),
    cardBg: designTokens.cardBg,
    error: designTokens.palette3,
    emailBorder: "#b8d4e3",
    isDefault: true,
  };
}

export const DEFAULT_RESOLVED_THEME: ResolvedAppTheme = buildDefaultTheme();

function pickAccentBase(
  primary: RgbColor,
  secondary: RgbColor,
): RgbColor {
  if (isChromatic(secondary)) {
    return secondary;
  }

  if (isChromatic(primary)) {
    return primary;
  }

  return secondary;
}

/**
 * Resolves the two stored colors into every role token the app consumes.
 * Structure targets 6.5:1 (hover tints), body 6:1 (accent hover tints),
 * action/status 5.5:1, and the focus/UI accent 3.15:1. WCAG AA needs
 * 4.5:1 text and 3:1 UI. The exact
 * template pair short-circuits to the original token values.
 */
export function resolveAppTheme(selection: ThemeSelection): ResolvedAppTheme {
  const primaryHex =
    normalizeHexColor(selection.primaryColor) ??
    DEFAULT_THEME_SELECTION.primaryColor;
  const secondaryHex =
    normalizeHexColor(selection.secondaryColor) ??
    DEFAULT_THEME_SELECTION.secondaryColor;

  if (
    primaryHex === DEFAULT_THEME_SELECTION.primaryColor &&
    secondaryHex === DEFAULT_THEME_SELECTION.secondaryColor
  ) {
    return { ...DEFAULT_RESOLVED_THEME };
  }

  const primary = hexToRgb(primaryHex) ?? hexToRgb(designTokens.palette2)!;
  const secondary =
    hexToRgb(secondaryHex) ?? hexToRgb(designTokens.palette1)!;
  const card = hexToRgb(CARD_BG) ?? WHITE;

  const pageWash = mixRgb(WHITE, primary, PAGE_WASH_AMOUNT);
  const background = rgbToHex(pageWash);

  const structure = darkenUntilContrast(
    primary,
    [card, pageWash],
    STRUCTURE_CONTRAST,
  );
  const structureHex = rgbToHex(structure);

  const bodySource = mixRgb(structure, WHITE, 0.35);
  const body = darkenUntilContrast(
    bodySource,
    [card, pageWash],
    BODY_CONTRAST,
  );
  const bodyHex = rgbToHex(body);

  const actionResult = chooseReadableTextOnFill(secondary, ACTION_CONTRAST);
  const actionHex = rgbToHex(actionResult.fill);
  const actionHover =
    actionResult.text === "#ffffff"
      ? mixHex(actionHex, "#000000", 0.18)
      : mixHex(actionHex, "#ffffff", 0.18);

  const accentBase = pickAccentBase(primary, secondary);
  const accentHsl = rgbToHsl(accentBase);
  const accentMid = hslToRgb({
    h: accentHsl.h,
    s: isChromatic(accentBase)
      ? Math.min(1, Math.max(accentHsl.s, 0.55))
      : 0,
    l: 0.5,
  });
  const accent = rgbToHex(
    darkenUntilContrast(accentMid, [card, pageWash], FOCUS_CONTRAST),
  );
  const accentSoft = mixHex(CARD_BG, accent, 0.12);

  const successBgRgb = mixRgb(
    WHITE,
    hexToRgb(accent) ?? secondary,
    0.12,
  );
  const successBg = rgbToHex(successBgRgb);
  const successColor = rgbToHex(
    darkenUntilContrast(structure, [successBgRgb], STATUS_CONTRAST),
  );

  // Structure-derived tint stays visible even when the action color is near-white.
  const warningBgRgb = mixRgb(WHITE, structure, 0.08);
  const warningBg = rgbToHex(warningBgRgb);
  const errorRgb = hexToRgb(ERROR_COLOR) ?? { r: 64, g: 64, b: 64 };
  const warningColor = rgbToHex(
    darkenUntilContrast(errorRgb, [warningBgRgb], STATUS_CONTRAST),
  );

  return {
    structure: structureHex,
    structureText: pickReadableTextColor(structure),
    action: actionHex,
    actionText: actionResult.text,
    actionHover,
    accent,
    accentSoft,
    background,
    body: bodyHex,
    placeholder: bodyHex,
    iconMuted: bodyHex,
    successBg,
    successColor,
    warningBg,
    warningColor,
    cardBg: CARD_BG,
    error: ERROR_COLOR,
    emailBorder: mixHex(CARD_BG, accent, 0.3),
    isDefault: false,
  };
}

/** CSS custom properties written by the root loader. */
export function buildThemeCss(theme: ResolvedAppTheme): string {
  const entries: Array<[string, string]> = [
    ["--palette-2", theme.structure],
    ["--palette-1", theme.action],
    ["--brand-cyan-dark", theme.actionHover],
    ["--brand-sky", theme.accent],
    ["--brand-sky-soft", theme.accentSoft],
    ["--background", theme.background],
    ["--body-color", theme.body],
    ["--placeholder-color", theme.placeholder],
    ["--icon-muted", theme.iconMuted],
    ["--btn-primary-color", theme.actionText],
    ["--success-bg", theme.successBg],
    ["--success-color", theme.successColor],
    ["--warning-bg", theme.warningBg],
    ["--warning-color", theme.warningColor],
  ];

  const declarations = entries
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");

  return `:root:root {\n${declarations}\n}`;
}

export const DEFAULT_THEME_CSS = buildThemeCss(DEFAULT_RESOLVED_THEME);

/** Preview variables for a scoped element (not :root). */
export function getThemePreviewVars(
  theme: ResolvedAppTheme,
): Record<string, string> {
  return {
    "--palette-2": theme.structure,
    "--palette-1": theme.action,
    "--brand-sky": theme.accent,
    "--brand-sky-soft": theme.accentSoft,
    "--background": theme.background,
    "--body-color": theme.body,
    "--placeholder-color": theme.placeholder,
    "--icon-muted": theme.iconMuted,
    "--btn-primary-color": theme.actionText,
    "--card-bg": theme.cardBg,
    "--error-color": theme.error,
  };
}

