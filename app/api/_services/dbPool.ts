import { Pool } from "pg";
import { getDatabasePoolConfig } from "@/db/connection";

export type StorageResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool(getDatabasePoolConfig(databaseUrl));
  }

  return pool;
}

export function requireDbPool(): StorageResult<Pool> {
  const nextPool = getDbPool();
  if (!nextPool) {
    return { data: null, error: "DATABASE_URL is not configured." };
  }
  return { data: nextPool, error: null };
}
