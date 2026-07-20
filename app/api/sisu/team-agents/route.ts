import { loadFixture } from "@/app/api/_mock/loadFixture";

type TeamAgentsFixture = {
  agents: Array<{
    value: string;
    label: string;
    email: string;
    isIsa: boolean;
  }>;
};

export async function loader({ request }: { request: Request }) {
  const roleFilter =
    new URL(request.url).searchParams.get("role_filter") ?? undefined;
  const fixture = loadFixture<TeamAgentsFixture>("sisu-team-agents.json");
  const agents =
    roleFilter === "ISISA"
      ? fixture.agents.filter((agent) => agent.isIsa)
      : fixture.agents;

  return Response.json({ agents });
}
