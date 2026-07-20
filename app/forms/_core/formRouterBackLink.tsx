import { secondaryButtonClassName } from "@baraagency/components";
import type { ReactNode } from "react";

type FormRouterBackLinkProps = {
  href: string;
  className?: string;
  children?: ReactNode;
};

export function FormRouterBackLink({
  href,
  className,
  children = "Back to Form Router",
}: FormRouterBackLinkProps) {
  return (
    <a
      href={href}
      className={className ?? secondaryButtonClassName}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(href);
      }}
    >
      {children}
    </a>
  );
}
