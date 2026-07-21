import { fetchLiveFubUser } from "@/app/api/_services/fubLiveClient";
import { resolveLiveSisuAgentIdByEmail } from "@/app/api/_services/sisuLiveClient";
import type { FUBUser } from "@/app/types/fub";
import type { FubLiveResult } from "@/app/api/_services/fubLiveClient";
import type { SisuLiveResult } from "@/app/api/_services/sisuLiveClient";

type ResolveSisuAgentIdDependencies = {
  fetchLiveFubUser?: (
    userId: string,
  ) => Promise<FubLiveResult<FUBUser>>;
  resolveLiveSisuAgentIdByEmail?: (
    email: string,
  ) => Promise<SisuLiveResult<number>>;
};

/**
 * Map a FUB user id to a SISU agent_id via user email + find-agent.
 * Soft-fails to undefined when FUB/SISU lookup cannot resolve an id.
 */
export async function resolveSisuAgentIdForFubAgentId(
  fubAgentId: string,
  dependencies: ResolveSisuAgentIdDependencies = {},
): Promise<number | undefined> {
  const trimmedAgentId = fubAgentId.trim();
  if (!trimmedAgentId) {
    return undefined;
  }

  const getUser = dependencies.fetchLiveFubUser ?? fetchLiveFubUser;
  const resolveByEmail =
    dependencies.resolveLiveSisuAgentIdByEmail ?? resolveLiveSisuAgentIdByEmail;

  const userResult = await getUser(trimmedAgentId);
  const email = userResult.data?.email?.trim();

  if (userResult.error || !email) {
    return undefined;
  }

  const sisuAgentResult = await resolveByEmail(email);
  return sisuAgentResult.data ?? undefined;
}
