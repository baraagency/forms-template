import type { FormFubStage, FormFubTag, FormKind } from "@/app/types/storage";

export const FUB_CLIENT_TYPES = ["Buyer", "Seller"] as const;

export type FubClientType = (typeof FUB_CLIENT_TYPES)[number];

/**
 * Forms whose form state carries a Buyer/Seller distinction (clientType /
 * leadType). Forms outside this set (e.g. "closed", which only has a
 * transaction type) have no client type to key stages/tags off of, so their
 * FUB stage/tag settings must be stored and matched with a null client type
 * instead of forcing a meaningless Buyer/Seller split.
 */
const FORM_KINDS_WITH_CLIENT_TYPE: readonly FormKind[] = [
  "pending",
  "appointmentSet",
  "appointmentMet",
];

export function formSupportsFubClientType(form: FormKind): boolean {
  return FORM_KINDS_WITH_CLIENT_TYPE.includes(form);
}

export function normalizeFubClientType(
  value: string | null | undefined,
): FubClientType | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const match = FUB_CLIENT_TYPES.find(
    (clientType) => clientType.toLowerCase() === trimmed.toLowerCase(),
  );
  return match ?? null;
}

export function pickFubStageForClientType(
  stages: FormFubStage[],
  target: "person" | "deal",
  clientType: string | null,
): FormFubStage | null {
  const enabled = stages.filter(
    (stage) => stage.enabled && stage.target === target,
  );
  if (enabled.length === 0) {
    return null;
  }

  const normalizedClientType = normalizeFubClientType(clientType);
  if (normalizedClientType) {
    return (
      enabled.find(
        (stage) =>
          normalizeFubClientType(stage.client_type) === normalizedClientType,
      ) ?? null
    );
  }

  return (
    enabled.find(
      (stage) => stage.client_type === null || stage.client_type === "",
    ) ?? null
  );
}

export function pickFubTagsForClientType(
  tags: FormFubTag[],
  clientType: string | null,
): FormFubTag[] {
  const enabled = tags.filter((tag) => tag.enabled);
  const normalizedClientType = normalizeFubClientType(clientType);
  if (!normalizedClientType) {
    return enabled.filter(
      (tag) => tag.client_type === null || tag.client_type === "",
    );
  }

  return enabled.filter(
    (tag) => normalizeFubClientType(tag.client_type) === normalizedClientType,
  );
}
