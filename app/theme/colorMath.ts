export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export type HslColor = {
  h: number;
  s: number;
  l: number;
};

export type ContrastMix = {
  color: RgbColor;
  amount: number;
};

export const WHITE: RgbColor = { r: 255, g: 255, b: 255 };
export const BLACK: RgbColor = { r: 0, g: 0, b: 0 };
export const DARK_TEXT_HEX = "#111111";
const DARK_TEXT: RgbColor = { r: 17, g: 17, b: 17 };

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

/** Accepts #rgb and #rrggbb; returns a lowercase 6-digit hex or null. */
export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!HEX_PATTERN.test(trimmed)) {
    return null;
  }

  const hex = trimmed.slice(1);
  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : hex;

  return `#${expanded.toLowerCase()}`;
}

export function hexToRgb(value: string): RgbColor | null {
  const normalized = normalizeHexColor(value);
  if (!normalized) {
    return null;
  }

  const hex = normalized.slice(1);
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

export function rgbToHex(color: RgbColor): string {
  return `#${[color.r, color.g, color.b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function toRgb(color: RgbColor | string): RgbColor | null {
  return typeof color === "string" ? hexToRgb(color) : color;
}

/** Mixes from `from` toward `to`; amount 0 = from, 1 = to. */
export function mixRgb(
  from: RgbColor,
  to: RgbColor,
  amount: number,
): RgbColor {
  const ratio = Math.min(1, Math.max(0, amount));
  return {
    r: from.r + (to.r - from.r) * ratio,
    g: from.g + (to.g - from.g) * ratio,
    b: from.b + (to.b - from.b) * ratio,
  };
}

export function mixHex(from: string, to: string, amount: number): string {
  const fromRgb = hexToRgb(from);
  const toRgbValue = hexToRgb(to);

  if (!fromRgb || !toRgbValue) {
    return normalizeHexColor(from) ?? "#000000";
  }

  return rgbToHex(mixRgb(fromRgb, toRgbValue, amount));
}

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: RgbColor | string): number {
  const rgb = toRgb(color);
  if (!rgb) {
    return 0;
  }

  return (
    0.2126 * channelToLinear(rgb.r) +
    0.7152 * channelToLinear(rgb.g) +
    0.0722 * channelToLinear(rgb.b)
  );
}

/** WCAG 2.1 contrast ratio. */
export function contrastRatio(
  foreground: RgbColor | string,
  background: RgbColor | string,
): number {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  return (lighter + 0.05) / (darker + 0.05);
}

export function passesContrast(
  color: RgbColor,
  backgrounds: RgbColor[],
  minimum: number,
): boolean {
  return backgrounds.every(
    (background) => contrastRatio(color, background) >= minimum,
  );
}

/**
 * Mixes toward `target` (black or white) until every background reaches the
 * minimum contrast. Returns the smallest mix that passes.
 */
function findContrastMix(
  color: RgbColor | string,
  backgrounds: Array<RgbColor | string>,
  target: RgbColor,
  minimum: number,
): ContrastMix {
  const source = toRgb(color);
  const resolvedBackgrounds = backgrounds
    .map((background) => toRgb(background))
    .filter((background): background is RgbColor => background !== null);

  if (!source || resolvedBackgrounds.length === 0) {
    return { color: source ?? BLACK, amount: 0 };
  }

  if (passesContrast(source, resolvedBackgrounds, minimum)) {
    return { color: source, amount: 0 };
  }

  let low = 0;
  let high = 1;

  for (let index = 0; index < 24; index += 1) {
    const middle = (low + high) / 2;
    if (
      passesContrast(
        mixRgb(source, target, middle),
        resolvedBackgrounds,
        minimum,
      )
    ) {
      high = middle;
    } else {
      low = middle;
    }
  }

  return { color: mixRgb(source, target, high), amount: high };
}

export function darkenUntilContrast(
  color: RgbColor | string,
  backgrounds: Array<RgbColor | string>,
  minimum: number,
): RgbColor {
  return findContrastMix(color, backgrounds, BLACK, minimum).color;
}

export function lightenUntilContrast(
  color: RgbColor | string,
  backgrounds: Array<RgbColor | string>,
  minimum: number,
): RgbColor {
  return findContrastMix(color, backgrounds, WHITE, minimum).color;
}

export function pickReadableTextColor(background: RgbColor): string {
  return contrastRatio(background, WHITE) >=
    contrastRatio(background, DARK_TEXT)
    ? "#ffffff"
    : DARK_TEXT_HEX;
}

/**
 * Keeps the chosen action fill when possible; otherwise shifts it minimally
 * until white or near-black label text reaches the minimum contrast.
 */
export function chooseReadableTextOnFill(
  fill: RgbColor,
  minimum = 4.6,
): { fill: RgbColor; text: string } {
  const whiteContrast = contrastRatio(fill, WHITE);
  const darkContrast = contrastRatio(fill, DARK_TEXT);

  if (whiteContrast >= minimum || darkContrast >= minimum) {
    return {
      fill,
      text:
        whiteContrast >= darkContrast ? "#ffffff" : DARK_TEXT_HEX,
    };
  }

  const darken = findContrastMix(fill, [WHITE], BLACK, minimum);
  const lighten = findContrastMix(fill, [DARK_TEXT], WHITE, minimum);

  if (lighten.amount < darken.amount) {
    return { fill: lighten.color, text: DARK_TEXT_HEX };
  }

  return { fill: darken.color, text: "#ffffff" };
}

export function rgbToHsl(color: RgbColor): HslColor {
  const red = color.r / 255;
  const green = color.g / 255;
  const blue = color.b / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const lightness = (maximum + minimum) / 2;

  if (maximum === minimum) {
    return { h: 0, s: 0, l: lightness };
  }

  const delta = maximum - minimum;
  const saturation =
    lightness > 0.5
      ? delta / (2 - maximum - minimum)
      : delta / (maximum + minimum);

  let hue: number;
  if (maximum === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (maximum === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return { h: hue * 60, s: saturation, l: lightness };
}

export function hslToRgb(color: HslColor): RgbColor {
  const hue = ((color.h % 360) + 360) % 360 / 360;
  const saturation = Math.min(1, Math.max(0, color.s));
  const lightness = Math.min(1, Math.max(0, color.l));

  if (saturation === 0) {
    const channel = lightness * 255;
    return { r: channel, g: channel, b: channel };
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  const channel = (t: number): number => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  return {
    r: channel(hue + 1 / 3) * 255,
    g: channel(hue) * 255,
    b: channel(hue - 1 / 3) * 255,
  };
}

export function isChromatic(
  color: RgbColor,
  minimumSaturation = 0.15,
): boolean {
  const { s } = rgbToHsl(color);
  const maximum = Math.max(color.r, color.g, color.b);
  const minimum = Math.min(color.r, color.g, color.b);
  return s >= minimumSaturation && (maximum - minimum) / 255 >= 0.055;
}
