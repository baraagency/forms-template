import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";

type TeamAgentsFixture = {
  agents: Array<{
    value: string;
    label: string;
    email: string;
    isIsa: boolean;
  }>;
};

export async function GET(request?: Request) {
  const roleFilter = request
    ? new URL(request.url).searchParams.get("role_filter") ?? undefined
    : undefined;
  const fixture = loadFixture<TeamAgentsFixture>("sisu-team-agents.json");
  const agents =
    roleFilter === "ISISA"
      ? fixture.agents.filter((agent) => agent.isIsa)
      : fixture.agents;

  return NextResponse.json({ agents });
}
