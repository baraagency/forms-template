import { Pool } from "pg";
import path from "node:path";
import { getDatabasePoolConfig } from "../../db/connection.ts";
import { runMigrations } from "./migrateCore.ts";

const migrationsDir = path.join(process.cwd(), "db", "migrations");

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
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
