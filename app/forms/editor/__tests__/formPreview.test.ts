import { describe, expect, it } from "bun:test";
import { CLOSED_PAGE_DOCUMENT } from "@/app/forms/closed/closedPageDocument";
import { buildPreviewValues } from "../FormPreview";

describe("buildPreviewValues", () => {
  it("seeds every field with an empty value", () => {
    const values = buildPreviewValues(CLOSED_PAGE_DOCUMENT);

    expect(values.clientType).toBe("");
    expect(values.transactionAmount).toBe("");
    expect(values.settlementDate).toBe("");
  });
});
