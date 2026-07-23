import { describe, expect, it } from "bun:test";
import {
  compareFormFieldsByAppearanceOrder,
  sortByFormFieldAppearanceOrder,
} from "../formFieldCatalog";

describe("sortByFormFieldAppearanceOrder", () => {
  it("orders closed fields as they appear on the form", () => {
    const sorted = sortByFormFieldAppearanceOrder("closed", [
      { field_name: "tcMarketingNotes" },
      { field_name: "transactionAmount" },
      { field_name: "transactionType" },
      { field_name: "totalCommissionGci" },
      { field_name: "unknownExtra" },
    ]);

    expect(sorted.map((row) => row.field_name)).toEqual([
      "transactionType",
      "transactionAmount",
      "totalCommissionGci",
      "tcMarketingNotes",
      "unknownExtra",
    ]);
  });

  it("puts Client Type before Transaction Amount on pending", () => {
    expect(
      compareFormFieldsByAppearanceOrder(
        "pending",
        "clientType",
        "transactionAmount",
      ),
    ).toBeLessThan(0);
  });

  it("puts appointment set notes after location fields", () => {
    expect(
      compareFormFieldsByAppearanceOrder(
        "appointmentSet",
        "appointmentLocation",
        "notes",
      ),
    ).toBeLessThan(0);
  });
});
