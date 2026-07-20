import type { FormKind } from "@/app/types/storage";
import type { FormRouterFormKey } from "./formRouterUtils";

/** Router / URL slug for the four settings tabs and form router entries. */
export type FormRouterSlug = FormRouterFormKey;

/** FormKinds that appear on the settings page (excludes agreementSigned). */
export type SettingsFormKind =
  | "pending"
  | "closed"
  | "appointmentSet"
  | "appointmentMet";

export const SETTINGS_TAB_SLUGS: readonly FormRouterSlug[] = [
  "appointment-set",
  "appointment-met",
  "pending",
  "closed",
] as const;

const SLUG_TO_KIND: Record<FormRouterSlug, SettingsFormKind> = {
  pending: "pending",
  "appointment-set": "appointmentSet",
  "appointment-met": "appointmentMet",
  closed: "closed",
};

const KIND_TO_SLUG: Record<SettingsFormKind, FormRouterSlug> = {
  pending: "pending",
  appointmentSet: "appointment-set",
  appointmentMet: "appointment-met",
  closed: "closed",
};

const KIND_LABELS: Record<SettingsFormKind, string> = {
  pending: "Pending",
  appointmentSet: "Appointment Set",
  appointmentMet: "Appointment Met",
  closed: "Closed",
};

export function isFormRouterSlug(value: string): value is FormRouterSlug {
  return (SETTINGS_TAB_SLUGS as readonly string[]).includes(value);
}

export function isSettingsFormKind(value: string): value is SettingsFormKind {
  return value in KIND_TO_SLUG;
}

export function slugToFormKind(slug: string): SettingsFormKind | null {
  if (!isFormRouterSlug(slug)) {
    return null;
  }
  return SLUG_TO_KIND[slug];
}

export function formKindToSlug(kind: FormKind | string): FormRouterSlug | null {
  if (!isSettingsFormKind(kind)) {
    return null;
  }
  return KIND_TO_SLUG[kind];
}

export function formKindLabel(kind: SettingsFormKind): string {
  return KIND_LABELS[kind];
}

export function formPathname(slug: FormRouterSlug): string {
  return `/forms/${slug}`;
}

/**
 * Accept FormKind or router slug from query/body; return FormKind or null.
 */
export function parseFormKindParam(value: string | null | undefined): SettingsFormKind | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (isSettingsFormKind(trimmed)) {
    return trimmed;
  }
  return slugToFormKind(trimmed);
}

export function normalizeSettingsEnvironment(
  env = process.env.ENVIRONMENT,
): "LOCAL" | "STAGING" | "PRODUCTION" {
  const normalized = env?.trim().toUpperCase();
  if (normalized === "PRODUCTION" || normalized === "PROD") {
    return "PRODUCTION";
  }
  if (normalized === "STAGING" || normalized === "STAGE") {
    return "STAGING";
  }
  return "LOCAL";
}
