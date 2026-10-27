import { describe, expect, it } from "bun:test";
import { collectPageFields, parseFormPageData } from "../formPageData";

const validField = {
  id: "clientType",
  label: "Client Type",
  kind: "choice",
  required: true,
  display: "select",
  optionSource: "manual",
  options: [
    { label: "Buyer", value: "Buyer" },
    { label: "Seller", value: "Seller" },
  ],
};

function pageWith(content: unknown[]) {
  return { content, root: { props: {} } };
}

describe("parseFormPageData", () => {
  it("accepts a flat page and collects fields in order", () => {
    const result = parseFormPageData(
      pageWith([
        { type: "PageTitle", props: { id: "title", text: "Closed" } },
        { type: "FieldBlock", props: validField },
        {
          type: "FieldBlock",
          props: { ...validField, id: "city", kind: "text", label: "City" },
        },
      ]),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(collectPageFields(result.data).map((field) => field.id)).toEqual([
      "clientType",
      "city",
    ]);
  });

  it("rejects duplicate block ids", () => {
    const result = parseFormPageData(
      pageWith([
        { type: "PageTitle", props: { id: "same", text: "A" } },
        { type: "PageTitle", props: { id: "same", text: "B" } },
      ]),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Duplicate");
  });

  it("rejects unknown block types and non-empty zones", () => {
    expect(
      parseFormPageData(pageWith([{ type: "Image", props: { id: "x" } }])).ok,
    ).toBe(false);
    expect(
      parseFormPageData({
        content: [],
        root: { props: {} },
        zones: { "x:zone": [] },
      }).ok,
    ).toBe(false);
  });

  it("allows an empty choice draft but rejects it on publish", () => {
    const draft = pageWith([
      { type: "FieldBlock", props: { ...validField, options: [] } },
    ]);

    expect(parseFormPageData(draft).ok).toBe(true);
    expect(parseFormPageData(draft, { forPublish: true }).ok).toBe(false);
  });

  it("allows a US states field with no stored options on publish", () => {
    const result = parseFormPageData(
      pageWith([
        {
          type: "FieldBlock",
          props: {
            ...validField,
            id: "state",
            label: "State",
            kind: "choice",
            optionSource: "usStates",
            options: undefined,
          },
        },
      ]),
      { forPublish: true },
    );

    expect(result.ok).toBe(true);
  });

  it("rejects visibility rules that reference missing fields or themselves", () => {
    const missing = pageWith([
      {
        type: "FieldBlock",
        props: {
          ...validField,
          visibleWhen: [{ fieldId: "nope", operator: "isFilled" }],
        },
      },
    ]);
    const self = pageWith([
      {
        type: "FieldBlock",
        props: {
          ...validField,
          visibleWhen: [{ fieldId: "clientType", operator: "isFilled" }],
        },
      },
    ]);

    expect(parseFormPageData(missing).ok).toBe(false);
    expect(parseFormPageData(self).ok).toBe(false);
  });

  it("rejects visibility cycles", () => {
    const result = parseFormPageData(
      pageWith([
        {
          type: "FieldBlock",
          props: {
            ...validField,
            id: "a",
            label: "A",
            visibleWhen: [{ fieldId: "b", operator: "isFilled" }],
          },
        },
        {
          type: "FieldBlock",
          props: {
            ...validField,
            id: "b",
            label: "B",
            visibleWhen: [{ fieldId: "a", operator: "isFilled" }],
          },
        },
      ]),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("cycle");
  });

  it("rejects a SISU field without a field key", () => {
    const result = parseFormPageData(
      pageWith([
        {
          type: "FieldBlock",
          props: { ...validField, optionSource: "sisu", options: [] },
        },
      ]),
    );

    expect(result.ok).toBe(false);
  });
});
