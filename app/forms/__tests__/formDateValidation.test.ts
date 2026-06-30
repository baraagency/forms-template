import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { describe, expect, it } from "bun:test";
import {
  FORM_DATE_TIMEZONE,
  getMaxFormDateToday,
  getMaxFormDateTodayForPicker,
  isFormDateOnOrBeforeToday,
} from "../_core/formDateValidation";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("getMaxFormDateTodayForPicker", () => {
  it("matches the business-timezone calendar day", () => {
    const businessToday = dayjs().tz(FORM_DATE_TIMEZONE).format("YYYY-MM-DD");
    const pickerMax = getMaxFormDateTodayForPicker();

    expect(pickerMax.format("YYYY-MM-DD")).toBe(businessToday);
    expect(
      getMaxFormDateToday().tz(FORM_DATE_TIMEZONE).format("YYYY-MM-DD"),
    ).toBe(businessToday);
  });

  it("allows selecting the business-timezone today in validation", () => {
    const today = dayjs().tz(FORM_DATE_TIMEZONE).format("YYYY-MM-DD");
    expect(isFormDateOnOrBeforeToday(today)).toBe(true);
  });
});
