import { describe, expect, it } from "bun:test";
import { buildPageSubmission } from "../formPageSubmission";
import type { FormPageData } from "../formPageTypes";

const document: FormPageData = {
  content: [
    {
      type: "FieldBlock",
      props: {
        id: "clientType",
        label: "Client Type",
        kind: "choice",
        required: true,
        options: [{ label: "Buyer", value: "Buyer" }],
      },
    },
    {
      type: "FieldBlock",
      props: {
        id: "transactionType",
        label: "Type",
        kind: "choice",
        required: true,
        options: [
          { label: "Lease", value: "lease" },
          { label: "None", value: "none" },
        ],
      },
    },
    {
      type: "FieldBlock",
      props: {
        id: "deposit",
        label: "Deposit",
        kind: "currency",
        required: true,
        visibleWhen: [
          {
            fieldId: "transactionType",
            operator: "equals",
            values: ["Lease"],
          },
        ],
      },
    },
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
  root: { props: {} },
};

describe("buildPageSubmission", () => {
  it("drops hidden values and their validation", () => {
    const result = buildPageSubmission(document, {
      clientType: "Buyer",
      transactionType: "none",
      deposit: "100",
      extra: "x",
    });

    expect(result.values).toEqual({
      clientType: "Buyer",
      transactionType: "none",
      extra: "x",
    });
    expect(result.errors).toEqual({});
  });

  it("validates a visible conditional field", () => {
    const result = buildPageSubmission(document, {
      clientType: "Buyer",
      transactionType: "lease",
    });

    expect(result.errors.deposit).toBeTruthy();
  });

  it("includes editor-added fields", () => {
    const result = buildPageSubmission(document, {
      clientType: "Buyer",
      transactionType: "none",
      extra: "kept",
    });

    expect(result.values.extra).toBe("kept");
  });

  it("normalizes multi-select arrays and rejects unknown options", () => {
    const multi: FormPageData = {
      content: [
        {
          type: "FieldBlock",
          props: {
            id: "tags",
            label: "Tags",
            kind: "multiChoice",
            required: false,
            options: [{ label: "A", value: "a" }],
          },
        },
      ],
      root: { props: {} },
    };

    expect(buildPageSubmission(multi, { tags: ["a"] }).values.tags).toEqual([
      "a",
    ]);
    expect(buildPageSubmission(multi, { tags: ["b"] }).errors.tags).toBeTruthy();
  });
});
