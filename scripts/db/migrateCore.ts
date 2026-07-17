import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type MigrationQueryClient = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
};

export type RunMigrationsResult = {
  applied: string[];
  skipped: string[];
};

const MIGRATION_FILE_PATTERN = /^\d+_.+\.sql$/;

export const SCHEMA_MIGRATIONS_TABLE = "schema_migrations";

export const ENSURE_SCHEMA_MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS "schema_migrations" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export async function listMigrationFiles(migrationsDir: string): Promise<string[]> {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && MIGRATION_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

export async function getAppliedMigrationNames(
  client: MigrationQueryClient,
): Promise<Set<string>> {
  await client.query(ENSURE_SCHEMA_MIGRATIONS_TABLE_SQL);
  const result = await client.query<{ name: string }>(
    `SELECT "name" FROM "schema_migrations" ORDER BY "name" ASC`,
  );
  return new Set(result.rows.map((row) => row.name));
}

export async function applyMigration(
  client: MigrationQueryClient,
  migrationsDir: string,
  fileName: string,
): Promise<void> {
  const sql = await readFile(path.join(migrationsDir, fileName), "utf8");
  const trimmedSql = sql.trim();
  if (!trimmedSql) {
    throw new Error(`Migration ${fileName} is empty.`);
  }

  await client.query("BEGIN");
  try {
    await client.query(trimmedSql);
    await client.query(
      `INSERT INTO "schema_migrations" ("name") VALUES ($1)`,
      [fileName],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function runMigrations(
  client: MigrationQueryClient,
  migrationsDir: string,
): Promise<RunMigrationsResult> {
  const migrationFiles = await listMigrationFiles(migrationsDir);
  const appliedNames = await getAppliedMigrationNames(client);
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const fileName of migrationFiles) {
    if (appliedNames.has(fileName)) {
      skipped.push(fileName);
      continue;
    }

    await applyMigration(client, migrationsDir, fileName);
    applied.push(fileName);
  }

  return { applied, skipped };
}
