import { loadFixture } from "@/app/api/_mock/loadFixture";
import { fetchLiveFubUsers } from "@/app/api/_services/fubLiveClient";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
import { mapFubUserToAgentOption } from "@/app/forms/_core/formRouterUtils";
import type { FUBUser } from "@/app/types/fub";

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

function mapLiveUsersToAgentOptions(users: FUBUser[], includeAll: boolean) {
  return users
    .filter((user) => includeAll || isActiveUser(user.status))
    .map(mapFubUserToAgentOption)
    .filter((user) => Number.isInteger(user.id) && user.id > 0)
    .sort((first, second) => first.name.localeCompare(second.name));
}

export async function loader({ request }: { request: Request }) {
  const includeAll = new URL(request.url).searchParams.get("all") === "true";

  if (isFubApiEnabled()) {
    const live = await fetchLiveFubUsers({ limit: 100 });
    if (live.error || !live.data) {
      return Response.json(
        { message: live.error ?? "Failed to load FUB users." },
        { status: live.status ?? 502 },
      );
    }

    return Response.json({
      users: mapLiveUsersToAgentOptions(live.data.users, includeAll),
    });
  }

  const fixture = loadFixture<UsersFixture>("fub-users.json");
  return Response.json(fixture);
}
