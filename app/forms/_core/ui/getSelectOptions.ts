import { Children, isValidElement, type ReactNode } from "react";
import type { SelectOption } from "./types";

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return "";
}

export function getSelectOptions(children: ReactNode): {
  options: SelectOption[];
  placeholder?: string;
} {
  const options: SelectOption[] = [];
  let placeholder: string | undefined;

  function visit(node: ReactNode) {
    Children.forEach(node, (child) => {
      if (!isValidElement<{
        children?: ReactNode;
        value?: string | number;
        disabled?: boolean;
      }>(child)) {
        return;
      }

      if (child.type === "optgroup") {
        visit(child.props.children);
        return;
      }

      if (child.type !== "option") {
        visit(child.props.children);
        return;
      }

      const optionValue = child.props.value;
      const value = optionValue === undefined ? "" : String(optionValue);
      const label = getNodeText(child.props.children);
      const isDisabled = Boolean(child.props.disabled);

      if (value === "") {
        placeholder = label || placeholder;
        return;
      }

      options.push({
        value,
        label,
        isDisabled,
      });
    });
  }

  visit(children);
  return { options, placeholder };
}
