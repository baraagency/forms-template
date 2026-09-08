import { loadFixture } from "@/app/api/_mock/loadFixture";
import { fetchLiveFubDeals } from "@/app/api/_services/fubLiveClient";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";
import { isFormsDemoMode } from "@/app/forms/_core/localFormsDemo";
import type { FUBDeal } from "@/app/types/fub";

function parsePositiveInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function shouldUseLiveDeals(): boolean {
  return isFubApiEnabled() && !isFormsDemoMode();
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const personId = parsePositiveInteger(url.searchParams.get("personId"));
  const fields = url.searchParams.get("fields") ?? "";
  const wantsAllFields = fields
    .split(",")
    .map((part) => part.trim())
    .includes("allFields");
  const limit = parsePositiveInteger(url.searchParams.get("limit"));

  if (wantsAllFields) {
    if (shouldUseLiveDeals()) {
      const live = await fetchLiveFubDeals({
        fields: "allFields",
        limit: limit ?? 25,
        status: "Active",
      });
      if (live.error || !live.data) {
        return Response.json(
          { message: live.error ?? "Failed to load FUB deals." },
          { status: live.status ?? 502 },
        );
      }
      return Response.json(live.data);
    }

    const deal = loadFixture<FUBDeal>("fub-deal-all-fields.json");
    return Response.json({
      deals: [deal],
      _metadata: { total: 1, limit: String(limit ?? 25) },
    });
  }

  if (!personId) {
    return Response.json(
      { message: "A valid personId is required." },
      { status: 400 },
    );
  }

  if (shouldUseLiveDeals()) {
    const live = await fetchLiveFubDeals({
      personId,
      status: "Active",
      limit: limit ?? 100,
    });
    if (live.error || !live.data) {
      return Response.json(
        { message: live.error ?? "Failed to load FUB deals." },
        { status: live.status ?? 502 },
      );
    }
    return Response.json({ deals: live.data.deals });
  }

  const fixture = loadFixture<{ deals: FUBDeal[] }>("fub-deals.json");
  return Response.json({ deals: fixture.deals });
}
