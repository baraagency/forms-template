import { createUsePuck } from "@puckeditor/core";
import {
  Heading1,
  Heading2,
  Layers,
  Minus,
  TextCursorInput,
  Type,
  type LucideIcon,
} from "lucide-react";
import { formPageBlockLabel } from "./formPageData";
import type { FormPageData } from "./formPageTypes";

const usePuck = createUsePuck();

const TYPE_ICONS: Record<string, LucideIcon> = {
  PageTitle: Heading1,
  SectionHeader: Heading2,
  Divider: Minus,
  TextBlock: Type,
  FieldBlock: TextCursorInput,
};

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
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.document
      .querySelector(`[data-puck-component="${CSS.escape(id)}"]`)
      ?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
  };

  return (
    <nav
      data-testid="page-outline"
      aria-label="Page outline"
      className="page-editor-outline"
    >
      <h2 className="page-editor-outline__title">Outline</h2>
      <ul className="page-editor-outline__list">
        {page.content.map((block) => {
          const id = block.props.id;
          const label = formPageBlockLabel(block);
          const isSelected = id === selectedId;
          const Icon = TYPE_ICONS[block.type] ?? Layers;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => select(id)}
                aria-current={isSelected ? "true" : undefined}
                title={label}
                className="page-editor-outline__item"
              >
                <Icon size={14} aria-hidden="true" className="shrink-0" />
                <span className="page-editor-outline__label">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {page.content.length === 0 ? (
        <p className="page-editor-outline__empty">
          No blocks yet. Drag a block from Blocks to start.
        </p>
      ) : null}
    </nav>
  );
}
