import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { FUBPerson } from "@/app/types/fub";

function parsePositiveInteger(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : null;
}

export async function loader({
  params,
}: {
  request: Request;
  params: { personId: string };
}) {
  const personId = parsePositiveInteger(params.personId);

  if (!personId) {
    return Response.json({ message: "A valid personId is required." }, { status: 400 });
  }

  const person = loadFixture<FUBPerson>("fub-person-123.json");
  if (String(person.id) !== personId) {
    return Response.json({ message: "Client not found in template fixtures." }, { status: 404 });
  }

  return Response.json(person);
}
