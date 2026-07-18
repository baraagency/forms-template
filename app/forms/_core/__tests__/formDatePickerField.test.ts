import { describe, expect, it } from "bun:test";
import {
  formDatePickerBehaviorProps,
  formDatePickerMobileSlotProps,
  shouldClosePickerAfterViewChange,
} from "../formDatePickerField";

describe("formDatePickerBehaviorProps", () => {
  it("closes after selecting a date and does not stay open while the field stays focused", () => {
    expect(formDatePickerBehaviorProps.closeOnSelect).toBe(true);
    expect(
      "keepOpenDuringFieldFocus" in formDatePickerBehaviorProps &&
        formDatePickerBehaviorProps.keepOpenDuringFieldFocus,
    ).toBe(false);
  });

  it("uses a single day view so mobile selection finishes in one tap", () => {
    expect(formDatePickerBehaviorProps.views).toEqual(["day"]);
    expect(formDatePickerBehaviorProps.openTo).toBe("day");
  });
});

describe("shouldClosePickerAfterViewChange", () => {
  it("closes after a calendar day tap, but not after typing in the field", () => {
    expect(shouldClosePickerAfterViewChange({ source: "view" })).toBe(true);
    expect(shouldClosePickerAfterViewChange({ source: "field" })).toBe(false);
    expect(shouldClosePickerAfterViewChange({ source: "unknown" })).toBe(false);
    expect(shouldClosePickerAfterViewChange(undefined)).toBe(false);
  });
});

describe("formDatePickerMobileSlotProps", () => {
  it("exposes a cancel action so touch users can dismiss without selecting", () => {
    expect(formDatePickerMobileSlotProps.actionBar).toEqual({
      actions: ["cancel"],
    });
  });
});
