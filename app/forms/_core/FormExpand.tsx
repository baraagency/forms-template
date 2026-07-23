import type { ReactNode } from "react";

type FormExpandProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Enter animation for conditionally mounted field groups
 * (indent blocks that appear when an answer is Yes, etc.).
 */
export function FormExpand({ children, className }: FormExpandProps) {
  return (
    <div
      className={
        className ? `form-expand ${className}` : "form-expand"
      }
    >
      {children}
    </div>
  );
}

type FormAccordionProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Keep-mounted expand/collapse via grid-template-rows (0fr ↔ 1fr).
 * Prefer FormExpand for form fields that must leave the DOM when hidden.
 */
export function FormAccordion({
  open,
  children,
  className,
}: FormAccordionProps) {
  return (
    <div
      className={className ? `t-acc ${className}` : "t-acc"}
      data-open={open ? "true" : "false"}
    >
      <div className="t-acc-panel">
        <div className="t-acc-panel-inner">{children}</div>
      </div>
    </div>
  );
}
