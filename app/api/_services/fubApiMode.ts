import { ensureIntegrationEnvLoaded } from "./loadProjectEnv";

export function isFubApiEnabled(): boolean {
  ensureIntegrationEnvLoaded();
  return Boolean(process.env.FUB_API_KEY?.trim());
}
