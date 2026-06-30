"use client";

import dayjs from "dayjs";
import { SvgIcon, type SvgIconProps } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Field } from "@baraagency/components";
import { formatDatePickerValue } from "./formatUtils";
import { FORM_DATE_TIMEZONE } from "./formDateValidation";
import { useIsMounted } from "./useIsMounted";

export const datePickerTextFieldSx = {
  mt: "0.5rem",
  width: "100%",
  "& .MuiPickersInputBase-root": {
    minHeight: "42px",
    height: "42px",
    borderRadius: "var(--btn-radius)",
    backgroundColor: "var(--card-bg)",
    color: "var(--foreground)",
    boxShadow: "var(--field-shadow)",
    fontFamily: "var(--font-family), Arial, sans-serif",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    letterSpacing: 0,
    padding: "0 6px 0 12px",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  },
  "& .MuiPickersOutlinedInput-notchedOutline": {
    borderColor: "var(--divider-color)",
  },
  "& .MuiPickersInputBase-root:hover .MuiPickersOutlinedInput-notchedOutline": {
    borderColor: "var(--field-hover-border)",
  },
  "& .MuiPickersInputBase-root.Mui-focused": {
    boxShadow:
      "var(--field-shadow), 0 0 0 4px color-mix(in srgb, var(--btn-outline-color) 15%, transparent)",
  },
  "& .MuiPickersInputBase-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
    {
      borderColor: "var(--btn-outline-border)",
      borderWidth: "1px",
    },
  "& .MuiPickersInputBase-root.Mui-error .MuiPickersOutlinedInput-notchedOutline":
    {
      borderColor: "var(--error-color)",
    },
  "& .MuiPickersSectionList-root": {
    minHeight: "40px",
    width: "auto",
    padding: 0,
    alignItems: "center",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  "& .MuiPickersSectionList-section": {
    lineHeight: "1.25rem",
  },
  "& .MuiPickersSectionList-sectionContent": {
    color: "var(--foreground)",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    letterSpacing: 0,
  },
  "& .MuiInputAdornment-root": {
    height: "100%",
    marginLeft: "4px",
  },
  "& .MuiIconButton-root": {
    width: "32px",
    height: "32px",
    marginRight: "-2px",
    padding: "6px",
    color: "var(--icon-muted)",
  },
  "& .MuiIconButton-root:hover": {
    color: "var(--btn-outline-color)",
    backgroundColor:
      "color-mix(in srgb, var(--btn-outline-color) 8%, transparent)",
  },
  "& .MuiSvgIcon-root": {
    fontSize: "1.1rem",
  },
};

export const datePickerPaperSx = {
  mt: 1,
  borderRadius: "var(--card-radius)",
  border: "1px solid var(--divider-color)",
  backgroundColor: "var(--card-bg)",
  color: "var(--foreground)",
  boxShadow: "var(--card-shadow)",
  maxHeight: "calc(100dvh - 16px)",
  maxWidth: "calc(100vw - 16px)",
  overflow: "auto",
  transformOrigin: "top center",
  "& .MuiDateCalendar-root": {
    width: "min(320px, calc(100vw - 24px))",
    maxHeight: "calc(100dvh - 24px)",
  },
  "& .MuiPickersCalendarHeader-label": {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--foreground)",
  },
  "& .MuiPickersArrowSwitcher-button": {
    color: "var(--btn-outline-color)",
  },
  "& .MuiDayCalendar-weekDayLabel": {
    color: "var(--body-color)",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  "& .MuiPickersDay-root": {
    borderRadius: "var(--btn-radius)",
    color: "var(--foreground)",
    fontSize: "0.82rem",
  },
  "& .MuiPickersDay-root:hover": {
    backgroundColor:
      "color-mix(in srgb, var(--btn-outline-color) 8%, transparent)",
  },
  "& .MuiPickersDay-root.Mui-selected": {
    backgroundColor: "var(--highlight-color)",
    color: "var(--btn-primary-color)",
  },
  "& .MuiPickersDay-root.Mui-selected:hover, & .MuiPickersDay-root.Mui-selected:focus":
    {
      backgroundColor: "var(--brand-cyan-dark)",
    },
  "& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton": {
    borderRadius: "var(--btn-radius)",
    color: "var(--foreground)",
  },
  "& .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersMonth-monthButton.Mui-selected":
    {
      backgroundColor: "var(--highlight-color)",
      color: "var(--btn-primary-color)",
    },
  "@media (max-height: 540px)": {
    "& .MuiDateCalendar-root": {
      width: "min(300px, calc(100vw - 24px))",
    },
    "& .MuiPickersCalendarHeader-root": {
      minHeight: "34px",
      marginTop: "2px",
      marginBottom: "2px",
      paddingLeft: "8px",
      paddingRight: "8px",
    },
    "& .MuiDayCalendar-weekDayLabel": {
      width: "32px",
      height: "24px",
      fontSize: "0.7rem",
    },
    "& .MuiPickersDay-root": {
      width: "32px",
      height: "32px",
      margin: "0 1px",
      fontSize: "0.76rem",
    },
    "& .MuiPickersSlideTransition-root": {
      minHeight: "198px",
    },
    "& .MuiYearCalendar-root, & .MuiMonthCalendar-root": {
      maxHeight: "calc(100dvh - 80px)",
    },
  },
};

function CalendarIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        d="M7 3.75v3M17 3.75v3M4.75 9h14.5M7 5.25h10A2.75 2.75 0 0 1 19.75 8v9A2.75 2.75 0 0 1 17 19.75H7A2.75 2.75 0 0 1 4.25 17V8A2.75 2.75 0 0 1 7 5.25Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M8 12.25h.01M12 12.25h.01M16 12.25h.01M8 15.75h.01M12 15.75h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </SvgIcon>
  );
}

export function FormDatePickerField({
  id,
  label,
  value,
  required,
  error,
  maxDate,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  maxDate?: dayjs.Dayjs;
  onChange: (value: string) => void;
}) {
  const isMounted = useIsMounted();
  const pickerValue = value ? dayjs(value) : null;
  const displayValue = pickerValue?.isValid() ? pickerValue.format("MM/DD/YYYY") : "";

  return (
    <Field label={label} htmlFor={id} required={required}>
      {isMounted ? (
      <DatePicker
        value={pickerValue}
        onChange={(nextValue) => onChange(formatDatePickerValue(nextValue))}
        format="MM/DD/YYYY"
        timezone={maxDate ? FORM_DATE_TIMEZONE : undefined}
        maxDate={maxDate}
        closeOnSelect
        keepOpenDuringFieldFocus
        slots={{ openPickerIcon: CalendarIcon }}
        slotProps={{
          textField: {
            id,
            required,
            fullWidth: true,
            error: Boolean(error),
            size: "small",
            sx: datePickerTextFieldSx,
          },
          openPickerButton: {
            "aria-label": `Choose ${label}`,
            edge: "end",
            size: "small",
          },
          desktopPaper: {
            sx: datePickerPaperSx,
          },
          mobilePaper: {
            sx: datePickerPaperSx,
          },
        }}
      />
      ) : (
        <input
          id={id}
          readOnly
          required={required}
          value={displayValue}
          aria-hidden="true"
          style={{
            marginTop: "0.5rem",
            width: "100%",
            minHeight: "42px",
            borderRadius: "var(--btn-radius)",
            border: "1px solid var(--divider-color)",
            backgroundColor: "var(--card-bg)",
            boxShadow: "var(--field-shadow)",
            color: "var(--foreground)",
            padding: "0 12px",
            fontSize: "0.875rem",
            fontFamily: "var(--font-family), Arial, sans-serif",
          }}
        />
      )}
    </Field>
  );
}
