import type { JsonValue } from "@/app/types/storage";
import { collectPageFields } from "../editor/formPageData";
import type { FormPageData } from "../editor/formPageTypes";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";
import { getInitialPendingFormState } from "./pendingFormUtils";

export function buildInitialPendingValues(input: {
  document: FormPageData;
  personId: string;
  agentId: string;
  clientName: string;
  dealId: string;
  sisuTransactionId: string;
  previousSubmissionFormData: JsonValue | null;
}): Record<string, string> {
  const state: Record<string, string> = {
    ...getInitialPendingFormState({
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

  return applyPreviousSubmissionFormData(
    state,
    input.previousSubmissionFormData ?? undefined,
  );
}
