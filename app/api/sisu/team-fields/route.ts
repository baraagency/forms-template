import { NextResponse } from "next/server";
import { loadFixture } from "@/app/api/_mock/loadFixture";
import {
  fetchLiveSisuTeamFields,
  normalizeSisuTeamFieldCatalog,
} from "@/app/api/_services/sisuLiveClient";
import { isSisuApiEnabled } from "@/app/api/_services/sisuApiMode";
import type { SISUTeamFieldsCatalogResponse } from "@/app/types/sisu";

export async function GET() {
  if (isSisuApiEnabled()) {
    const live = await fetchLiveSisuTeamFields();
    if (live.error || !live.data) {
      return NextResponse.json(
        { message: live.error ?? "Failed to load SISU team fields." },
        { status: live.status ?? 502 },
      );
    }

    const fields = normalizeSisuTeamFieldCatalog(
      live.data.fields,
    ) satisfies SISUTeamFieldsCatalogResponse["fields"];

    return NextResponse.json({ fields });
  }

  const fixture = loadFixture<{ fields: Record<string, unknown> }>(
    "sisu-team-fields.json",
  );
  return NextResponse.json(fixture);
}
