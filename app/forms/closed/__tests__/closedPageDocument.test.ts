import { describe, expect, it } from "bun:test";
import { collectPageFields } from "@/app/forms/editor/formPageData";
import { CLOSED_PAGE_DOCUMENT } from "../closedPageDocument";
import { getInitialClosedFormState } from "../closedFormUtils";

describe("CLOSED_PAGE_DOCUMENT", () => {
  it("uses the existing Closed field keys as ids", () => {
    const routingKeys = new Set([
      "personId",
      "agentId",
      "dealId",
      "sisuTransactionId",
    ]);
    const expected = Object.keys(getInitialClosedFormState({})).filter(
      (key) => !routingKeys.has(key),
    );

    expect(collectPageFields(CLOSED_PAGE_DOCUMENT).map((field) => field.id)).toEqual(
      expected,
    );
  });

  it("marks the current required fields", () => {
    const required = collectPageFields(CLOSED_PAGE_DOCUMENT)
      .filter((field) => field.required)
      .map((field) => field.id);

    expect(required).toEqual(
      expect.arrayContaining([
        "clientType",
        "transactionType",
        "addressLine1",
        "city",
        "state",
        "postal",
        "transactionAmount",
        "totalCommissionGci",
        "settlementDate",
        "securityDeposit",
        "monthlyRent",
      ]),
    );
  });

  it("shows lease/rental amounts only for lease or tenant", () => {
    const deposit = collectPageFields(CLOSED_PAGE_DOCUMENT).find(
      (field) => field.id === "securityDeposit",
    );

    expect(deposit?.visibleWhen?.[0]).toMatchObject({
      fieldId: "transactionType",
      operator: "in",
      values: expect.arrayContaining(["Lease Listing", "Rental/Tenant"]),
    });
  });

  it("constrains settlementDate to past dates", () => {
    expect(
      collectPageFields(CLOSED_PAGE_DOCUMENT).find(
        (field) => field.id === "settlementDate",
      )?.dateConstraint,
    ).toBe("past");
  });

  it("keeps the existing intro copy", () => {
    const intro = CLOSED_PAGE_DOCUMENT.content.find(
      (block) => block.props.id === "closed-intro",
    );

    expect(intro?.type).toBe("TextBlock");
    expect(intro?.props.text).toBe(
      "Capture closed transaction details for this lead.",
    );
  });
});
