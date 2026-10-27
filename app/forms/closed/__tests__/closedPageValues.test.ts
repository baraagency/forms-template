import { describe, expect, it } from "bun:test";
import { CLOSED_PAGE_DOCUMENT } from "../closedPageDocument";
import { buildInitialClosedValues } from "../closedPageValues";

describe("buildInitialClosedValues", () => {
  it("seeds every field and keeps routing keys available for submit", () => {
    const values = buildInitialClosedValues({
      document: CLOSED_PAGE_DOCUMENT,
      personId: "123",
      agentId: "1",
      dealId: "456",
      sisuTransactionId: "789",
      previousSubmissionFormData: null,
    });

    expect(values.clientType).toBe("");
    expect(values.transactionAmount).toBe("");
    expect(values.personId).toBe("123");
  });

  it("applies previous submission values by field id", () => {
    const values = buildInitialClosedValues({
      document: CLOSED_PAGE_DOCUMENT,
      personId: "123",
      agentId: "",
      dealId: "",
      sisuTransactionId: "",
      previousSubmissionFormData: {
        addressLine1: "1 Main St",
        transactionAmount: "$5,000",
      },
    });

    expect(values.addressLine1).toBe("1 Main St");
    expect(values.transactionAmount).toBe("$5,000");
  });

  it("seeds fields added by the editor", () => {
    const values = buildInitialClosedValues({
      document: {
        ...CLOSED_PAGE_DOCUMENT,
        content: [
          ...CLOSED_PAGE_DOCUMENT.content,
          {
            type: "FieldBlock",
            props: {
              id: "extra",
              label: "Extra",
              kind: "text",
              required: false,
            },
          },
        ],
      },
      personId: "",
      agentId: "",
      dealId: "",
      sisuTransactionId: "",
      previousSubmissionFormData: null,
    });

    expect(values.extra).toBe("");
  });
});
