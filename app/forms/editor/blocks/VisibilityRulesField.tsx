import { createUsePuck } from "@puckeditor/core";
import { collectPageFields } from "../formPageData";
import type {
  FormPageData,
  VisibilityOperator,
  VisibilityRule,
} from "../formPageTypes";

const usePuck = createUsePuck();

const OPERATORS: Array<{ value: VisibilityOperator; label: string }> = [
  { value: "equals", label: "equals" },
  { value: "notEquals", label: "does not equal" },
  { value: "in", label: "is one of" },
  { value: "isFilled", label: "is filled" },
  { value: "isEmpty", label: "is empty" },
];

function normalizeRules(value: unknown): VisibilityRule[] {
  return Array.isArray(value) ? (value as VisibilityRule[]) : [];
}

export function VisibilityRulesField({
  value,
  onChange,
  readOnly,
}: {
  value: unknown;
  onChange: (value: VisibilityRule[]) => void;
  readOnly?: boolean;
}) {
  const data = usePuck((state) => state.appState.data);
  const selectedId = usePuck(
    (state) => state.selectedItem?.props.id as string | undefined,
  );
  const fields = collectPageFields(data as unknown as FormPageData).filter(
    (field) => field.id !== selectedId,
  );
  const rules = normalizeRules(value);

  const update = (next: VisibilityRule[]) => {
    if (!readOnly) {
      onChange(next);
    }
  };

  if (fields.length === 0) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Add another field before creating a visibility rule.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rules.map((rule, index) => {
        const needsValue =
          rule.operator !== "isFilled" && rule.operator !== "isEmpty";

        return (
          <div
            key={`${rule.fieldId}-${index}`}
            className="space-y-2 rounded border border-[var(--divider-color)] p-2"
          >
            <select
              value={rule.fieldId}
              disabled={readOnly}
              aria-label="Controlling field"
              className="w-full rounded border border-[var(--divider-color)] bg-[var(--card-bg)] p-2 text-sm"
              onChange={(event) => {
                const next = [...rules];
                next[index] = { ...rule, fieldId: event.target.value };
                update(next);
              }}
            >
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>

            <select
              value={rule.operator}
              disabled={readOnly}
              aria-label="Visibility operator"
              className="w-full rounded border border-[var(--divider-color)] bg-[var(--card-bg)] p-2 text-sm"
              onChange={(event) => {
                const next = [...rules];
                next[index] = {
                  ...rule,
                  operator: event.target.value as VisibilityOperator,
                  values:
                    event.target.value === "isFilled" ||
                    event.target.value === "isEmpty"
                      ? undefined
                      : rule.values,
                };
                update(next);
              }}
            >
              {OPERATORS.map((operator) => (
                <option key={operator.value} value={operator.value}>
                  {operator.label}
                </option>
              ))}
            </select>

            {needsValue ? (
              <input
                value={(rule.values ?? []).join(", ")}
                disabled={readOnly}
                aria-label="Visibility values, comma separated"
                placeholder="Value or option label"
                className="w-full rounded border border-[var(--divider-color)] bg-[var(--card-bg)] p-2 text-sm"
                onChange={(event) => {
                  const values = event.target.value
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter(Boolean);
                  const next = [...rules];
                  next[index] = { ...rule, values };
                  update(next);
                }}
              />
            ) : null}

            <button
              type="button"
              disabled={readOnly}
              className="text-xs font-medium text-[var(--error-color)]"
              onClick={() => update(rules.filter((_, i) => i !== index))}
            >
              Remove rule
            </button>
          </div>
        );
      })}

      <button
        type="button"
        disabled={readOnly}
        className="text-xs font-medium text-[var(--brand-sky)]"
        onClick={() =>
          update([
            ...rules,
            {
              fieldId: fields[0].id,
              operator: "equals",
              values: [""],
            },
          ])
        }
      >
        Add rule
      </button>
    </div>
  );
}
