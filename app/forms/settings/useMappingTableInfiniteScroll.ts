import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const MAPPING_TABLE_BATCH_SIZE = 10;
export const MAPPING_TABLE_SKELETON_ROWS = 5;

const SCROLL_LOAD_THRESHOLD_PX = 24;

export function useMappingTableInfiniteScroll<T>(
  filteredRows: T[],
  resetKey: string,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(MAPPING_TABLE_BATCH_SIZE);

  useEffect(() => {
    setVisibleCount(MAPPING_TABLE_BATCH_SIZE);
    scrollRef.current?.scrollTo(0, 0);
  }, [resetKey]);

  const visibleRows = useMemo(
    () => filteredRows.slice(0, visibleCount),
    [filteredRows, visibleCount],
  );

  const hasMore = visibleCount < filteredRows.length;

  const loadMore = useCallback(() => {
    if (!hasMore) {
      return;
    }
    setVisibleCount((current) =>
      Math.min(current + MAPPING_TABLE_BATCH_SIZE, filteredRows.length),
    );
  }, [filteredRows.length, hasMore]);

  const onScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element || !hasMore) {
      return;
    }
    const nearBottom =
      element.scrollTop + element.clientHeight >=
      element.scrollHeight - SCROLL_LOAD_THRESHOLD_PX;
    if (nearBottom) {
      loadMore();
    }
  }, [hasMore, loadMore]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !hasMore) {
      return;
    }
    // Hidden panels report clientHeight 0; auto-loading there loads every row in the DOM.
    if (element.clientHeight === 0) {
      return;
    }
    if (element.scrollHeight <= element.clientHeight + 1) {
      loadMore();
    }
  }, [filteredRows.length, hasMore, loadMore, visibleCount, visibleRows.length]);

  return { scrollRef, visibleRows, hasMore, onScroll };
}
