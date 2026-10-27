import { useMemo, type ChangeEvent } from "react";
import {
  formatCurrencyInput,
  formatPercentageInput,
  formatPhoneInput,
  limitPercentageInputPrecision,
} from "@/app/forms/_core/formatUtils";
import { CommunicationTextInput } from "@/app/forms/_core/CommunicationTextInput";
import { FieldError } from "@/app/forms/_core/FieldError";
import {
  getMaxFormDateTodayForPicker,
} from "@/app/forms/_core/formDateValidation";
import { FormDatePickerField } from "@/app/forms/_core/formDatePickerField";
import { FormSelectInput } from "@/app/forms/_core/formSelectInput";
import { FormTimePickerField } from "@/app/forms/_core/formTimePickerField";
import {
  TextAreaInput,
  TextInput,
  baseLabelClassName,
} from "@/app/forms/_core/ui";
import { useFieldIds } from "@/app/forms/_core/useFieldIds";
import { resolveFieldOptions } from "../fieldOptions";
import { useFormRuntime } from "../FormRuntime";
import type { FieldBlockProps, FieldValue } from "../formPageTypes";
import { FieldTooltip } from "./FieldTooltip";

function asSingleValue(value: FieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function asArrayValue(value: FieldValue | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function describedBy(
  errorId: string,
  error: string | undefined,
  tooltipId: string | undefined,
  hasTooltip: boolean,
): string | undefined {
  const ids = [error ? errorId : null, hasTooltip ? tooltipId : null].filter(
    Boolean,
  );
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function FieldBlock({
  puck,
  ...field
}: FieldBlockProps & { puck?: { isEditing?: boolean } }) {
  const runtime = useFormRuntime();
  const { inputId, errorId } = useFieldIds(field.id);
  const isPreview = Boolean(puck?.isEditing) || !runtime || runtime.disabled;
  const value =
    runtime?.values[field.id] ??
    (field.kind === "multiChoice" ? [] : "");
  const error = runtime?.errors[field.id];
  const hasTooltip = Boolean(field.tooltip?.trim());
  const tooltipId = hasTooltip ? `${inputId}-tooltip` : undefined;

  const options = useMemo(() => {
    if (field.kind === "boolean") {
      return [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ];
    }
    return resolveFieldOptions(field);
  }, [field]);

  const setValue = (next: FieldValue) => {
    runtime?.setValue(field.id, next);
  };

  const described = describedBy(
    errorId,
    error,
    tooltipId,
    hasTooltip,
  );

  if (
    field.kind === "choice" ||
    field.kind === "boolean" ||
    field.kind === "multiChoice"
  ) {
    const isMulti = field.kind === "multiChoice";
    const useSelect =
      (field.kind === "choice" && field.display !== "radio") ||
      (field.kind === "boolean" && field.display === "select");
    const optionsUnavailable =
      Boolean(field.disableWhenEmpty) && options.length === 0;

    if (useSelect) {
      return (
        <div>
          <FormSelectInput
            id={inputId}
            label={field.label}
            value={asSingleValue(value)}
            required={field.required}
            disabled={isPreview || optionsUnavailable}
            error={error}
            describedBy={tooltipId}
            onChange={(event) => setValue(event.target.value)}
          >
            <option value="">
              {optionsUnavailable
                ? "Options unavailable"
                : field.placeholder || `Select ${field.label.toLowerCase()}`}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelectInput>
          {hasTooltip && tooltipId ? (
            <FieldTooltip id={tooltipId} label={field.label} text={field.tooltip!} />
          ) : null}
        </div>
      );
    }

    const selected = isMulti ? asArrayValue(value) : asSingleValue(value);

    return (
      <fieldset
        disabled={isPreview}
        aria-describedby={described}
        aria-invalid={Boolean(error)}
      >
        <legend className={baseLabelClassName}>
          {field.label}
          {field.required ? (
            <span className="bara-required-marker">*</span>
          ) : null}
        </legend>
        {hasTooltip && tooltipId ? (
          <FieldTooltip id={tooltipId} label={field.label} text={field.tooltip!} />
        ) : null}
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {options.map((option) => {
            const checked = isMulti
              ? selected.includes(option.value)
              : selected === option.value;
            return (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 text-sm"
              >
                <input
                  type={isMulti ? "checkbox" : "radio"}
                  name={field.id}
                  value={option.value}
                  checked={checked}
                  onChange={(event) => {
                    if (isMulti) {
                      const next = new Set(selected);
                      if (event.target.checked) {
                        next.add(option.value);
                      } else {
                        next.delete(option.value);
                      }
                      setValue([...next]);
                    } else {
                      setValue(option.value);
                    }
                  }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
        <FieldError id={errorId} message={error} />
      </fieldset>
    );
  }

  if (field.kind === "time") {
    const stringValue = asSingleValue(value);
    if (isPreview) {
      return (
        <div>
          <TextInput
            id={inputId}
            label={field.label}
            value={stringValue}
            required={field.required}
            disabled
            readOnly
          />
          {hasTooltip && tooltipId ? (
            <FieldTooltip id={tooltipId} label={field.label} text={field.tooltip!} />
          ) : null}
          <FieldError id={errorId} message={error} />
        </div>
      );
    }

    return (
      <div>
        <FormTimePickerField
          id={inputId}
          label={field.label}
          value={stringValue}
          required={field.required}
          error={error}
          describedBy={tooltipId}
          onChange={(next) => setValue(next)}
        />
        {hasTooltip && tooltipId ? (
          <FieldTooltip id={tooltipId} label={field.label} text={field.tooltip!} />
        ) : null}
      </div>
    );
  }

  if (field.kind === "date") {
    const stringValue = asSingleValue(value);
    if (isPreview) {
      return (
        <div>
          <TextInput
            id={inputId}
            label={field.label}
            value={stringValue}
            required={field.required}
            disabled
            readOnly
          />
          {hasTooltip && tooltipId ? (
            <FieldTooltip id={tooltipId} label={field.label} text={field.tooltip!} />
          ) : null}
          <FieldError id={errorId} message={error} />
        </div>
      );
    }

    return (
      <div>
        <FormDatePickerField
          id={inputId}
          label={field.label}
          value={stringValue}
          required={field.required}
          error={error}
          maxDate={
            field.dateConstraint === "past"
              ? getMaxFormDateTodayForPicker()
              : undefined
          }
          describedBy={tooltipId}
          onChange={(next) => setValue(next)}
        />
        {hasTooltip && tooltipId ? (
          <FieldTooltip id={tooltipId} label={field.label} text={field.tooltip!} />
        ) : null}
      </div>
    );
  }

  const stringValue = asSingleValue(value);

  if (field.kind === "phone" || field.kind === "email") {
    return (
      <div>
        <CommunicationTextInput
          id={inputId}
          label={field.label}
          type={field.kind === "phone" ? "tel" : "email"}
          value={stringValue}
          required={field.required}
          disabled={isPreview}
          placeholder={field.placeholder}
          error={error}
          describedBy={tooltipId}
          onBlur={
            field.kind === "phone"
              ? () => setValue(formatPhoneInput(stringValue))
              : undefined
          }
          onChange={(event) => setValue(event.target.value)}
        />
        {hasTooltip && tooltipId ? (
          <FieldTooltip id={tooltipId} label={field.label} text={field.tooltip!} />
        ) : null}
      </div>
    );
  }

  const commonProps = {
    id: inputId,
    label: field.label,
    value: stringValue,
    required: field.required,
    disabled: isPreview,
    placeholder: field.placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described,
    onChange: (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) =>
      setValue(
        field.kind === "percentage"
          ? limitPercentageInputPrecision(event.target.value)
          : event.target.value,
      ),
  };

  return (
    <div>
      {field.multiline ? (
        <TextAreaInput {...commonProps} rows={4} />
      ) : (
        <TextInput
          {...commonProps}
          type="text"
          inputMode={
            field.kind === "number" ||
            field.kind === "currency" ||
            field.kind === "percentage"
              ? "decimal"
              : undefined
          }
          onBlur={
            field.kind === "currency"
              ? () => setValue(formatCurrencyInput(stringValue))
              : field.kind === "percentage"
                ? () => setValue(formatPercentageInput(stringValue))
                : undefined
          }
        />
      )}
      {hasTooltip && tooltipId ? (
        <FieldTooltip id={tooltipId} label={field.label} text={field.tooltip!} />
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
