import { useId } from "react";

/**
 * Stable ids for label / error / hint linkage (`aria-describedby`, `htmlFor`).
 */
export function useFieldIds(name: string) {
  const reactId = useId();
  const base = `${name}-${reactId.replace(/:/g, "")}`;
  return {
    inputId: `${base}-input`,
    errorId: `${base}-error`,
    hintId: `${base}-hint`,
  };
}

export function fieldDescribedBy(
  errorId: string,
  hintId: string,
  options: { hasError?: boolean; hasHint?: boolean },
): string | undefined {
  const ids: string[] = [];
  if (options.hasError) {
    ids.push(errorId);
  }
  if (options.hasHint) {
    ids.push(hintId);
  }
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function fieldErrorId(fieldId: string): string {
  return `${fieldId}-error`;
}

export function fieldA11yProps(
  fieldId: string,
  error?: string,
): {
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
} {
  if (!error) {
    return {};
  }
  return {
    "aria-invalid": true,
    "aria-describedby": fieldErrorId(fieldId),
  };
}

/** Combobox/select uses `aria-errormessage`, not `aria-describedby`. */
export function fieldSelectA11yProps(
  fieldId: string,
  error?: string,
): {
  "aria-invalid"?: boolean;
  "aria-errormessage"?: string;
} {
  if (!error) {
    return {};
  }
  return {
    "aria-invalid": true,
    "aria-errormessage": fieldErrorId(fieldId),
  };
}
