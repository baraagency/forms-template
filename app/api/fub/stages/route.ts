import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { FUBListStagesResponse } from "@/app/types/fub";

export async function loader() {
  const fixture = loadFixture<FUBListStagesResponse>("fub-stages.json");
  return Response.json(fixture);
}
