import { describe, expect, test } from "bun:test";
import { designTokens } from "@/app/generated/design-tokens";
import {
  contrastRatio,
  mixHex,
  normalizeHexColor,
} from "../colorMath";
import {
  DEFAULT_APP_BRANDING,
  DEFAULT_RESOLVED_THEME,
  DEFAULT_THEME_CSS,
  DEFAULT_THEME_SELECTION,
  buildThemeCss,
  getThemePreviewVars,
  normalizeLogoAlt,
  normalizeLogoUrl,
  resolveAppTheme,
} from "../appTheme";

function expectContrast(
  foreground: string,
  background: string,
  minimum: number,
) {
  const ratio = contrastRatio(foreground, background);
  expect(ratio).toBeGreaterThanOrEqual(minimum);
}

describe("branding helpers", () => {
  test("accepts absolute http(s) logo URLs only", () => {
    expect(normalizeLogoUrl("https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
    expect(normalizeLogoUrl("http://localhost:3000/logo.png")).toBe(
      "http://localhost:3000/logo.png",
    );
    expect(normalizeLogoUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeLogoUrl("data:image/png;base64,abc")).toBeNull();
    expect(normalizeLogoUrl("/logo-banner.png")).toBeNull();
    expect(normalizeLogoUrl("")).toBeNull();
    expect(normalizeLogoUrl(null)).toBeNull();
  });

  test("normalizes alt text and falls back to the default", () => {
    expect(normalizeLogoAlt("")).toBe(DEFAULT_APP_BRANDING.logoAlt);
    expect(normalizeLogoAlt("  Acme Realty  ")).toBe("Acme Realty");
    expect(normalizeLogoAlt("x".repeat(250))).toHaveLength(200);
  });
});

const COLOR_GRID = [
  "#ffffff",
  "#000000",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#00ffff",
  "#808080",
  "#1e1e1e",
  "#003a55",
  "#f0f7fa",
  "#ffd700",
  "#0099cc",
  "#d4ecf7",
  "#4a6b7c",
  "#123456",
];

describe("normalizeHexColor", () => {
  test("expands shorthand and lowercases", () => {
    expect(normalizeHexColor("#ABC")).toBe("#aabbcc");
    expect(normalizeHexColor("#AABBCC")).toBe("#aabbcc");
    expect(normalizeHexColor("  #0099CC  ")).toBe("#0099cc");
  });

  test("rejects invalid values", () => {
    expect(normalizeHexColor("#abcd")).toBeNull();
    expect(normalizeHexColor("#12345")).toBeNull();
    expect(normalizeHexColor("red")).toBeNull();
    expect(normalizeHexColor("")).toBeNull();
    expect(normalizeHexColor(null)).toBeNull();
    expect(normalizeHexColor(123456)).toBeNull();
  });
});

describe("resolveAppTheme", () => {
  test("keeps the template tokens exactly for the default pair", () => {
    const theme = resolveAppTheme(DEFAULT_THEME_SELECTION);

    expect(theme.isDefault).toBe(true);
    expect(theme.structure).toBe(designTokens.palette2);
    expect(theme.action).toBe(designTokens.palette1);
    expect(theme.actionText).toBe(designTokens.btnPrimaryColor);
    expect(theme.actionHover).toBe(
      mixHex(designTokens.palette1, "#000000", 0.22),
    );
    expect(theme.accent).toBe(designTokens.brandSky);
    expect(theme.accentSoft).toBe(designTokens.brandSkySoft);
    expect(theme.background).toBe(designTokens.background);
    expect(theme.body).toBe(designTokens.bodyColor);
    expect(theme.placeholder).toBe(designTokens.placeholderColor);
    expect(theme.iconMuted).toBe(designTokens.iconMuted);
    expect(theme.cardBg).toBe(designTokens.cardBg);
    expect(theme.error).toBe(designTokens.palette3);
    expect(theme.emailBorder).toBe("#b8d4e3");
    expect(theme.successColor).toBe(designTokens.palette2);
  });

  test("falls back to defaults when stored colors are invalid", () => {
    const theme = resolveAppTheme({
      primaryColor: "not-a-color",
      secondaryColor: "also-not-a-color",
    });

    expect(theme.isDefault).toBe(true);
    expect(theme.structure).toBe(DEFAULT_RESOLVED_THEME.structure);
    expect(theme.action).toBe(DEFAULT_RESOLVED_THEME.action);
  });

  test("guarantees documented contrast pairs across a broad color grid", () => {
    for (const primaryColor of COLOR_GRID) {
      for (const secondaryColor of COLOR_GRID) {
        const theme = resolveAppTheme({ primaryColor, secondaryColor });

        expectContrast(theme.actionText, theme.action, 4.5);
        expectContrast(theme.actionText, theme.actionHover, 4.5);
        expectContrast(theme.structure, theme.cardBg, 4.5);
        expectContrast(theme.structure, theme.background, 4.5);
        expectContrast(theme.body, theme.cardBg, 4.5);
        expectContrast(theme.body, theme.background, 4.5);
        // Form-choice meta text on the 12% accent hover wash.
        expectContrast(
          theme.body,
          mixHex("#ffffff", theme.accent, 0.12),
          4.5,
        );
        expectContrast(theme.placeholder, theme.cardBg, 4.5);
        expectContrast(theme.iconMuted, theme.cardBg, 4.5);
        expectContrast(theme.accent, theme.cardBg, 3);
        expectContrast(theme.accent, theme.background, 3);
        expectContrast(theme.successColor, theme.successBg, 4.5);
        expectContrast(theme.warningColor, theme.warningBg, 4.5);
        expectContrast(theme.error, theme.cardBg, 4.5);

        // Settings/submitted warning notices: 8% action tint behind structure text.
        expectContrast(
          theme.structure,
          mixHex("#ffffff", theme.action, 0.08),
          4.5,
        );
        // Radio/option hover washes: 14% action and 12% accent tints.
        expectContrast(
          theme.structure,
          mixHex("#ffffff", theme.action, 0.14),
          4.5,
        );
        expectContrast(
          theme.structure,
          mixHex("#ffffff", theme.accent, 0.12),
          4.5,
        );
      }
    }
  });

  test("uses a visible action label for very light action colors", () => {
    const theme = resolveAppTheme({
      primaryColor: designTokens.palette2,
      secondaryColor: "#ffd700",
    });

    expect(theme.actionText).toBe("#111111");
    expectContrast(theme.actionText, theme.action, 4.5);
  });

  test("uses white action labels for dark action colors", () => {
    const theme = resolveAppTheme({
      primaryColor: designTokens.palette2,
      secondaryColor: "#123456",
    });

    expect(theme.actionText).toBe("#ffffff");
    expectContrast(theme.actionText, theme.action, 4.5);
  });

  test("does not collapse when both colors are neutral", () => {
    const theme = resolveAppTheme({
      primaryColor: "#808080",
      secondaryColor: "#eeeeee",
    });

    expectContrast(theme.structure, theme.cardBg, 4.5);
    expectContrast(theme.body, theme.background, 4.5);
    expectContrast(theme.accent, theme.cardBg, 3);
  });
});

describe("theme CSS output", () => {
  test("emits runtime overrides on :root:root", () => {
    const css = buildThemeCss(
      resolveAppTheme({
        primaryColor: "#003a55",
        secondaryColor: "#0099cc",
      }),
    );

    expect(css.startsWith(":root:root {")).toBe(true);
    expect(css).toContain("--palette-1:");
    expect(css).toContain("--palette-2:");
    expect(css).toContain("--brand-cyan-dark:");
    expect(css).toContain("--btn-primary-color:");
    expect(css).toContain("--success-bg:");
  });

  test("default CSS carries the template values", () => {
    expect(DEFAULT_THEME_CSS).toContain(
      `--palette-1: ${designTokens.palette1};`,
    );
    expect(DEFAULT_THEME_CSS).toContain(
      `--palette-2: ${designTokens.palette2};`,
    );
    expect(DEFAULT_THEME_CSS).toContain(
      `--background: ${designTokens.background};`,
    );
  });

  test("preview vars include every scoped primitive", () => {
    const vars = getThemePreviewVars(DEFAULT_RESOLVED_THEME);

    expect(vars["--palette-1"]).toBe(designTokens.palette1);
    expect(vars["--palette-2"]).toBe(designTokens.palette2);
    expect(vars["--card-bg"]).toBe(designTokens.cardBg);
  });

  test("default status tints match the CSS color-mix recipe", () => {
    const expectedSuccessBg = mixHex(designTokens.cardBg, designTokens.brandSky, 0.14);
    const expectedWarningBg = mixHex(designTokens.cardBg, designTokens.palette1, 0.12);

    expect(DEFAULT_RESOLVED_THEME.successBg).toBe(expectedSuccessBg);
    expect(DEFAULT_RESOLVED_THEME.warningBg).toBe(expectedWarningBg);
  });
});
