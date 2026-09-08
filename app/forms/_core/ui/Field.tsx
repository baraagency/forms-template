import { Field as BaseField } from "@base-ui/react/field";
import type { ReactNode } from "react";
import { baseLabelClassName } from "./classNames";
import { joinClassNames } from "./joinClassNames";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  invalid,
  children,
}: {
  label?: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <BaseField.Root className="bara-field" invalid={invalid}>
      {label ? (
        <div className="bara-field__label-row">
          <BaseField.Label
            htmlFor={htmlFor}
            className={joinClassNames(
              baseLabelClassName,
              hint && "bara-label--hinted",
            )}
          >
            {label}
            {required ? <span className="bara-required-marker">*</span> : null}
          </BaseField.Label>
          {hint ? <p className="bara-field__hint">{hint}</p> : null}
        </div>
      ) : null}
      {children}
    </BaseField.Root>
  );
}
