import { createUsePuck } from "@puckeditor/core";
import { LayoutGrid } from "lucide-react";
import type { FormPageBlock, FormPageData } from "./formPageTypes";

const usePuck = createUsePuck();

const TYPE_LABELS: Record<string, string> = {
  PageTitle: "Page title",
  SectionHeader: "Section header",
  Divider: "Divider",
  TextBlock: "Plain text",
};

function outlineLabel(block: FormPageBlock): string {
  if (block.type === "FieldBlock") {
    const label = block.props.label;
    return typeof label === "string" && label.trim() ? label : "Untitled field";
  }

  if (block.type === "PageTitle") {
    const text = block.props.text;
    return typeof text === "string" && text.trim()
      ? text
      : (TYPE_LABELS[block.type] ?? block.type);
  }

  if (block.type === "SectionHeader") {
    const title = block.props.title;
    return typeof title === "string" && title.trim()
      ? title
      : (TYPE_LABELS[block.type] ?? block.type);
  }

  return TYPE_LABELS[block.type] ?? block.type;
}

/** Flat outline for the form page; fields show their editable labels. */
export function PageOutline() {
  const data = usePuck((state) => state.appState.data);
  const selectedId = usePuck((state) => state.selectedItem?.props.id);
  const dispatch = usePuck((state) => state.dispatch);
  const getSelectorForId = usePuck((state) => state.getSelectorForId);
  const page = data as unknown as FormPageData;

  const select = (id: string) => {
    const selector = getSelectorForId(id);
    if (!selector) {
      return;
    }

    dispatch({ type: "setUi", ui: { itemSelector: selector } });
    window.document
      .querySelector(`[data-puck-component="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div
      data-testid="page-outline"
      className="flex h-full flex-col overflow-auto p-3"
    >
      <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        Outline
      </h2>
      <ul className="space-y-0.5">
        {page.content.map((block) => {
          const id = block.props.id;
          const isSelected = id === selectedId;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => select(id)}
                aria-current={isSelected ? "true" : undefined}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                  isSelected
                    ? "bg-sky-100 font-medium text-sky-950"
                    : "hover:bg-slate-100"
                }`}
              >
                <LayoutGrid size={14} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{outlineLabel(block)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {page.content.length === 0 ? (
        <p className="px-2 text-xs text-[var(--muted-foreground)]">
          No blocks yet.
        </p>
      ) : null}
    </div>
  );
}
