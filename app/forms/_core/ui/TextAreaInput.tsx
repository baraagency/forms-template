import { Field } from "./Field";
import { baseInputClassName } from "./classNames";
import { joinClassNames } from "./joinClassNames";
import type { TextAreaInputProps } from "./types";

export function TextAreaInput({
  label,
  id,
  hint,
  required,
  wrapperClassName,
  className,
  ...props
}: TextAreaInputProps) {
  const placeholderText = props.placeholder ?? label;

  return (
    <div className={wrapperClassName}>
      <Field label={label} htmlFor={id} required={required} hint={hint}>
        <textarea
          id={id}
          required={required}
          placeholder={placeholderText}
          className={joinClassNames(baseInputClassName, "bara-textarea", className)}
          {...props}
        />
      </Field>
    </div>
  );
}
