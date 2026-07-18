import type { FormRouterSlug } from "../_core/formIdentity";
import type { FormRouterFormKey } from "../_core/formRouterUtils";

export type FormRouterFormMeta = {
  key: FormRouterFormKey;
  title: string;
  description: string;
  pathname: string;
};

/** Static registry for the four example forms (pathname + copy). */
export const FORM_ROUTER_FORM_REGISTRY: FormRouterFormMeta[] = [
  {
    key: "pending",
    title: "Pending",
    description: "Route to the under-contract transaction intake flow.",
    pathname: "/forms/pending",
  },
  {
    key: "appointment-set",
    title: "Appointment Set",
    description: "Schedule an appointment and capture client intake details.",
    pathname: "/forms/appointment-set",
  },
  {
    key: "appointment-met",
    title: "Appointment Met",
    description: "Capture appointment disposition and next steps for this lead.",
    pathname: "/forms/appointment-met",
  },
  {
    key: "closed",
    title: "Closed",
    description: "Capture closed transaction details for this lead.",
    pathname: "/forms/closed",
  },
];

export function getRegistryFormBySlug(
  slug: FormRouterSlug,
): FormRouterFormMeta | undefined {
  return FORM_ROUTER_FORM_REGISTRY.find((form) => form.key === slug);
}
