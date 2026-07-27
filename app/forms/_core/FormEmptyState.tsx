import type { ReactNode } from "react";

type FormEmptyStateProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Muted empty hint for lists and mapping tables.
 */
export function FormEmptyState({
  children,
  className,
}: FormEmptyStateProps) {
  return (
    <p
      role="status"
      className={
        className ??
        "settings-hint text-sm text-[var(--body-color)] italic"
      }
    >
      {children}
    </p>
  );
}
