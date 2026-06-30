import type {
  FUBContactMethod,
  FUBPerson,
  FUBRelationship,
  FUBRelationshipPerson,
} from "@/app/types/fub";

type DatePickerValue = {
  format: (format: string) => string;
};

export type SecondaryContactPrefill = {
  name: string;
  phone: string;
  email: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getStringValue(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function getContactValue(record: Record<string, unknown>, contactKey: string, fallbackKeys: string[]): string {
  const contacts = record[contactKey];
  if (Array.isArray(contacts)) {
    return getPrimaryContactValue(contacts as FUBContactMethod[]);
  }

  return getStringValue(record, fallbackKeys);
}

function getRelationshipPerson(relationship: FUBRelationship): FUBRelationshipPerson {
  return relationship.person ?? relationship.relatedPerson ?? relationship;
}

export function splitPersonName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function getPrimaryContactValue(contacts?: FUBContactMethod[]): string {
  if (!contacts?.length) {
    return "";
  }

  return contacts.find((contact) => contact.isPrimary)?.value ?? contacts[0]?.value ?? "";
}

export function getFirstRelationshipSecondaryContact(
  person: FUBPerson,
): SecondaryContactPrefill {
  const firstRelationship = person.relationships?.[0];
  if (!firstRelationship) {
    return { name: "", phone: "", email: "" };
  }

  const relationshipPerson = getRelationshipPerson(firstRelationship);
  const relationshipRecord = asRecord(relationshipPerson);
  if (!relationshipRecord) {
    return { name: "", phone: "", email: "" };
  }

  const firstName = getStringValue(relationshipRecord, ["firstName", "first_name"]);
  const lastName = getStringValue(relationshipRecord, ["lastName", "last_name"]);
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    getStringValue(relationshipRecord, ["name", "fullName", "full_name"]);
  const phone = getContactValue(relationshipRecord, "phones", [
    "phone",
    "mobilePhone",
    "mobile_phone",
    "cellPhone",
    "cell_phone",
  ]);
  const email = getContactValue(relationshipRecord, "emails", ["email"]);

  return {
    name: fullName,
    phone: formatPhoneInput(phone),
    email,
  };
}

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) {
    return value;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatCurrencyInput(value: string): string {
  const normalizedValue = value.replace(/[$,\s]/g, "");
  if (!normalizedValue) {
    return "";
  }

  const numericValue = Number(normalizedValue);
  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function formatPercentageInput(value: string): string {
  const normalizedValue = value.replace(/[%\s]/g, "");
  if (!normalizedValue) {
    return "";
  }

  const numericValue = Number(normalizedValue);
  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)}%`;
}

export function limitPercentageInputPrecision(value: string): string {
  const hasPercentSuffix = value.endsWith("%");
  const editableValue = hasPercentSuffix ? value.slice(0, -1) : value;
  const decimalIndex = editableValue.indexOf(".");

  if (decimalIndex === -1) {
    return value;
  }

  const wholePart = editableValue.slice(0, decimalIndex);
  const decimalPart = editableValue.slice(decimalIndex + 1, decimalIndex + 3);
  return `${wholePart}.${decimalPart}${hasPercentSuffix ? "%" : ""}`;
}

export function formatDatePickerValue(value: DatePickerValue | null): string {
  return value ? value.format("YYYY-MM-DD") : "";
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 10;
}
