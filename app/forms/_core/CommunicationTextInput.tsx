import { Field, baseInputClassName } from "@baraagency/components";
import type { InputHTMLAttributes } from "react";
import { EmailIcon, PhoneIcon } from "./communicationIcons";

type CommunicationKind = "email" | "phone";

export type CommunicationTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  hint?: string;
  wrapperClassName?: string;
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
  ...props
}: CommunicationTextInputProps) {
  const kind = resolveCommunicationKind(type, communicationKind);
  const Icon = kind === "phone" ? PhoneIcon : EmailIcon;
  const placeholderText = placeholder ?? label;

  return (
    <div className={wrapperClassName}>
      <Field label={label} htmlFor={id} required={required} hint={hint}>
        <div className="communication-input__control-wrap">
          <span className="communication-input__icon">
            <Icon />
          </span>
          <input
            id={id}
            type={type}
            required={required}
            placeholder={placeholderText}
            className={joinClassNames(
              baseInputClassName,
              "communication-input__control",
              className,
            )}
            {...props}
          />
        </div>
      </Field>
    </div>
  );
}
