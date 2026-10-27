import { describe, expect, it } from "bun:test";
import { CLOSED_PAGE_DOCUMENT } from "../closedPageDocument";
import { buildClosedSubmission } from "../closedPageSubmit";

const base = {
  personId: "123",
  agentId: "1",
  dealId: "456",
  sisuTransactionId: "789",
  clientType: "Buyer",
  transactionType: "none",
  addressLine1: "1 Main St",
  city: "Charleston",
  state: "SC",
  postal: "29401",
  transactionAmount: "$425,000.00",
  totalCommissionGci: "$12,750.00",
  settlementDate: "2020-01-01",
};

describe("buildClosedSubmission", () => {
  it("keeps editor-added fields in formState", () => {
    const extraDocument = {
      ...CLOSED_PAGE_DOCUMENT,
      content: [
        ...CLOSED_PAGE_DOCUMENT.content,
        {
          type: "FieldBlock" as const,
          props: {
            id: "extra",
            label: "Extra",
            kind: "text" as const,
            required: false,
          },
        },
      ],
    };

    const result = buildClosedSubmission(extraDocument, {
      ...base,
      extra: "kept",
    });

    expect(result.errors).toEqual({});
    expect(result.formState.extra).toBe("kept");
  });

  it("does not require hidden lease fields for a non-lease type", () => {
    const result = buildClosedSubmission(CLOSED_PAGE_DOCUMENT, {
      ...base,
      securityDeposit: "",
      monthlyRent: "",
    });

    expect(result.errors).toEqual({});
    expect(result.formState.securityDeposit).toBeUndefined();
  });

  it("requires lease fields when the type is lease", () => {
    const result = buildClosedSubmission(CLOSED_PAGE_DOCUMENT, {
      ...base,
      transactionType: "lease",
    });

    expect(result.errors.securityDeposit).toBeTruthy();
    expect(result.errors.monthlyRent).toBeTruthy();
  });

  it("keeps routing keys and drops unknown payload keys", () => {
    const result = buildClosedSubmission(CLOSED_PAGE_DOCUMENT, {
      ...base,
      unknown: "x",
    });

    expect(result.formState.personId).toBe("123");
    expect(result.formState.unknown).toBeUndefined();
  });

  it("requires a person id", () => {
    const result = buildClosedSubmission(CLOSED_PAGE_DOCUMENT, {
      ...base,
      personId: "",
    });

    expect(result.errors.personId).toBeTruthy();
  });
});
