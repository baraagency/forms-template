import { Input } from "@base-ui/react/input";
import { Field, baseInputClassName } from "./ui";
import type { InputHTMLAttributes } from "react";
import { EmailIcon, PhoneIcon } from "./communicationIcons";
import { FieldError } from "./FieldError";
import { fieldA11yProps } from "./useFieldIds";

type CommunicationKind = "email" | "phone";

export type CommunicationTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  hint?: string;
  wrapperClassName?: string;
  error?: string;
  /** Defaults from `type`: tel → phone, email → email. */
  communicationKind?: CommunicationKind;
};

function joinClassNames(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}

function resolveCommunicationKind(
  type?: string,
  explicit?: CommunicationKind,
): CommunicationKind {
  if (explicit) {
    return explicit;
  }
  if (type === "tel") {
    return "phone";
  }
  return "email";
}

/**
 * Text input with a left communication icon (phone or email).
 */
export function CommunicationTextInput({
  label,
  id,
  hint,
  required,
  wrapperClassName,
  className,
  type,
  communicationKind,
  placeholder,
  error,
  disabled,
  readOnly,
  ...props
}: CommunicationTextInputProps) {
  const kind = resolveCommunicationKind(type, communicationKind);
  const Icon = kind === "phone" ? PhoneIcon : EmailIcon;
  const placeholderText = placeholder ?? label;
  const a11y = fieldA11yProps(id, error);

  return (
    <div className={wrapperClassName}>
      <Field label={label} htmlFor={id} required={required} hint={hint}>
        <div className="communication-input__control-wrap">
          <span className="communication-input__icon">
            <Icon />
          </span>
          <Input
            type={type}
            required={required}
            placeholder={placeholderText}
            disabled={disabled}
            readOnly={readOnly}
            aria-readonly={readOnly || undefined}
            className={joinClassNames(
              baseInputClassName,
              "communication-input__control",
              error && "bara-input--error",
              className,
            )}
            render={(inputProps) => <input {...inputProps} id={id} />}
            {...props}
            {...a11y}
          />
        </div>
        <FieldError id={`${id}-error`} message={error} />
      </Field>
    </div>
  );
}
