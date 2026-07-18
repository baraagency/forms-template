import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";
import { fetchLiveFubPeople } from "@/app/api/_services/fubLiveClient";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
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
  const assignedUserId = parsePositiveInteger(
    url.searchParams.get("assignedUserId"),
  );
  const fields = url.searchParams.get("fields") ?? "";
  const wantsAllFields = fields
    .split(",")
    .map((part) => part.trim())
    .includes("allFields");
  const limit = parsePositiveInteger(url.searchParams.get("limit"));

  if (wantsAllFields) {
    if (isFubApiEnabled()) {
      const live = await fetchLiveFubPeople({
        fields: "allFields",
        limit: limit ?? 1,
      });
      if (live.error || !live.data) {
        return NextResponse.json(
          { message: live.error ?? "Failed to load FUB people." },
          { status: live.status ?? 502 },
        );
      }
      return NextResponse.json(live.data);
    }

    const person = loadFixture<FUBPerson>("fub-person-all-fields.json");
    return NextResponse.json({
      people: [person],
      _metadata: { total: 1, limit: String(limit ?? 1) },
    });
  }

  const people = loadFixture<FUBPerson[]>("fub-people.json");

  if (assignedUserId) {
    const filtered = people.filter(
      (person) => Number(person.assignedUserId) === assignedUserId,
    );
    return NextResponse.json(filtered);
  }

  return NextResponse.json(people);
}
