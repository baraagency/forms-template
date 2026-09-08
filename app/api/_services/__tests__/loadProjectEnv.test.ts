import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";

const ENV_PATH = path.join(process.cwd(), ".env");
const ENV_BACKUP_PATH = path.join(process.cwd(), ".env.load-project-env-test.bak");

describe("loadProjectEnv", () => {
  const originalSisuKey = process.env.SISU_API_KEY;
  const hadEnvFile = existsSync(ENV_PATH);
  const envBackup = hadEnvFile ? readFileSync(ENV_PATH, "utf8") : null;

  beforeEach(() => {
    if (hadEnvFile) {
      writeFileSync(ENV_BACKUP_PATH, envBackup ?? "", "utf8");
    }
  });

  afterEach(() => {
    if (originalSisuKey === undefined) {
      delete process.env.SISU_API_KEY;
    } else {
      process.env.SISU_API_KEY = originalSisuKey;
    }

    if (hadEnvFile) {
      writeFileSync(ENV_PATH, envBackup ?? "", "utf8");
    } else if (existsSync(ENV_PATH)) {
      unlinkSync(ENV_PATH);
    }

    if (existsSync(ENV_BACKUP_PATH)) {
      unlinkSync(ENV_BACKUP_PATH);
    }
  });

  it("loads a missing integration key from .env in development", async () => {
    writeFileSync(
      ENV_PATH,
      `${envBackup ?? ""}\nSISU_API_KEY=integration-test-key\n`,
      "utf8",
    );
    delete process.env.SISU_API_KEY;

    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { ensureIntegrationEnvLoaded } = await import("../loadProjectEnv.ts");
    ensureIntegrationEnvLoaded();

    process.env.NODE_ENV = originalNodeEnv;

    expect(process.env.SISU_API_KEY).toBe("integration-test-key");
  });
});
