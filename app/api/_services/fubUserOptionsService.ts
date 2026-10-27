import { loadFixture } from "@/app/api/_mock/loadFixture";
import { fetchLiveFubUsers } from "@/app/api/_services/fubLiveClient";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
import type { StorageResult } from "@/app/api/_services/dbPool";
import { mapFubUserToAgentOption } from "@/app/forms/_core/formRouterUtils";
import type { FieldOption } from "@/app/forms/editor/formPageTypes";

type UsersFixture = {
  users: Array<{ id: number; name: string }>;
};

function isActiveUser(status: unknown): boolean {
  if (typeof status !== "string" || !status.trim()) {
    return true;
  }
  const normalized = status.toLowerCase();
  return normalized === "active" || normalized === "enabled";
}

/** FUB users as publish-time option snapshots. */
export async function loadFubUserOptions(): Promise<StorageResult<FieldOption[]>> {
  if (isFubApiEnabled()) {
    const live = await fetchLiveFubUsers({ limit: 100 });
    if (live.error || !live.data) {
      return {
        data: null,
        error: live.error ?? "Failed to load FUB users.",
      };
    }

    return {
      data: live.data.users
        .filter((user) => isActiveUser(user.status))
        .map(mapFubUserToAgentOption)
        .filter((user) => Number.isInteger(user.id) && user.id > 0)
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((user) => ({ value: String(user.id), label: user.name })),
      error: null,
    };
  }

  const fixture = loadFixture<UsersFixture>("fub-users.json");
  return {
    data: fixture.users
      .filter((user) => Number.isInteger(user.id) && user.id > 0)
      .sort((first, second) => first.name.localeCompare(second.name))
      .map((user) => ({ value: String(user.id), label: user.name })),
    error: null,
  };
}
