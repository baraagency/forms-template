import { useEffect, useRef, useState } from "react";
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

/**
 * Read-only-ish preview of the draft using the published renderer. Controls are
 * interactive so conditional fields can be exercised before publishing.
 */
export function FormPreview({
  pageDocument,
  onClose,
}: {
  pageDocument: FormPageData;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    buildPreviewValues(pageDocument),
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.getElementById("root");
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    document.body.style.overflow = "hidden";
    root?.setAttribute("inert", "");
    closeButtonRef.current?.focus();

    return () => {
      root?.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
      role="dialog"
      aria-modal="true"
      aria-label="Form preview"
      className="fixed inset-0 z-[100] overflow-auto bg-slate-50"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--divider-color)] bg-[var(--card-bg)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Preview</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Interactive draft preview. Nothing is submitted.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-[var(--divider-color)] px-3 py-1.5 text-sm"
            onClick={() => setValues(buildPreviewValues(pageDocument))}
          >
            Reset
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded border border-[var(--divider-color)] px-3 py-1.5 text-sm font-medium"
            onClick={onClose}
          >
            Back to editor
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="page-form">
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
