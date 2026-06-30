import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { FUBPerson } from "@/app/types/fub";

function parsePositiveInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const assignedUserId = parsePositiveInteger(url.searchParams.get("assignedUserId"));
  const people = loadFixture<FUBPerson[]>("fub-people.json");

  if (assignedUserId) {
    const filtered = people.filter(
      (person) => Number(person.assignedUserId) === assignedUserId,
    );
    return NextResponse.json(filtered);
  }

  return NextResponse.json(people);
}
