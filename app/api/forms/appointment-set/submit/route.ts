import { NextResponse } from "next/server";
import {
  normalizeAppointmentSetPayload,
  validateAppointmentSetForm,
  type AppointmentSetFormState,
} from "@/app/forms/appointment-set/appointmentSetFormUtils";
import { isSubmissionDebugEnvironment } from "@/app/forms/_core/submissionUtils";
import { loadFixture } from "@/app/api/_mock/loadFixture";

function isAppointmentSetPayload(
  payload: unknown,
): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (!isAppointmentSetPayload(payload)) {
    return NextResponse.json(
      { message: "Appointment Set payload is required." },
      { status: 400 },
    );
  }

  const formState: AppointmentSetFormState =
    normalizeAppointmentSetPayload(payload);
  const errors = validateAppointmentSetForm(formState);

  if (!formState.personId) {
    errors.personId = "A FUB person id is required.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        message: "Appointment Set submission has validation errors.",
        errors,
      },
      { status: 400 },
    );
  }

  const mockResponse = loadFixture<Record<string, unknown>>(
    "appointment-set-submit-success.json",
  );
  const debugEnabled = isSubmissionDebugEnvironment(process.env.ENVIRONMENT);

  return NextResponse.json({
    ...mockResponse,
    ...(debugEnabled
      ? {
          debug: {
            deal: { id: mockResponse.dealId },
            appointment: { id: mockResponse.appointmentId },
            transaction: mockResponse.transaction,
          },
        }
      : {}),
  });
}
