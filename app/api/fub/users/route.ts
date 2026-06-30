import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";

type UsersFixture = {
  users: Array<{ id: number; name: string }>;
};

export async function GET() {
  const fixture = loadFixture<UsersFixture>("fub-users.json");
  return NextResponse.json(fixture);
}
