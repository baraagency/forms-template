export const PAGE_BLOCK_TYPES = [
  "PageTitle",
  "SectionHeader",
  "Divider",
  "TextBlock",
  "FieldBlock",
] as const;

export type PageBlockType = (typeof PAGE_BLOCK_TYPES)[number];

export const FIELD_KINDS = [
  "text",
  "phone",
  "email",
  "number",
  "currency",
  "percentage",
  "boolean",
  "choice",
  "multiChoice",
  "date",
  "time",
] as const;

export type FieldKind = (typeof FIELD_KINDS)[number];

export const FIELD_OPTION_SOURCES = [
  "manual",
  "sisu",
  "sisuAgents",
  "sisuVendors",
  "fubUsers",
  "fubAppointmentTypes",
  "usStates",
] as const;

export type FieldOptionSource = (typeof FIELD_OPTION_SOURCES)[number];

export const FIELD_DISPLAY_MODES = ["radio", "select"] as const;
export type FieldDisplay = (typeof FIELD_DISPLAY_MODES)[number];

export type FieldValue = string | string[];

export type FieldOption = {
  label: string;
  value: string;
};

export const VISIBILITY_OPERATORS = [
  "equals",
  "notEquals",
  "in",
  "isFilled",
  "isEmpty",
] as const;

export type VisibilityOperator = (typeof VISIBILITY_OPERATORS)[number];

export type VisibilityRule = {
  fieldId: string;
  operator: VisibilityOperator;
  values?: string[];
};

export type FieldBlockProps = {
  id: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  display?: FieldDisplay;
  multiline?: boolean;
  tooltip?: string;
  placeholder?: string;
  options?: FieldOption[];
  optionSource?: FieldOptionSource;
  /** SISU field key for optionSource=sisu. */
  sisuFieldKey?: string;
  /** Role filter (sisuAgents) or vendor group (sisuVendors). */
  optionFilter?: string;
  disableWhenEmpty?: boolean;
  dateConstraint?: "past" | "future" | "any";
  visibleWhen?: VisibilityRule[];
  /** Inspector-only custom field; not rendered as a form value. */
  mappings?: unknown;
};

export type FormPageBlock = {
  type: PageBlockType;
  props: { id: string } & Record<string, unknown>;
};

export type FormPageData = {
  content: FormPageBlock[];
  root: { props: Record<string, unknown> };
  zones?: Record<string, never>;
};

export type ParseResult =
  | { ok: true; data: FormPageData }
  | { ok: false; error: string };

export const MAX_PAGE_BLOCKS = 200;
export const MAX_PAGE_BYTES = 262_144;
