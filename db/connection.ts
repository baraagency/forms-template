export function normalizeDatabaseConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");

    if (!sslmode) {
      url.searchParams.set("sslmode", "require");
    } else if (sslmode === "prefer" || sslmode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
    }

    return url.toString();
  } catch {
    return connectionString;
  }
}

export function getDatabasePoolConfig(connectionString: string) {
  let normalized = connectionString;

  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    normalized = url.toString();
  } catch {
    // Keep original connection string when parsing fails.
  }

  const isLocal =
    normalized.includes("localhost") || normalized.includes("127.0.0.1");

  if (isLocal) {
    return { connectionString: normalized };
  }

  return {
    connectionString: normalized,
    ssl: { rejectUnauthorized: false },
  };
}
