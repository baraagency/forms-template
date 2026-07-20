import { loadFixture } from "@/app/api/_mock/loadFixture";

type UsersFixture = {
  users: Array<{ id: number; name: string }>;
};

export async function loader() {
  const fixture = loadFixture<UsersFixture>("fub-users.json");
  return Response.json(fixture);
}
