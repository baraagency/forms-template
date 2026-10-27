import { loadFixture } from "@/app/api/_mock/loadFixture";
import {
  fetchLiveSisuTeamFields,
  normalizeSisuTeamFieldCatalog,
} from "@/app/api/_services/sisuLiveClient";
import { isSisuApiEnabled } from "@/app/api/_services/sisuApiMode";
import type { StorageResult } from "@/app/api/_services/dbPool";
import type { TeamFieldCatalog } from "@/app/forms/_core/teamFieldOptions";

/** Live SISU catalog when keyed, fixture otherwise. Server-only. */
export async function loadSisuTeamFieldCatalog(): Promise<
  StorageResult<TeamFieldCatalog>
> {
  if (isSisuApiEnabled()) {
    const live = await fetchLiveSisuTeamFields();
    if (live.error || !live.data) {
      return {
        data: null,
        error: live.error ?? "Failed to load SISU team fields.",
      };
    }

    return {
      data: normalizeSisuTeamFieldCatalog(live.data.fields),
      error: null,
    };
  }

  const fixture = loadFixture<{ fields: Record<string, unknown> }>(
    "sisu-team-fields.json",
  );
  return { data: fixture.fields as TeamFieldCatalog, error: null };
}
