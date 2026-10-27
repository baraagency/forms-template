import type { JsonValue } from "@/app/types/storage";
import { collectPageFields } from "../editor/formPageData";
import type { FormPageData } from "../editor/formPageTypes";
import {
  applyAppointmentSetPreviousSubmissionPrefill,
  getInitialAppointmentSetFormState,
  type AppointmentSetFormState,
} from "./appointmentSetFormUtils";

export function buildInitialAppointmentSetValues(input: {
  document: FormPageData;
  personId: string;
  agentId: string;
  clientName: string;
  dealId: string;
  sisuTransactionId: string;
  previousSubmissionFormData: JsonValue | null;
}): Record<string, string> {
  const state: Record<string, string> = {
    ...getInitialAppointmentSetFormState({
      personId: input.personId,
      agentId: input.agentId,
      clientName: input.clientName,
      dealId: input.dealId,
      sisuTransactionId: input.sisuTransactionId,
    }),
  };

  for (const field of collectPageFields(input.document)) {
    if (!(field.id in state)) {
      state[field.id] = "";
    }
  }

  return {
    ...applyAppointmentSetPreviousSubmissionPrefill(
      state as unknown as AppointmentSetFormState,
      input.previousSubmissionFormData,
    ),
  };
}
