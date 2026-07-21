export function resolveAppointmentMetSubmittingAgentId(input: {
  agentSubmitting?: string | null;
  agentId?: string | null;
}): string | null {
  const submitting = (input.agentSubmitting ?? "").trim();
  if (submitting) {
    return submitting;
  }
  const agentId = (input.agentId ?? "").trim();
  return agentId || null;
}
