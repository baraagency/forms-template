import { Input } from "@base-ui/react/input";
import { Field } from "./Field";
import { baseInputClassName } from "./classNames";
import { joinClassNames } from "./joinClassNames";
import type { TextInputProps } from "./types";

export function TextInput({
  label,
  id,
  hint,
  required,
  wrapperClassName,
  className,
  ...props
}: TextInputProps) {
  const placeholderText = props.placeholder ?? label;

  return (
    <div className={wrapperClassName}>
      <Field label={label} htmlFor={id} required={required} hint={hint}>
        <Input
          required={required}
          placeholder={placeholderText}
          className={joinClassNames(baseInputClassName, className)}
          render={(inputProps) => <input {...inputProps} id={id} />}
          {...props}
        />
      </Field>
    </div>
  );
}
