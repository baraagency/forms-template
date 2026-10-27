import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { StorageResult } from "@/app/api/_services/dbPool";
import type { FieldOption } from "@/app/forms/editor/formPageTypes";

type TeamAgentsFixture = {
  agents: Array<{
    value: string;
    label: string;
    email: string;
    isIsa: boolean;
  }>;
};

/** SISU team agents as publish-time option snapshots. */
export async function loadSisuTeamAgentOptions(
  roleFilter?: string,
): Promise<StorageResult<FieldOption[]>> {
  const fixture = loadFixture<TeamAgentsFixture>("sisu-team-agents.json");
  const agents =
    roleFilter === "ISISA"
      ? fixture.agents.filter((agent) => agent.isIsa)
      : fixture.agents;

  return {
    data: agents.map((agent) => ({
      value: agent.value,
      label: agent.label,
    })),
    error: null,
  };
}
