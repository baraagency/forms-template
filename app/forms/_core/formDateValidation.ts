import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

/** Matches APPOINTMENT_TIMEZONE in appointment-set/appointmentSetFormUtils. */
export const FORM_DATE_TIMEZONE = "America/New_York";

export function getMaxFormDateToday(): dayjs.Dayjs {
  return dayjs().tz(FORM_DATE_TIMEZONE).startOf("day");
}

/**
 * Calendar max date for MUI DatePicker. Uses the business-timezone calendar day
 * without timezone offset shifting so "today" stays selectable in the picker.
 */
export function getMaxFormDateTodayForPicker(): dayjs.Dayjs {
  const todayDate = dayjs().tz(FORM_DATE_TIMEZONE).format("YYYY-MM-DD");
  return dayjs(todayDate, "YYYY-MM-DD");
}

export function isFormDateOnOrBeforeToday(dateValue: string): boolean {
  const trimmedValue = dateValue.trim();
  if (!trimmedValue) {
    return false;
  }

  const parsed = dayjs.tz(trimmedValue, "YYYY-MM-DD", FORM_DATE_TIMEZONE);
  if (!parsed.isValid()) {
    return false;
  }

  return !parsed.startOf("day").isAfter(getMaxFormDateToday());
}

export function formDateOnOrBeforeTodayError(fieldLabel: string): string {
  return `${fieldLabel} must be today or earlier.`;
}
