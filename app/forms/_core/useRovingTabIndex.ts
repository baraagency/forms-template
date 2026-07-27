import { useCallback, useRef, type KeyboardEvent } from "react";

type UseRovingTabIndexOptions<T extends string> = {
  items: readonly T[];
  selected: T;
  onSelect: (item: T) => void;
  orientation?: "horizontal" | "vertical";
};

/**
 * WAI-ARIA tabs keyboard pattern: arrows, Home, End; Enter/Space activates.
 */
export function useRovingTabIndex<T extends string>({
  items,
  selected,
  onSelect,
  orientation = "horizontal",
}: UseRovingTabIndexOptions<T>) {
  const tabRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});

  const focusTab = useCallback((item: T) => {
    tabRefs.current[item]?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, item: T) => {
      const index = items.indexOf(item);
      if (index < 0) {
        return;
      }

      const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
      const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";

      let nextIndex: number | null = null;

      switch (event.key) {
        case prevKey:
          nextIndex = index === 0 ? items.length - 1 : index - 1;
          break;
        case nextKey:
          nextIndex = index === items.length - 1 ? 0 : index + 1;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = items.length - 1;
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          onSelect(item);
          return;
        default:
          return;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        const nextItem = items[nextIndex];
        onSelect(nextItem);
        focusTab(nextItem);
      }
    },
    [focusTab, items, onSelect, orientation],
  );

  const getTabProps = useCallback(
    (item: T) => ({
      ref: (el: HTMLButtonElement | null) => {
        tabRefs.current[item] = el;
      },
      tabIndex: item === selected ? 0 : -1,
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) =>
        onKeyDown(event, item),
      onClick: () => onSelect(item),
    }),
    [onKeyDown, onSelect, selected],
  );

  return { getTabProps };
}
