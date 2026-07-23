import {
  primaryButtonClassName,
  Spinner,
} from "@baraagency/components";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

const PRIMARY_BUTTON_BASE_CLASS =
  `app-button-press form-router-launch-button ${primaryButtonClassName}`;

function joinClassNames(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}

type PrimaryButtonSharedProps = {
  children: ReactNode;
  className?: string;
  /** When true, shows a spinner instead of the label (no hover arrow). */
  loading?: boolean;
  /** When false, renders children as-is without the label/arrow wrapper. Default true. */
  withHoverArrow?: boolean;
};

type PrimaryButtonAsButtonProps = PrimaryButtonSharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type PrimaryButtonAsLinkProps = PrimaryButtonSharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
    disabled?: boolean;
  };

export type PrimaryButtonProps =
  | PrimaryButtonAsButtonProps
  | PrimaryButtonAsLinkProps;

function PrimaryButtonLabel({
  children,
  withHoverArrow,
}: {
  children: ReactNode;
  withHoverArrow: boolean;
}) {
  if (!withHoverArrow) {
    return children;
  }
  return (
    <span className="form-router-launch-button__title">{children}</span>
  );
}

/**
 * Shared primary CTA — gradient chrome, press feedback, and optional
 * label hover arrow (`>>`). Use `href` to render as a link.
 */
export function PrimaryButton(props: PrimaryButtonProps) {
  if ("href" in props && props.href != null) {
    const {
      children,
      className,
      loading = false,
      withHoverArrow = true,
      href,
      disabled,
      ...anchorRest
    } = props;

    return (
      <a
        {...anchorRest}
        href={href}
        className={joinClassNames(
          PRIMARY_BUTTON_BASE_CLASS,
          className,
          disabled && "opacity-50 pointer-events-none",
        )}
        aria-disabled={disabled || undefined}
      >
        {loading ? (
          <Spinner />
        ) : (
          <PrimaryButtonLabel withHoverArrow={withHoverArrow}>
            {children}
          </PrimaryButtonLabel>
        )}
      </a>
    );
  }

  const {
    children,
    className,
    loading = false,
    withHoverArrow = true,
    type = "button",
    disabled,
    ...buttonRest
  } = props;

  return (
    <button
      {...buttonRest}
      type={type}
      className={joinClassNames(PRIMARY_BUTTON_BASE_CLASS, className)}
      disabled={disabled || loading}
    >
      {loading ? (
        <Spinner />
      ) : (
        <PrimaryButtonLabel withHoverArrow={withHoverArrow}>
          {children}
        </PrimaryButtonLabel>
      )}
    </button>
  );
}
