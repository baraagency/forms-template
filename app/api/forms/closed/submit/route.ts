import { NextResponse } from "next/server";
import {
  normalizeClosedPayload,
  validateClosedForm,
  type ClosedFormState,
} from "@/app/forms/closed/closedFormUtils";
import { getClosedSelectOptions } from "@/app/forms/closed/closedTeamFieldOptions";
import { isSubmissionDebugEnvironment } from "@/app/forms/_core/submissionUtils";
import { loadFixture } from "@/app/api/_mock/loadFixture";

function isClosedPayload(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (!isClosedPayload(payload)) {
    return NextResponse.json(
      { message: "Closed payload is required." },
      { status: 400 },
    );
  }

  const formState: ClosedFormState = normalizeClosedPayload(payload);
  const transactionTypeOptions =
    getClosedSelectOptions({}).transactionTypeOptions;
  const errors = validateClosedForm(formState, { transactionTypeOptions });

  if (!formState.personId) {
    errors.personId = "A FUB person id is required.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        message: "Closed submission has validation errors.",
        errors,
      },
      { status: 400 },
    );
  }

  const mockResponse = loadFixture<Record<string, unknown>>(
    "closed-submit-success.json",
  );
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
