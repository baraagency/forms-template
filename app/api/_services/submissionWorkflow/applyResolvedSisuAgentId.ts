import type { SISUCreateTransactionRequest } from "@/app/types/sisu";

export function applyResolvedSisuAgentId(
  sisuPayload: SISUCreateTransactionRequest,
  sisuAgentId: number | undefined,
): void {
  if (sisuAgentId === undefined) {
    return;
  }
  sisuPayload.agent_id = sisuAgentId;
}
