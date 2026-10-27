import { describe, expect, it } from "bun:test";
import type { TeamFieldCatalog } from "@/app/forms/_core/teamFieldOptions";
import { resolvePublishedPageOptions } from "../formPagePublish";
import type { FormPageData } from "../formPageTypes";

const document: FormPageData = {
  content: [
    {
      type: "FieldBlock",
      props: {
        id: "transactionType",
        label: "Transaction Type",
        kind: "choice",
        required: true,
        optionSource: "sisu",
        sisuFieldKey: "transactionType",
        options: [{ label: "Old", value: "old" }],
      },
    },
    {
      type: "FieldBlock",
      props: {
        id: "manual",
        label: "Manual",
        kind: "choice",
        required: false,
        optionSource: "manual",
        options: [{ label: "A", value: "a" }],
      },
    },
  ],
  root: { props: {} },
};

const catalog: TeamFieldCatalog = {
  transactionType: {
    name: "transactionType",
    label: "Transaction Type",
    type: "dropdown",
    custom: false,
    options: [
      { value: "lease", label: "Lease Listing" },
      { value: "none", label: "None" },
    ],
  },
};

describe("resolvePublishedPageOptions", () => {
  it("replaces SISU options and leaves manual options alone", async () => {
    const result = await resolvePublishedPageOptions(document, async () => ({
      data: catalog,
      error: null,
    }));

    expect(result.data.content[0].props.options).toEqual([
      { value: "lease", label: "Lease Listing" },
      { value: "none", label: "None" },
    ]);
    expect(result.data.content[1].props.options).toEqual([
      { label: "A", value: "a" },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps the existing snapshot and warns when the catalog fails", async () => {
    const result = await resolvePublishedPageOptions(document, async () => ({
      data: null,
      error: "offline",
    }));

    expect(result.data.content[0].props.options).toEqual([
      { label: "Old", value: "old" },
    ]);
    expect(result.warnings[0]).toContain("SISU");
  });
});
