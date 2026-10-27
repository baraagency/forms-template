import { US_STATE_OPTIONS } from "@/app/forms/_core/usStates";
import type { FieldBlockProps, FieldOption } from "./formPageTypes";

/** Options the public form and validator actually use for a field. */
export function resolveFieldOptions(field: FieldBlockProps): FieldOption[] {
  if (field.optionSource === "usStates") {
    return US_STATE_OPTIONS;
  }

  return field.options ?? [];
}
