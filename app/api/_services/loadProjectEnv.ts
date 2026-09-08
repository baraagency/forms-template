import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PROJECT_ENV_PATH = path.join(process.cwd(), ".env");

const INTEGRATION_ENV_KEYS = [
  "DATABASE_URL",
  "FUB_API_KEY",
  "SISU_API_KEY",
] as const;

function parseEnvFile(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      parsed[key] = value;
    }
  }

  return parsed;
}

function mergeEnvFromFile(keys?: readonly string[]): void {
  if (!existsSync(PROJECT_ENV_PATH)) {
    return;
  }

  const parsed = parseEnvFile(readFileSync(PROJECT_ENV_PATH, "utf8"));
  const targetKeys = keys ?? Object.keys(parsed);

  for (const key of targetKeys) {
    const value = parsed[key];
    if (!value?.trim() || process.env[key]?.trim()) {
      continue;
    }
    process.env[key] = value;
  }
}

/** Load missing keys from `.env` into `process.env` (never overwrites existing values). */
export function loadProjectEnvFromFile(): void {
  mergeEnvFromFile();
}

/**
 * In local dev, re-read integration keys from `.env` when they are missing from
 * the running process (e.g. key added after `react-router dev` started).
 */
export function ensureIntegrationEnvLoaded(): void {
  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
    return;
  }

  mergeEnvFromFile(INTEGRATION_ENV_KEYS);
}

loadProjectEnvFromFile();
