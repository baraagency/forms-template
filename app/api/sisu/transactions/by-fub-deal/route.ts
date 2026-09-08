import { MOCK_DEAL_ID } from "@/app/api/_fixtures/constants";
import { loadFixture } from "@/app/api/_mock/loadFixture";
import { findLatestFormSubmissionByDealFubId } from "@/app/api/_services/formSubmissionQueries";
import { fetchLiveSisuTransactionById } from "@/app/api/_services/sisuLiveClient";
import { isSisuApiEnabled } from "@/app/api/_services/sisuApiMode";
import type { SISUTransaction } from "@/app/types/sisu";
import {
  hasValidSisuTransactionId,
  readStoredSisuTransactionId,
} from "../sisuTransactionRouteUtils";

function parseDealId(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const dealId = parseDealId(url.searchParams.get("dealId"));

  if (!dealId) {
    return Response.json({ message: "A valid dealId is required." }, { status: 400 });
  }

  if (isSisuApiEnabled()) {
    const submissionResult = await findLatestFormSubmissionByDealFubId(dealId);
    if (submissionResult.error) {
      return Response.json(
        { message: submissionResult.error },
        { status: 502 },
      );
    }

    const storedTransactionId = readStoredSisuTransactionId(
      submissionResult.data?.form_data,
    );

    if (storedTransactionId) {
      const live = await fetchLiveSisuTransactionById(storedTransactionId);
      if (live.data && hasValidSisuTransactionId(live.data)) {
        return Response.json({ transaction: live.data });
      }
    }

    return Response.json(
      { message: "No SISU transaction found for the selected FUB deal." },
      { status: 404 },
    );
  }

  if (dealId !== MOCK_DEAL_ID) {
    return Response.json(
      { message: "No SISU transaction found for the selected FUB deal." },
      { status: 404 },
    );
  }

  const fixture = loadFixture<{ transaction: SISUTransaction }>("sisu-transaction-789.json");
  return Response.json(fixture);
}
