import { useEffect, useRef } from "react";

type FieldErrorProps = {
  id: string;
  message?: string;
};

function joinClassNames(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Accessible field validation message — links via `aria-describedby` on the control.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const hadMessage = useRef(false);

  useEffect(() => {
    if (message && !hadMessage.current) {
      ref.current?.classList.remove("field-error--shake");
      void ref.current?.offsetWidth;
      ref.current?.classList.add("field-error--shake");
      hadMessage.current = true;
    }
    if (!message) {
      hadMessage.current = false;
    }
  }, [message]);

  if (!message) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={id}
      role="alert"
      className={joinClassNames(
        "field-error",
        "mt-1 text-xs font-medium text-[var(--error-color)]",
      )}
    >
      {message}
    </p>
  );
}
