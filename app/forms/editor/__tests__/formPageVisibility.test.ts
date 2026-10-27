import { describe, expect, it } from "bun:test";
import type { FieldBlockProps } from "../formPageTypes";
import { getVisiblePageFields, isPageFieldVisible } from "../formPageVisibility";

const transactionType: FieldBlockProps = {
  id: "transactionType",
  label: "Transaction Type",
  kind: "choice",
  required: true,
  options: [
    { label: "Lease Listing", value: "lease" },
    { label: "Rental/Tenant", value: "tenant" },
    { label: "None", value: "none" },
  ],
};

const deposit: FieldBlockProps = {
  id: "securityDeposit",
  label: "Security Deposit",
  kind: "currency",
  required: true,
  visibleWhen: [
    {
      fieldId: "transactionType",
      operator: "in",
      values: ["Lease Listing", "Rental/Tenant"],
    },
  ],
};

describe("visibility", () => {
  it("matches option labels and values", () => {
    const fields = new Map(
      [transactionType, deposit].map((field) => [field.id, field]),
    );

    expect(
      isPageFieldVisible(deposit, fields, { transactionType: "lease" }),
    ).toBe(true);
    expect(
      isPageFieldVisible(deposit, fields, { transactionType: "tenant" }),
    ).toBe(true);
    expect(
      isPageFieldVisible(deposit, fields, { transactionType: "none" }),
    ).toBe(false);
  });

  it("hides dependants when the controller is hidden", () => {
    const controller = {
      ...transactionType,
      visibleWhen: [{ fieldId: "clientType", operator: "isFilled" as const }],
    };
    const fields = new Map(
      [controller, deposit].map((field) => [field.id, field]),
    );

    expect(
      isPageFieldVisible(deposit, fields, { transactionType: "lease" }),
    ).toBe(false);
  });

  it("returns only visible fields in document order", () => {
    const fields = [transactionType, deposit];
    expect(
      getVisiblePageFields(fields, { transactionType: "none" }).map(
        (field) => field.id,
      ),
    ).toEqual(["transactionType"]);
  });

  it("supports isFilled and bool-like dependencies", () => {
    const toggle: FieldBlockProps = {
      id: "hasSecondary",
      label: "Secondary?",
      kind: "boolean",
      required: false,
    };
    const name: FieldBlockProps = {
      id: "secondaryName",
      label: "Secondary Name",
      kind: "text",
      required: true,
      visibleWhen: [{ fieldId: "hasSecondary", operator: "equals", values: ["true"] }],
    };
    const fields = new Map([toggle, name].map((field) => [field.id, field]));

    expect(
      isPageFieldVisible(name, fields, { hasSecondary: "true" }),
    ).toBe(true);
    expect(
      isPageFieldVisible(name, fields, { hasSecondary: "false" }),
    ).toBe(false);
  });
});
