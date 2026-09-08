import { describe, expect, it } from "bun:test";
import {
  compareFormFieldsByAppearanceOrder,
  isLockedClientTypeSisuMapping,
  sortByFormFieldAppearanceOrder,
  sortMappingsByMappedFirst,
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

describe("isLockedClientTypeSisuMapping", () => {
  it("locks the Client Type field on forms that have one", () => {
    expect(isLockedClientTypeSisuMapping("pending", "clientType")).toBe(true);
    expect(isLockedClientTypeSisuMapping("appointmentSet", "leadType")).toBe(
      true,
    );
    expect(isLockedClientTypeSisuMapping("appointmentMet", "leadType")).toBe(
      true,
    );
    expect(isLockedClientTypeSisuMapping("closed", "clientType")).toBe(true);
  });

  it("does not lock unrelated fields or forms without a Client Type field", () => {
    expect(isLockedClientTypeSisuMapping("pending", "clientFirstName")).toBe(
      false,
    );
    expect(isLockedClientTypeSisuMapping("closed", "transactionType")).toBe(
      false,
    );
  });
});

describe("sortMappingsByMappedFirst", () => {
  it("lists mapped rows before unmapped rows", () => {
    const sorted = sortMappingsByMappedFirst(
      "pending",
      [
        { field_name: "clientFirstName", mapped: false },
        { field_name: "clientLastName", mapped: true },
        { field_name: "clientEmail", mapped: false },
        { field_name: "clientType", mapped: true },
      ],
      (row) => row.mapped,
    );

    expect(sorted.map((row) => row.field_name)).toEqual([
      "clientLastName",
      "clientType",
      "clientFirstName",
      "clientEmail",
    ]);
  });
});
