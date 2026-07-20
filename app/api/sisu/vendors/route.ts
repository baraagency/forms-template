import { loadFixture } from "@/app/api/_mock/loadFixture";

export async function loader() {
  const fixture = loadFixture<{ vendors: Record<string, unknown> }>("sisu-vendors.json");
  return Response.json(fixture);
}
