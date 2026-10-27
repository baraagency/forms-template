import { useState } from "react";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { formKindToSlug, type SettingsFormKind } from "@/app/forms/_core/formIdentity";
import { formPageConfig } from "./formPageConfig";
import type { FormPageData } from "./formPageTypes";
import { FormPreview } from "./FormPreview";
import { PageOutline } from "./PageOutline";
import { usePageAutosave } from "./usePageAutosave";

const STATUS_LABELS: Record<string, string> = {
  idle: "Ready",
  saving: "Saving…",
  saved: "Saved",
  conflict: "This page changed elsewhere",
  error: "Save failed",
};

export function PuckPageEditor({
  form,
  formLabel,
  document,
  version,
}: {
  form: SettingsFormKind;
  formLabel: string;
  document: FormPageData;
  version: number;
}) {
  const { schedule, publish, status, errorMessage } = usePageAutosave({
    form,
    initialVersion: version,
    initialData: document,
  });
  const [flash, setFlash] = useState<string | null>(null);
  const [draft, setDraft] = useState<FormPageData>(document);
  const [previewOpen, setPreviewOpen] = useState(false);
  const slug = formKindToSlug(form) ?? form;

  return (
    <>
      <Puck
        config={formPageConfig}
        data={document}
        onChange={(data) => {
          setFlash(null);
          setDraft(data as unknown as FormPageData);
          schedule(data as unknown as FormPageData);
        }}
        onPublish={(data) => {
          setFlash(null);
          void publish(data as unknown as FormPageData)
            .then((result) => {
              setFlash(
                result.warnings.length > 0
                  ? result.warnings.join(" ")
                  : "Published",
              );
            })
            .catch((error) => {
              setFlash(
                error instanceof Error ? error.message : "Publish failed.",
              );
            });
        }}
        headerTitle={`${formLabel} page`}
        height="100dvh"
        iframe={{ enabled: false }}
        overrides={{
          outline: PageOutline,
          headerActions: ({ children }) => (
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                className="rounded border border-[var(--divider-color)] px-3 py-1.5 font-medium"
                onClick={() => setPreviewOpen(true)}
              >
                Preview form
              </button>
              <a href={`/forms/${slug}`} className="underline underline-offset-2">
                Back to form
              </a>
              <a href="/forms/settings" className="underline underline-offset-2">
                Manage mappings
              </a>
              {status === "conflict" ? (
                <button
                  type="button"
                  className="font-medium text-red-600"
                  onClick={() => window.location.reload()}
                >
                  Reload
                </button>
              ) : (
                <span aria-live="polite">
                  {status === "error"
                    ? (errorMessage ?? "Save failed")
                    : (flash ?? STATUS_LABELS[status] ?? status)}
                </span>
              )}
              {children}
            </div>
          ),
        }}
      />
      {previewOpen ? (
        <FormPreview
          pageDocument={draft}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}
