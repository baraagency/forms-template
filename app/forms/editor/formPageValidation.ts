import {
  formDateOnOrAfterTodayError,
  formDateOnOrBeforeTodayError,
  isFormDateOnOrAfterToday,
  isFormDateOnOrBeforeToday,
} from "@/app/forms/_core/formDateValidation";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { resolveFieldOptions } from "./fieldOptions";
import type { FieldBlockProps, FieldValue } from "./formPageTypes";

dayjs.extend(customParseFormat);

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function asString(value: FieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function isBlank(value: FieldValue | undefined): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return asString(value).trim().length === 0;
}

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateChoice(
  field: FieldBlockProps,
  value: FieldValue | undefined,
): string | undefined {
  if (field.kind === "multiChoice") {
    if (!Array.isArray(value)) {
      return "Select a valid option.";
    }
    const allowed = new Set(resolveFieldOptions(field).map((option) => option.value));
    return value.every((entry) => allowed.has(entry))
      ? undefined
      : "Select a valid option.";
  }

  if (Array.isArray(value)) {
    return "Select a valid option.";
  }
  const stringValue = asString(value);
  if (!stringValue) {
    return undefined;
  }
  return resolveFieldOptions(field).some(
    (option) => option.value === stringValue,
  )
    ? undefined
    : "Select a valid option.";
}

export function validatePageValues(
  fields: readonly FieldBlockProps[],
  values: Record<string, FieldValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = values[field.id];

    if (isBlank(value)) {
      if (field.required) {
        errors[field.id] = "This field is required.";
      }
      continue;
    }

    if (field.kind === "choice" || field.kind === "multiChoice") {
      const error = validateChoice(field, value);
      if (error) {
        errors[field.id] = error;
      }
      continue;
    }

    if (field.kind === "boolean") {
      if (value !== "true" && value !== "false") {
        errors[field.id] = "Select Yes or No.";
      }
      continue;
    }

    if (field.kind === "date") {
      const stringValue = asString(value);
      if (!dayjs(stringValue, "YYYY-MM-DD", true).isValid()) {
        errors[field.id] = "Enter a valid date.";
      } else if (
        field.dateConstraint === "past" &&
        !isFormDateOnOrBeforeToday(stringValue)
      ) {
        errors[field.id] = formDateOnOrBeforeTodayError(field.label);
      } else if (
        field.dateConstraint === "future" &&
        !isFormDateOnOrAfterToday(stringValue)
      ) {
        errors[field.id] = formDateOnOrAfterTodayError(field.label);
      }
      continue;
    }

    if (Array.isArray(value)) {
      errors[field.id] = "Enter a single value.";
      continue;
    }

    const stringValue = value.trim();

    if (field.kind === "number" && parseNumber(stringValue) === null) {
      errors[field.id] = "Enter a valid number.";
      continue;
    }

    if (field.kind === "currency" && parseNumber(stringValue) === null) {
      errors[field.id] = "Enter a valid amount.";
      continue;
    }

    if (field.kind === "email" && !EMAIL_PATTERN.test(stringValue)) {
      errors[field.id] = "Enter a valid email address.";
      continue;
    }

    if (
      field.kind === "phone" &&
      stringValue.replace(/\D/g, "").length < 7
    ) {
      errors[field.id] = "Enter a valid phone number.";
    }
  }

  return errors;
}
