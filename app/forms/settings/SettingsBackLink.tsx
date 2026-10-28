import { FormRouterBackLink } from "../_core/formRouterBackLink";
import { secondaryButtonClassName } from "../_core/ui";

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export function SettingsBackLink({
  variant = "rail",
}: {
  variant?: "rail" | "button";
}) {
  return (
    <FormRouterBackLink
      href="/forms"
      className={
        variant === "rail"
          ? "settings-rail__back"
          : `settings-back-link app-button-press ${secondaryButtonClassName}`
      }
    >
      <ArrowLeftIcon />
      <span>Back to Form Router</span>
    </FormRouterBackLink>
  );
}
