import { ensureIntegrationEnvLoaded } from "./loadProjectEnv";

export function isSisuApiEnabled(): boolean {
  ensureIntegrationEnvLoaded();
  return Boolean(process.env.SISU_API_KEY?.trim());
}
