import { NextResponse } from "next/server";
import {
  normalizePendingPayload,
  validatePendingForm,
  type PendingFormState,
} from "@/app/forms/pending/pendingFormUtils";
import { isSubmissionDebugEnvironment } from "@/app/forms/_core/submissionUtils";
import { loadFixture } from "@/app/api/_mock/loadFixture";

function isPendingPayload(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (!isPendingPayload(payload)) {
    return NextResponse.json({ message: "Pending payload is required." }, { status: 400 });
  }

  const formState: PendingFormState = normalizePendingPayload(payload);
  const errors = validatePendingForm(formState);

  if (!formState.personId) {
    errors.personId = "A FUB person id is required.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { message: "Pending submission has validation errors.", errors },
      { status: 400 },
    );
  }

  const mockResponse = loadFixture<Record<string, unknown>>("pending-submit-success.json");
  const debugEnabled = isSubmissionDebugEnvironment(process.env.ENVIRONMENT);

  return NextResponse.json({
    ...mockResponse,
    ...(debugEnabled
      ? {
          debug: {
            deal: { id: mockResponse.dealId },
            transaction: mockResponse.transaction,
          },
        }
      : {}),
  });
}
