import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { collectPageFields } from "./formPageData";
import { FormRuntimeProvider } from "./FormRuntime";
import { PageRenderer } from "./PageRenderer";
import type { FieldValue, FormPageData } from "./formPageTypes";

export function buildPreviewValues(
  document: FormPageData,
): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const field of collectPageFields(document)) {
    values[field.id] = field.kind === "multiChoice" ? [] : "";
  }
  return values;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Read-only-ish preview of the draft using the published renderer. Controls are
 * interactive so conditional fields can be exercised before publishing.
 */
export function FormPreview({
  pageDocument,
  onClose,
  returnFocusTo,
}: {
  pageDocument: FormPageData;
  onClose: () => void;
  returnFocusTo?: RefObject<HTMLElement | null>;
}) {
  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    buildPreviewValues(pageDocument),
  );
  const [announcement, setAnnouncement] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell =
      document.querySelector<HTMLElement>(".app-shell") ??
      document.getElementById("root");
    const skipLink = document.querySelector<HTMLElement>(".skip-to-main");
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    document.body.style.overflow = "hidden";
    shell?.setAttribute("inert", "");
    skipLink?.setAttribute("inert", "");
    dialogRef.current?.focus();

    return () => {
      shell?.removeAttribute("inert");
      skipLink?.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;
      const fallbackFocus = returnFocusTo?.current ?? previousFocus;
      // Puck re-renders its header on close; focus after that commit instead of
      // landing on <body>.
      window.requestAnimationFrame(() => {
        const trigger = document.querySelector<HTMLElement>(
          "[data-page-editor-preview-trigger]",
        );
        (trigger ?? fallbackFocus)?.focus();
      });
    };
  }, [returnFocusTo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (document.activeElement === dialogRef.current) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-preview-title"
      aria-describedby="form-preview-hint"
      tabIndex={-1}
      className="page-editor-preview"
    >
      <div className="page-editor-preview__bar">
        <div>
          <h2 id="form-preview-title" className="page-editor-preview__title">
            Preview
          </h2>
          <p id="form-preview-hint" className="page-editor-preview__hint">
            Interactive draft preview. Nothing is submitted.
          </p>
        </div>
        <div className="page-editor-preview__actions">
          <span className="sr-only" role="status">
            {announcement}
          </span>
          <button
            type="button"
            className="page-editor__button"
            onClick={() => {
              setValues(buildPreviewValues(pageDocument));
              setAnnouncement("Preview fields reset.");
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="page-editor__button"
            onClick={onClose}
          >
            Back to editor
          </button>
        </div>
      </div>

      <div className="page-editor-preview__body">
        <div className="page-editor-preview__form page-form">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <FormRuntimeProvider
              value={{
                values,
                errors: {},
                setValue: (fieldId, value) =>
                  setValues((current) => ({ ...current, [fieldId]: value })),
              }}
            >
              <PageRenderer document={pageDocument} />
            </FormRuntimeProvider>
          </LocalizationProvider>
        </div>
      </div>
    </div>,
    document.body,
  );
}
