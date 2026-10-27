import {
  FIELD_DISPLAY_MODES,
  FIELD_KINDS,
  MAX_PAGE_BLOCKS,
  PAGE_BLOCK_TYPES,
  VISIBILITY_OPERATORS,
  type FieldBlockProps,
  type FieldOption,
  type FormPageBlock,
  type FormPageData,
  type PageBlockType,
  type ParseResult,
  type VisibilityRule,
} from "./formPageTypes";

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function parseOptions(value: unknown): FieldOption[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const options: FieldOption[] = [];
  const seen = new Set<string>();

  for (const option of value) {
    if (!isRecord(option)) {
      return null;
    }

    const label = option.label;
    const optionValue = option.value;
    if (!isNonEmptyString(label) || !isString(optionValue)) {
      return null;
    }
    if (seen.has(optionValue)) {
      return null;
    }

    seen.add(optionValue);
    options.push({ label: label.trim(), value: optionValue });
  }

  return options;
}

function parseVisibilityRule(value: unknown): VisibilityRule | null {
  if (!isRecord(value)) {
    return null;
  }

  const fieldId = value.fieldId;
  const operator = value.operator;
  if (!isNonEmptyString(fieldId) || !isOneOf(operator, VISIBILITY_OPERATORS)) {
    return null;
  }

  if (operator === "isFilled" || operator === "isEmpty") {
    return { fieldId, operator };
  }

  if (!Array.isArray(value.values) || value.values.length === 0) {
    return null;
  }
  if (!value.values.every((entry) => isString(entry))) {
    return null;
  }

  return { fieldId, operator, values: value.values as string[] };
}

function parseFieldBlock(
  props: RecordValue,
  forPublish: boolean,
): { ok: true; field: FieldBlockProps } | { ok: false; error: string } {
  const label = props.label;
  const kind = props.kind;
  const required = props.required;

  if (!isNonEmptyString(label)) {
    return { ok: false, error: "Field label is required." };
  }
  if (!isOneOf(kind, FIELD_KINDS)) {
    return { ok: false, error: `Unknown field kind for "${label}".` };
  }
  if (!isBoolean(required)) {
    return { ok: false, error: `Field "${label}" is missing required.` };
  }

  const optionSource = props.optionSource ?? "manual";
  if (!isOneOf(optionSource, ["manual", "sisu", "usStates"] as const)) {
    return { ok: false, error: `Unknown option source for "${label}".` };
  }

  let options: FieldOption[] | undefined;
  if (props.options !== undefined) {
    const parsedOptions = parseOptions(props.options);
    if (!parsedOptions) {
      return { ok: false, error: `Invalid options for "${label}".` };
    }
    options = parsedOptions;
  }

  if (optionSource === "sisu" && !isNonEmptyString(props.sisuFieldKey)) {
    return { ok: false, error: `SISU field key is required for "${label}".` };
  }

  if (
    forPublish &&
    (kind === "choice" || kind === "multiChoice") &&
    optionSource !== "usStates" &&
    (options?.length ?? 0) === 0
  ) {
    return {
      ok: false,
      error: `Field "${label}" needs at least one option before publishing.`,
    };
  }

  let display: FieldBlockProps["display"];
  if (props.display !== undefined) {
    if (!isOneOf(props.display, FIELD_DISPLAY_MODES)) {
      return { ok: false, error: `Invalid display mode for "${label}".` };
    }
    display = props.display;
  }

  let visibleWhen: VisibilityRule[] | undefined;
  if (props.visibleWhen !== undefined) {
    if (!Array.isArray(props.visibleWhen)) {
      return { ok: false, error: `Invalid visibility rules for "${label}".` };
    }
    const rules: VisibilityRule[] = [];
    for (const rawRule of props.visibleWhen) {
      const rule = parseVisibilityRule(rawRule);
      if (!rule) {
        return { ok: false, error: `Invalid visibility rule for "${label}".` };
      }
      if (rule.fieldId === props.id) {
        return {
          ok: false,
          error: `Field "${label}" cannot depend on itself.`,
        };
      }
      rules.push(rule);
    }
    visibleWhen = rules;
  }

  const field: FieldBlockProps = {
    id: props.id as string,
    label: label.trim(),
    kind,
    required,
    optionSource,
    options,
    display,
    visibleWhen,
  };

  if (props.multiline !== undefined) {
    if (!isBoolean(props.multiline)) {
      return { ok: false, error: `Invalid multiline flag for "${label}".` };
    }
    field.multiline = props.multiline;
  }
  if (props.tooltip !== undefined) {
    if (!isString(props.tooltip)) {
      return { ok: false, error: `Invalid tooltip for "${label}".` };
    }
    field.tooltip = props.tooltip;
  }
  if (props.placeholder !== undefined) {
    if (!isString(props.placeholder)) {
      return { ok: false, error: `Invalid placeholder for "${label}".` };
    }
    field.placeholder = props.placeholder;
  }
  if (props.sisuFieldKey !== undefined) {
    if (!isString(props.sisuFieldKey)) {
      return { ok: false, error: `Invalid SISU field key for "${label}".` };
    }
    field.sisuFieldKey = props.sisuFieldKey;
  }
  if (props.dateConstraint !== undefined) {
    if (!isOneOf(props.dateConstraint, ["past", "future", "any"] as const)) {
      return { ok: false, error: `Invalid date constraint for "${label}".` };
    }
    field.dateConstraint = props.dateConstraint;
  }

  return { ok: true, field };
}

function hasVisibilityCycle(
  fieldsById: Map<string, FieldBlockProps>,
): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string): boolean {
    if (visiting.has(id)) {
      return true;
    }
    if (visited.has(id)) {
      return false;
    }

    visiting.add(id);
    const field = fieldsById.get(id);
    for (const rule of field?.visibleWhen ?? []) {
      if (fieldsById.has(rule.fieldId) && visit(rule.fieldId)) {
        return true;
      }
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  for (const id of fieldsById.keys()) {
    if (visit(id)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a Puck page document at the trust boundary. Drafts may contain
 * incomplete choice fields; publishes may not.
 */
export function parseFormPageData(
  value: unknown,
  options: { forPublish?: boolean } = {},
): ParseResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Page document must be an object." };
  }

  if (value.zones !== undefined) {
    if (!isRecord(value.zones) || Object.keys(value.zones).length > 0) {
      return { ok: false, error: "Nested page zones are not supported." };
    }
  }

  const content = value.content;
  if (!Array.isArray(content)) {
    return { ok: false, error: "Page content must be an array." };
  }
  if (content.length > MAX_PAGE_BLOCKS) {
    return {
      ok: false,
      error: `A page can contain at most ${MAX_PAGE_BLOCKS} blocks.`,
    };
  }

  const root = value.root;
  if (!isRecord(root) || !isRecord(root.props)) {
    return { ok: false, error: "Page root props are required." };
  }

  const blocks: FormPageBlock[] = [];
  const ids = new Set<string>();
  const fieldsById = new Map<string, FieldBlockProps>();

  for (const rawBlock of content) {
    if (!isRecord(rawBlock)) {
      return { ok: false, error: "Every page block must be an object." };
    }

    const type = rawBlock.type;
    if (!isOneOf(type, PAGE_BLOCK_TYPES)) {
      return { ok: false, error: `Unknown page block type: ${String(type)}.` };
    }

    const props = rawBlock.props;
    if (!isRecord(props) || !isNonEmptyString(props.id)) {
      return { ok: false, error: `Block ${type} is missing an id.` };
    }

    const id = props.id;
    if (ids.has(id)) {
      return { ok: false, error: `Duplicate block id: ${id}.` };
    }
    ids.add(id);

    if (type === "PageTitle") {
      if (!isString(props.text)) {
        return { ok: false, error: "Page title text must be a string." };
      }
    } else if (type === "SectionHeader") {
      if (!isString(props.title)) {
        return { ok: false, error: "Section header title must be a string." };
      }
    } else if (type === "TextBlock") {
      if (!isString(props.text)) {
        return { ok: false, error: "Text block text must be a string." };
      }
    } else if (type === "FieldBlock") {
      const parsed = parseFieldBlock(props, options.forPublish === true);
      if (!parsed.ok) {
        return parsed;
      }
      fieldsById.set(parsed.field.id, parsed.field);
    }

    blocks.push({
      type: type as PageBlockType,
      props: props as FormPageBlock["props"],
    });
  }

  for (const field of fieldsById.values()) {
    for (const rule of field.visibleWhen ?? []) {
      if (!fieldsById.has(rule.fieldId)) {
        return {
          ok: false,
          error: `Field "${field.label}" depends on a missing field.`,
        };
      }
    }
  }

  if (hasVisibilityCycle(fieldsById)) {
    return { ok: false, error: "Visibility rules cannot form a cycle." };
  }

  return {
    ok: true,
    data: { content: blocks, root: { props: root.props } },
  };
}

/** Fields in document order. Call only on a document that passed the parser. */
export function collectPageFields(data: FormPageData): FieldBlockProps[] {
  return data.content
    .filter((block) => block.type === "FieldBlock")
    .map((block) => block.props as unknown as FieldBlockProps);
}
