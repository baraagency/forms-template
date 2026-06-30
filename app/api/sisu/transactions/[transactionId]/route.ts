import { NextResponse } from "next/server";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ transactionId: string }> },
) {
  const { transactionId: rawTransactionId } = await params;
  const transactionId = parseTransactionId(rawTransactionId);

  if (!transactionId) {
    return NextResponse.json(
      { message: "A valid transactionId is required." },
      { status: 400 },
    );
  }

  if (transactionId !== MOCK_TRANSACTION_ID) {
    return NextResponse.json(
      { message: "No valid SISU transaction found for the selected transaction id." },
      { status: 404 },
    );
  }

  const fixture = loadFixture<{ transaction: SISUTransaction }>("sisu-transaction-789.json");
  return NextResponse.json(fixture);
}
