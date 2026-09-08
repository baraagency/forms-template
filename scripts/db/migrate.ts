import { existsSync, readFileSync } from "node:fs";
import { Pool } from "pg";
import path from "node:path";
import { getDatabasePoolConfig } from "../../db/connection.ts";
import { runMigrations } from "./migrateCore.ts";

const migrationsDir = path.join(process.cwd(), "db", "migrations");

function loadDotEnvIfNeeded() {
  if (process.env.DATABASE_URL?.trim()) {
    return;
  }

  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const contents = readFileSync(envPath, "utf8");
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

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadDotEnvIfNeeded();

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    console.error("Add it to .env (see .env.example) or export it in your shell.");
    process.exit(1);
  }

  const pool = new Pool(getDatabasePoolConfig(databaseUrl));

  try {
    const result = await runMigrations(pool, migrationsDir);

    if (result.applied.length === 0) {
      console.log("No new migrations to apply.");
    } else {
      console.log(`Applied ${result.applied.length} migration(s):`);
      for (const fileName of result.applied) {
        console.log(`  - ${fileName}`);
      }
    }

    if (result.skipped.length > 0) {
      console.log(`Skipped ${result.skipped.length} already-applied migration(s).`);
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Database migration failed.",
    );
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();
