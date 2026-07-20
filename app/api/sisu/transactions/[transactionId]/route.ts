import { MOCK_TRANSACTION_ID } from "@/app/api/_fixtures/constants";
import { loadFixture } from "@/app/api/_mock/loadFixture";
import type { SISUTransaction } from "@/app/types/sisu";

function parseTransactionId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function loader({
  params,
}: {
  request: Request;
  params: { transactionId: string };
}) {
  const transactionId = parseTransactionId(params.transactionId);

  if (!transactionId) {
    return Response.json(
      { message: "A valid transactionId is required." },
      { status: 400 },
    );
  }

  if (transactionId !== MOCK_TRANSACTION_ID) {
    return Response.json(
      { message: "No valid SISU transaction found for the selected transaction id." },
      { status: 404 },
    );
  }

  const fixture = loadFixture<{ transaction: SISUTransaction }>("sisu-transaction-789.json");
  return Response.json(fixture);
}
