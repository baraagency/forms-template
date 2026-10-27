import { resolveFieldOptions } from "./fieldOptions";
import type {
  FieldBlockProps,
  FieldValue,
  VisibilityRule,
} from "./formPageTypes";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function selectedValues(value: FieldValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  return typeof value === "string" && value.length > 0 ? [value] : [];
}

function matchesValue(
  field: FieldBlockProps,
  value: FieldValue | undefined,
  target: string,
): boolean {
  const normalizedTarget = normalize(target);
  if (!normalizedTarget) {
    return false;
  }

  const options = resolveFieldOptions(field);
  const selected = selectedValues(value);

  return selected.some((entry) => {
    if (normalize(entry) === normalizedTarget) {
      return true;
    }
    const option = options.find((candidate) => candidate.value === entry);
    return option ? normalize(option.label) === normalizedTarget : false;
  });
}

function isFilled(value: FieldValue | undefined): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return typeof value === "string" && value.trim().length > 0;
}

function ruleMatches(
  rule: VisibilityRule,
  field: FieldBlockProps,
  values: Record<string, FieldValue>,
): boolean {
  const value = values[rule.fieldId];

  switch (rule.operator) {
    case "isFilled":
      return isFilled(value);
    case "isEmpty":
      return !isFilled(value);
    case "equals":
      return matchesValue(field, value, rule.values?.[0] ?? "");
    case "notEquals":
      return !matchesValue(field, value, rule.values?.[0] ?? "");
    case "in":
      return (rule.values ?? []).some((target) =>
        matchesValue(field, value, target),
      );
    default:
      return false;
  }
}

/**
 * All rules are ANDed. Dependants of a hidden field are hidden too, and a
 * cycle resolves to hidden rather than recursing forever.
 */
export function isPageFieldVisible(
  field: FieldBlockProps,
  fieldsById: ReadonlyMap<string, FieldBlockProps>,
  values: Record<string, FieldValue>,
  stack: ReadonlySet<string> = new Set(),
): boolean {
  if (stack.has(field.id)) {
    return false;
  }

  const nextStack = new Set(stack);
  nextStack.add(field.id);

  return (field.visibleWhen ?? []).every((rule) => {
    const controller = fieldsById.get(rule.fieldId);
    if (!controller) {
      return false;
    }
    if (!isPageFieldVisible(controller, fieldsById, values, nextStack)) {
      return false;
    }
    return ruleMatches(rule, controller, values);
  });
}

export function getVisiblePageFields(
  fields: readonly FieldBlockProps[],
  values: Record<string, FieldValue>,
): FieldBlockProps[] {
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  return fields.filter((field) =>
    isPageFieldVisible(field, fieldsById, values),
  );
}
