import { describe, expect, it } from "bun:test";
import type { FieldBlockProps } from "../formPageTypes";
import { validatePageValues } from "../formPageValidation";

const requiredText: FieldBlockProps = {
  id: "city",
  label: "City",
  kind: "text",
  required: true,
};
const optionalText: FieldBlockProps = {
  id: "notes",
  label: "Notes",
  kind: "text",
  required: false,
};
const choice: FieldBlockProps = {
  id: "state",
  label: "State",
  kind: "choice",
  required: true,
  options: [{ label: "South Carolina", value: "SC" }],
};
const multi: FieldBlockProps = {
  id: "tags",
  label: "Tags",
  kind: "multiChoice",
  required: false,
  options: [{ label: "A", value: "a" }],
};
const currency: FieldBlockProps = {
  id: "amount",
  label: "Amount",
  kind: "currency",
  required: true,
};
const date: FieldBlockProps = {
  id: "settlementDate",
  label: "Closed Date",
  kind: "date",
  required: true,
  dateConstraint: "past",
};
const email: FieldBlockProps = {
  id: "email",
  label: "Email",
  kind: "email",
  required: false,
};

describe("validatePageValues", () => {
  it("requires visible required fields and ignores optional empties", () => {
    expect(validatePageValues([requiredText, optionalText], {})).toEqual({
      city: "This field is required.",
    });
    expect(validatePageValues([optionalText], { notes: "" })).toEqual({});
  });

  it("rejects values outside the option snapshot", () => {
    expect(validatePageValues([choice], { state: "GA" }).state).toBeTruthy();
    expect(validatePageValues([choice], { state: "SC" })).toEqual({});
  });

  it("validates multi-select membership and arrays", () => {
    expect(validatePageValues([multi], { tags: ["a"] })).toEqual({});
    expect(validatePageValues([multi], { tags: ["b"] }).tags).toBeTruthy();
    expect(validatePageValues([multi], { tags: "a" }).tags).toBeTruthy();
  });

  it("parses currency and numbers", () => {
    expect(validatePageValues([currency], { amount: "$1,234.56" })).toEqual({});
    expect(validatePageValues([currency], { amount: "abc" }).amount).toBeTruthy();
  });

  it("rejects future dates when the constraint is past", () => {
    const tomorrow = new Date(Date.now() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(
      validatePageValues([date], { settlementDate: tomorrow }).settlementDate,
    ).toBeTruthy();
    expect(
      validatePageValues([date], { settlementDate: "2020-01-01" }),
    ).toEqual({});
  });

  it("validates email shape", () => {
    expect(validatePageValues([email], { email: "not-an-email" }).email).toBeTruthy();
    expect(validatePageValues([email], { email: "a@b.co" })).toEqual({});
  });

  it("requires a boolean selection when required", () => {
    const booleanField: FieldBlockProps = {
      id: "flag",
      label: "Flag",
      kind: "boolean",
      required: true,
    };
    expect(validatePageValues([booleanField], {}).flag).toBeTruthy();
    expect(validatePageValues([booleanField], { flag: "true" })).toEqual({});
  });

  it("validates time and percentage values", () => {
    const time: FieldBlockProps = {
      id: "startTime",
      label: "Start Time",
      kind: "time",
      required: true,
    };
    const percentage: FieldBlockProps = {
      id: "referralPercent",
      label: "Referral Percent",
      kind: "percentage",
      required: false,
    };

    expect(validatePageValues([time], { startTime: "09:30" })).toEqual({});
    expect(validatePageValues([time], { startTime: "25:00" }).startTime).toBeTruthy();
    expect(validatePageValues([percentage], { referralPercent: "12.50%" })).toEqual({});
    expect(validatePageValues([percentage], { referralPercent: "101" }).referralPercent).toBeTruthy();
    expect(validatePageValues([percentage], { referralPercent: "abc" }).referralPercent).toBeTruthy();
  });
});
