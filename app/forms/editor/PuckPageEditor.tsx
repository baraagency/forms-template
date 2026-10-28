import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createUsePuck, Puck } from "@puckeditor/core";
import "@puckeditor/core/no-external.css";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Link } from "react-router";
import {
  formKindToSlug,
  type SettingsFormKind,
} from "@/app/forms/_core/formIdentity";
import { formPageConfig } from "./formPageConfig";
import { formPageBlockLabel } from "./formPageData";
import type { FormPageData } from "./formPageTypes";
import { FormPreview } from "./FormPreview";
import { PageEditorFormProvider } from "./PageEditorFormContext";
import { PageOutline } from "./PageOutline";
import { usePageAutosave, type SaveStatus } from "./usePageAutosave";
import "./editor.css";

const STATUS_LABELS: Record<string, string> = {
  idle: "Draft saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  publishing: "Publishing…",
  saved: "Saved",
  conflict: "Changed elsewhere",
  error: "Save failed",
};

type Flash = {
  tone: "success" | "warning" | "error";
  messages: string[];
};

const usePuck = createUsePuck();

/** Explicit keyboard move actions; Puck's drag handle is pointer-first. */
function MoveBlockControls() {
  const selectedId = usePuck((state) => state.selectedItem?.props.id);
  const content = usePuck((state) => state.appState.data.content);
  const dispatch = usePuck((state) => state.dispatch);
  const getSelectorForId = usePuck((state) => state.getSelectorForId);

  if (!selectedId) {
    return null;
  }

  const selector = getSelectorForId(selectedId);
  const index = content.findIndex((block) => block.props.id === selectedId);
  if (!selector || index < 0) {
    return null;
  }

  const move = (offset: number) => {
    const destinationIndex = index + offset;
    if (destinationIndex < 0 || destinationIndex >= content.length) {
      return;
    }
    dispatch({
      type: "reorder",
      sourceIndex: index,
      destinationIndex,
      destinationZone: selector.zone ?? "root:default-zone",
    });
    // Keep the moved block selected; Puck otherwise keeps the old index and
    // selects whichever block landed there.
    dispatch({
      type: "setUi",
      ui: {
        itemSelector: {
          index: destinationIndex,
          zone: selector.zone ?? "root:default-zone",
        },
      },
    });
  };

  return (
    <div className="page-editor-move">
      <button
        type="button"
        className="page-editor__button"
        disabled={index === 0}
        onClick={() => move(-1)}
      >
        <ArrowUp size={14} aria-hidden="true" />
        Move up
      </button>
      <button
        type="button"
        className="page-editor__button"
        disabled={index === content.length - 1}
        onClick={() => move(1)}
      >
        <ArrowDown size={14} aria-hidden="true" />
        Move down
      </button>
    </div>
  );
}

type HeaderActionsState = {
  status: SaveStatus;
  errorMessage: string | null;
  publishError: boolean;
  slug: string;
  previewTriggerRef: RefObject<HTMLButtonElement | null>;
  onPreview: () => void;
  onRetry: () => void;
};

const HeaderActionsContext = createContext<HeaderActionsState | null>(null);

/**
 * Stable component identity so autosave status changes do not remount the
 * header and drop keyboard focus from the links and buttons.
 */
function PageEditorHeaderActions({ children }: { children: ReactNode }) {
  const state = useContext(HeaderActionsContext);
  if (!state) {
    return <div className="page-editor__actions">{children}</div>;
  }

  const {
    status,
    errorMessage,
    publishError,
    slug,
    previewTriggerRef,
    onPreview,
    onRetry,
  } = state;

  return (
    <div className="page-editor__actions">
      <button
        ref={previewTriggerRef}
        type="button"
        className="page-editor__button"
        data-page-editor-preview-trigger
        onClick={onPreview}
      >
        Preview form
      </button>
      <span className="page-editor__links">
        <Link to={`/forms/${slug}`} className="page-editor__link">
          Back to form
        </Link>
        <Link to="/forms/settings" className="page-editor__link">
          Form settings
        </Link>
      </span>
      <button
        type="button"
        className="page-editor__button page-editor__menu-button"
        popoverTarget="page-editor-menu"
      >
        More
      </button>
      <div
        id="page-editor-menu"
        popover="auto"
        className="page-editor__menu-panel"
      >
        <Link to={`/forms/${slug}`}>Back to form</Link>
        <Link to="/forms/settings">Form settings</Link>
      </div>
      <span
        className="page-editor__status"
        data-tone={
          status === "conflict"
            ? "conflict"
            : publishError || status === "error"
              ? "error"
              : undefined
        }
        title={
          publishError
            ? (errorMessage ?? "Publish failed.")
            : status === "error"
              ? (errorMessage ?? "Save failed.")
              : undefined
        }
      >
        {publishError ? "Publish failed" : (STATUS_LABELS[status] ?? status)}
        {(publishError || status === "error") && errorMessage ? (
          <span className="sr-only">: {errorMessage}</span>
        ) : null}
      </span>
      {status === "conflict" ? (
        <button
          type="button"
          className="page-editor__button page-editor__button--danger"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      ) : status === "error" && !publishError ? (
        <button type="button" className="page-editor__button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
      {children}
    </div>
  );
}

export function PuckPageEditor({
  form,
  formLabel,
  document: initialDocument,
  version,
}: {
  form: SettingsFormKind;
  formLabel: string;
  document: FormPageData;
  version: number;
}) {
  const { schedule, publish, retry, status, errorMessage } = usePageAutosave({
    form,
    initialVersion: version,
    initialData: initialDocument,
  });
  const [flash, setFlash] = useState<Flash | null>(null);
  const [publishError, setPublishError] = useState(false);
  const [draft, setDraft] = useState<FormPageData>(initialDocument);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewTriggerRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const publishingRef = useRef(false);
  const blockLabelsRef = useRef(new Map<string, string>());
  blockLabelsRef.current = new Map(
    draft.content.map((block) => [block.props.id, formPageBlockLabel(block)]),
  );
  const slug = formKindToSlug(form) ?? form;
  const headerActionsState: HeaderActionsState = {
    status,
    errorMessage,
    publishError,
    slug,
    previewTriggerRef,
    onPreview: () => setPreviewOpen(true),
    onRetry: () => {
      void retry();
    },
  };

  // shortcut: Puck 0.23 renders its rail tabs (Blocks/Outline) as click-only
  // divs. Make them keyboard operable; remove when Puck ships button semantics.
  useEffect(() => {
    const root = editorRef.current;
    if (!root) {
      return;
    }

    const cleanups = new Map<HTMLElement, () => void>();
    const applyAccessibilityFixes = () => {
      root
        .querySelectorAll<HTMLElement>('div[class*="NavItem-link"]')
        .forEach((item) => {
          if (cleanups.has(item)) {
            return;
          }

          item.setAttribute("role", "button");
          item.tabIndex = 0;

          const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Enter" && event.key !== " ") {
              return;
            }
            event.preventDefault();
            item.click();
          };
          item.addEventListener("keydown", onKeyDown);

          cleanups.set(item, () => {
            item.removeEventListener("keydown", onKeyDown);
            item.removeAttribute("role");
            item.removeAttribute("tabindex");
          });
        });

      // Puck labels the canvas loader with aria-label on a role-less span.
      root
        .querySelectorAll<HTMLElement>('span[aria-label][class*="Loader"]')
        .forEach((loader) => loader.setAttribute("role", "status"));

      // Canvas field contents are inert; name the block button from the field
      // label so it is still announced.
      root
        .querySelectorAll<HTMLElement>("[data-puck-component]")
        .forEach((wrapper) => {
          const id = wrapper.dataset.puckComponent;
          const label = id ? blockLabelsRef.current.get(id) : null;
          if (label) {
            wrapper.setAttribute("aria-label", label);
          }
        });
    };

    // Puck mounts its chrome after this effect runs.
    applyAccessibilityFixes();
    const observer = new MutationObserver(applyAccessibilityFixes);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    const root = editorRef.current;
    if (!root) {
      return;
    }

    draft.content.forEach((block) => {
      const wrapper = root.querySelector<HTMLElement>(
        `[data-puck-component="${CSS.escape(block.props.id)}"]`,
      );
      wrapper?.setAttribute("aria-label", formPageBlockLabel(block));
    });
  }, [draft]);

  return (
    <>
      <title>{`${formLabel} Page Editor`}</title>
      <main
        ref={editorRef}
        id="main-content"
        tabIndex={-1}
        className="page-editor"
      >
        <HeaderActionsContext.Provider value={headerActionsState}>
          <PageEditorFormProvider form={form}>
            <Puck
            config={formPageConfig}
            data={initialDocument}
            onChange={(data) => {
              setFlash(null);
              setPublishError(false);
              setDraft(data as unknown as FormPageData);
              schedule(data as unknown as FormPageData);
            }}
            onPublish={(data) => {
              if (publishingRef.current) {
                return;
              }
              publishingRef.current = true;
              setFlash(null);
              setPublishError(false);
              void publish(data as unknown as FormPageData)
                .then((result) => {
                  setFlash({
                    tone: result.warnings.length > 0 ? "warning" : "success",
                    messages: result.warnings,
                  });
                })
                .catch((error) => {
                  setPublishError(true);
                  setFlash({
                    tone: "error",
                    messages: [
                      error instanceof Error ? error.message : "Publish failed.",
                    ],
                  });
                })
                .finally(() => {
                  publishingRef.current = false;
                });
            }}
            headerTitle={formLabel}
            height="100dvh"
            iframe={{ enabled: false }}
            overrides={{
              outline: PageOutline,
              fields: ({ children, itemSelector }) =>
                itemSelector ? (
                  <div className="page-editor-fields">
                    <MoveBlockControls />
                    {children}
                  </div>
                ) : (
                  <p className="page-editor-fields__empty">
                    Select a block on the canvas to edit its settings.
                  </p>
                ),
              headerActions: PageEditorHeaderActions,
            }}
          />
          </PageEditorFormProvider>
        </HeaderActionsContext.Provider>
      </main>
      <span className="sr-only" role="status" aria-live="polite">
        {publishError
          ? ""
          : `${STATUS_LABELS[status] ?? status}${
              status === "error" && errorMessage ? `: ${errorMessage}` : ""
            }`}
      </span>
      {flash ? (
        <div
          className="page-editor__notice"
          data-tone={flash.tone}
          role={flash.tone === "success" ? "status" : "alert"}
        >
          <div>
            <p className="page-editor__notice-title">
              {flash.tone === "success"
                ? "Published"
                : flash.tone === "warning"
                  ? "Published with warnings"
                  : "Publish failed"}
            </p>
            {flash.messages.length > 0 ? (
              <ul className="page-editor__notice-list">
                {flash.messages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <button
            type="button"
            className="page-editor__notice-dismiss"
            aria-label="Dismiss notification"
            onClick={() => setFlash(null)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {previewOpen ? (
        <FormPreview
          pageDocument={draft}
          returnFocusTo={previewTriggerRef}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}
