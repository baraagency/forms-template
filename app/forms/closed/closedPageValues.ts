import type { JsonValue } from "@/app/types/storage";
import { collectPageFields } from "@/app/forms/editor/formPageData";
import type { FormPageData } from "@/app/forms/editor/formPageTypes";
import {
  getInitialClosedFormState,
} from "./closedFormUtils";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";

export function buildInitialClosedValues(input: {
  document: FormPageData;
  personId: string;
  agentId: string;
  dealId: string;
  sisuTransactionId: string;
  previousSubmissionFormData: JsonValue | null;
}): Record<string, string> {
  const state: Record<string, string> = {
    ...getInitialClosedFormState({
      personId: input.personId,
      agentId: input.agentId,
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
