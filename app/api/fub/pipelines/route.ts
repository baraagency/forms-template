import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { FUBListPipelinesResponse } from "@/app/types/fub";

export async function loader() {
  const fixture = loadFixture<FUBListPipelinesResponse>("fub-pipelines.json");
  return Response.json(fixture);
}
