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
  "boolean",
  "choice",
  "multiChoice",
  "date",
] as const;

export type FieldKind = (typeof FIELD_KINDS)[number];

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
  optionSource?: "manual" | "sisu" | "usStates";
  sisuFieldKey?: string;
  dateConstraint?: "past" | "future" | "any";
  visibleWhen?: VisibilityRule[];
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
