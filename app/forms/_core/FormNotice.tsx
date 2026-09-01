import type { ReactNode } from "react";
import { Notice } from "./ui";

type FormNoticeTone = "success" | "warning" | "error";

type FormNoticeProps = {
  tone: FormNoticeTone;
  children: ReactNode;
};

/**
 * Local notice with error tone (bara `Notice` only supports success | warning).
 */
export function FormNotice({ tone, children }: FormNoticeProps) {
  if (tone === "error") {
    return (
      <div
        role="alert"
        className="form-notice form-notice--error bara-notice"
        style={{
          background: "color-mix(in srgb, var(--error-color) 10%, #ffffff)",
          color: "var(--error-color)",
          border: "1px solid color-mix(in srgb, var(--error-color) 25%, #ffffff)",
          borderRadius: "var(--btn-radius)",
          padding: "12px 16px",
          fontSize: "0.875rem",
          fontWeight: 700,
        }}
      >
        {children}
      </div>
    );
  }

  return <Notice tone={tone}>{children}</Notice>;
}
