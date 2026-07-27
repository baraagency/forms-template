/**
 * WCAG 2.1 contrast audit for design-token pairs.
 * Advisory by default; set STRICT_A11Y=1 to exit non-zero on failures.
 */
import pairs from "./contrast-pairs.json";

type ContrastPair = {
  name: string;
  foreground: string;
  background: string;
  minimum: number;
};

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "").trim();
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(parseHex(fg));
  const l2 = relativeLuminance(parseHex(bg));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const strict = process.env.STRICT_A11Y === "1";
const failures: string[] = [];

console.log("\nWCAG contrast audit\n");
console.log(
  "Pair".padEnd(32) +
    "Ratio".padStart(8) +
    "Min".padStart(8) +
    "  Status",
);
console.log("-".repeat(60));

for (const pair of pairs as ContrastPair[]) {
  const ratio = contrastRatio(pair.foreground, pair.background);
  const pass = ratio >= pair.minimum;
  const status = pass ? "PASS" : "FAIL";
  console.log(
    pair.name.padEnd(32) +
      ratio.toFixed(2).padStart(8) +
      String(pair.minimum).padStart(8) +
      `  ${status}`,
  );
  if (!pass) {
    failures.push(
      `${pair.name}: ${ratio.toFixed(2)}:1 (needs ${pair.minimum}:1) — ${pair.foreground} on ${pair.background}`,
    );
  }
}

console.log("");

if (failures.length === 0) {
  console.log("All contrast pairs pass WCAG targets.");
  process.exit(0);
}

console.log(`${failures.length} pair(s) below minimum:\n`);
for (const message of failures) {
  console.log(`  • ${message}`);
}

if (strict) {
  console.log("\nSTRICT_A11Y=1 — exiting with code 1.");
  process.exit(1);
}

console.log(
  "\nAdvisory mode — exiting 0. Set STRICT_A11Y=1 to fail on violations.",
);
process.exit(0);
