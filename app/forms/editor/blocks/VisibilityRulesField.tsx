import { createUsePuck } from "@puckeditor/core";
import { Plus } from "lucide-react";
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
      <p className="page-editor__helper">
        Add another field before creating a visibility rule.
      </p>
    );
  }

  return (
    <fieldset className="page-editor-rules">
      <legend className="page-editor-rules__legend">
        Visible when all of these match
      </legend>

      {rules.length === 0 ? (
        <p className="page-editor__helper">
          No rules yet, so this field is always visible.
        </p>
      ) : null}

      {rules.map((rule, index) => {
        const needsValue =
          rule.operator !== "isFilled" && rule.operator !== "isEmpty";
        const fieldMissing = !fields.some(
          (field) => field.id === rule.fieldId,
        );
        const ruleLabel = `Rule ${index + 1}`;

        return (
          <div key={`${rule.fieldId}-${index}`} className="page-editor-rule">
            <div className="page-editor-rule__head">
              <span className="page-editor-rule__index">{ruleLabel}</span>
              <button
                type="button"
                disabled={readOnly}
                className="page-editor__text-button page-editor__text-button--danger"
                onClick={() => update(rules.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>

            <select
              value={rule.fieldId}
              disabled={readOnly}
              aria-label={`${ruleLabel} controlling field`}
              className="page-editor__control"
              onChange={(event) => {
                const next = [...rules];
                next[index] = { ...rule, fieldId: event.target.value };
                update(next);
              }}
            >
              {fieldMissing ? (
                <option value={rule.fieldId}>Missing field</option>
              ) : null}
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>

            <select
              value={rule.operator}
              disabled={readOnly}
              aria-label={`${ruleLabel} condition`}
              className="page-editor__control"
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
                aria-label={`${ruleLabel} values, comma separated`}
                placeholder="e.g. Buyer, Seller"
                className="page-editor__control"
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
          </div>
        );
      })}

      <button
        type="button"
        disabled={readOnly}
        className="page-editor__text-button"
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
        <Plus size={13} aria-hidden="true" />
        Add rule
      </button>
    </fieldset>
  );
}
