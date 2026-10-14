import { describe, expect, test } from "bun:test";
import {
  MAPPING_TABLE_BATCH_SIZE,
  MAPPING_TABLE_SKELETON_ROWS,
} from "../useMappingTableInfiniteScroll";

describe("useMappingTableInfiniteScroll constants", () => {
  test("loads ten rows per batch", () => {
    expect(MAPPING_TABLE_BATCH_SIZE).toBe(10);
  });

  test("skeleton matches viewport row count", () => {
    expect(MAPPING_TABLE_SKELETON_ROWS).toBe(5);
  });
});
