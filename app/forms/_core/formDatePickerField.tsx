import { useState } from "react";
import dayjs from "dayjs";
import { Button, DialogActions, SvgIcon, type SvgIconProps } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { PickerChangeHandlerContext } from "@mui/x-date-pickers/models";
import { Field } from "@baraagency/components";
import { formatDatePickerValue } from "./formatUtils";
import { FORM_DATE_TIMEZONE } from "./formDateValidation";
import { useIsMounted } from "./useIsMounted";

const TOUCH_TARGET_PX = 44;
/** Sized so header + 7×6 day grid + Cancel fit in the dialog with no scroll or clip. */
const DAY_CELL_PX = 36;
const CALENDAR_SIDE_INSET_PX = 16;
/** Side inset × 2 + 7 day cells */
const CALENDAR_WIDTH_PX = CALENDAR_SIDE_INSET_PX * 2 + DAY_CELL_PX * 7;

export const datePickerTextFieldSx = {
  mt: "0.5rem",
  width: "100%",
  "& .MuiPickersInputBase-root": {
    minHeight: "44px",
    height: "44px",
    borderRadius: "var(--btn-radius)",
    backgroundColor: "var(--card-bg)",
    color: "var(--foreground)",
    boxShadow: "var(--field-shadow)",
    fontFamily: "var(--font-family), Arial, sans-serif",
    fontSize: "1rem",
    lineHeight: "1.25rem",
    letterSpacing: 0,
    padding: "0 6px 0 12px",
    transition:
      "border-color 150ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 150ms cubic-bezier(0.23, 1, 0.32, 1)",
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
    fontSize: "1rem",
    lineHeight: "1.25rem",
  },
  "& .MuiPickersSectionList-section": {
    lineHeight: "1.25rem",
  },
  "& .MuiPickersSectionList-sectionContent": {
    color: "var(--foreground)",
    fontSize: "1rem",
    lineHeight: "1.25rem",
    letterSpacing: 0,
  },
  "& .MuiInputAdornment-root": {
    height: "100%",
    marginLeft: "4px",
  },
  "& .MuiIconButton-root": {
    width: `${TOUCH_TARGET_PX}px`,
    height: `${TOUCH_TARGET_PX}px`,
    marginRight: "-4px",
    padding: "10px",
    color: "var(--icon-muted)",
    transition:
      "transform 140ms cubic-bezier(0.23, 1, 0.32, 1), color 140ms ease, background-color 140ms ease",
  },
  "& .MuiIconButton-root:active": {
    transform: "scale(0.97)",
  },
  "@media (hover: hover) and (pointer: fine)": {
    "& .MuiIconButton-root:hover": {
      color: "var(--btn-outline-color)",
      backgroundColor:
        "color-mix(in srgb, var(--btn-outline-color) 8%, transparent)",
    },
  },
  "& .MuiSvgIcon-root": {
    fontSize: "1.25rem",
  },
};

const dayButtonSx = {
  width: `${DAY_CELL_PX}px`,
  height: `${DAY_CELL_PX}px`,
  margin: "0px",
  borderRadius: "var(--btn-radius)",
  color: "var(--foreground)",
  fontSize: "0.8125rem",
  transition:
    "transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease",
};

export const datePickerPaperSx = {
  mt: 1,
  borderRadius: "var(--card-radius)",
  border: "1px solid var(--divider-color)",
  backgroundColor: "var(--card-bg)",
  color: "var(--foreground)",
  boxShadow: "var(--card-shadow)",
  width: `${CALENDAR_WIDTH_PX}px`,
  minWidth: `${CALENDAR_WIDTH_PX}px !important`,
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "calc(100dvh - 32px)",
  margin: "16px",
  overflow: "hidden",
  transformOrigin: "top center",
  "&.MuiDialog-paper": {
    width: `${CALENDAR_WIDTH_PX}px`,
    minWidth: `${CALENDAR_WIDTH_PX}px`,
  },
  "& .MuiPickersLayout-root": {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    width: "100%",
    maxWidth: "100%",
    maxHeight: "calc(100dvh - 32px)",
    overflow: "hidden",
  },
  "& .MuiPickersLayout-contentWrapper": {
    order: 0,
    flex: "0 0 auto",
    overflow: "hidden",
    width: "100%",
  },
  "& .MuiDialogActions-root, & .MuiPickersLayout-actionBar": {
    order: 1,
    padding: "0 4px 8px",
    marginTop: 0,
    flexShrink: 0,
    width: "100%",
  },
  "& .MuiDateCalendar-root": {
    width: "100%",
    maxWidth: "100%",
    height: "auto",
    minHeight: 0,
    maxHeight: "none",
    padding: `8px ${CALENDAR_SIDE_INSET_PX}px 0`,
    boxSizing: "border-box",
  },
  "& .MuiPickersCalendarHeader-root": {
    marginTop: "0",
    marginBottom: "2px",
    paddingLeft: "0",
    paddingRight: "0",
    minHeight: "40px",
    maxHeight: "40px",
    maxWidth: "100%",
  },
  "& .MuiPickersCalendarHeader-label": {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "var(--foreground)",
  },
  "& .MuiPickersArrowSwitcher-button": {
    color: "var(--btn-outline-color)",
    width: "40px",
    height: "40px",
  },
  "& .MuiDayCalendar-header": {
    justifyContent: "center",
    width: "100%",
    maxWidth: "100%",
    paddingLeft: "0",
    paddingRight: "0",
    marginBottom: "2px",
  },
  "& .MuiDayCalendar-weekDayLabel": {
    color: "var(--body-color)",
    fontSize: "0.7rem",
    fontWeight: 700,
    width: `${DAY_CELL_PX}px`,
    height: "22px",
    margin: 0,
  },
  // Match rendered weeks (5 or 6) — no empty reserved row under the grid.
  "& .MuiDayCalendar-slideTransition, & .MuiPickersSlideTransition-root": {
    minHeight: `${DAY_CELL_PX * 5}px`,
    height: "auto",
    maxHeight: `${DAY_CELL_PX * 6}px`,
    width: "100%",
    marginBottom: 0,
    overflow: "hidden",
  },
  "& .MuiDayCalendar-monthContainer": {
    overflow: "hidden",
    width: "100%",
    position: "relative",
  },
  "& .MuiDayCalendar-weekContainer": {
    margin: 0,
    justifyContent: "center",
    width: "100%",
    maxWidth: "100%",
    paddingLeft: "0",
    paddingRight: "0",
  },
  // MUI X v9 uses MuiPickerDay; keep MuiPickersDay for older builds.
  "& .MuiPickersDay-root, & .MuiPickerDay-root": dayButtonSx,
  "& .MuiPickerDay-dayOutsideMonth, & .MuiPickersDay-dayOutsideMonth": {
    color: "var(--body-color)",
    opacity: 0.4,
  },
  "& .MuiPickersDay-root:active, & .MuiPickerDay-root:active": {
    transform: "scale(0.97)",
  },
  "@media (hover: hover) and (pointer: fine)": {
    "& .MuiPickersDay-root:hover, & .MuiPickerDay-root:hover": {
      backgroundColor:
        "color-mix(in srgb, var(--btn-outline-color) 8%, transparent)",
    },
  },
  "& .MuiPickersDay-root.Mui-selected, & .MuiPickerDay-root.Mui-selected": {
    backgroundColor: "var(--highlight-color)",
    color: "var(--btn-primary-color)",
  },
  "& .MuiPickersDay-root.Mui-selected:hover, & .MuiPickersDay-root.Mui-selected:focus, & .MuiPickerDay-root.Mui-selected:hover, & .MuiPickerDay-root.Mui-selected:focus":
    {
      backgroundColor: "var(--brand-cyan-dark)",
    },
  "& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton": {
    borderRadius: "var(--btn-radius)",
    color: "var(--foreground)",
    minHeight: "36px",
  },
  "& .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersMonth-monthButton.Mui-selected":
    {
      backgroundColor: "var(--highlight-color)",
      color: "var(--btn-primary-color)",
    },
  "& .MuiYearCalendar-root, & .MuiMonthCalendar-root": {
    width: "100%",
    maxHeight: `${DAY_CELL_PX * 6 + 24}px`,
    overflow: "hidden",
  },
  "& .MuiDialogActions-root .MuiButton-root, & .MuiPickersLayout-actionBar .MuiButton-root":
    {
      minHeight: "40px",
      minWidth: "72px",
      borderRadius: "var(--btn-radius)",
      fontWeight: 700,
      textTransform: "none",
      transition: "transform 140ms cubic-bezier(0.23, 1, 0.32, 1)",
    },
  "& .MuiDialogActions-root .MuiButton-root:active, & .MuiPickersLayout-actionBar .MuiButton-root:active":
    {
      transform: "scale(0.97)",
    },
  "@media (max-height: 480px)": {
    "& .MuiDateCalendar-root": {
      padding: "4px 8px 0",
    },
    "& .MuiPickersCalendarHeader-root": {
      minHeight: "32px",
      maxHeight: "32px",
      marginTop: "0",
    },
    "& .MuiPickersArrowSwitcher-button": {
      width: "32px",
      height: "32px",
    },
    "& .MuiDayCalendar-weekDayLabel": {
      width: "32px",
      height: "18px",
      fontSize: "0.65rem",
    },
    "& .MuiPickersDay-root, & .MuiPickerDay-root": {
      width: "32px",
      height: "32px",
      fontSize: "0.75rem",
    },
    "& .MuiDayCalendar-slideTransition, & .MuiPickersSlideTransition-root": {
      minHeight: "160px",
      height: "auto",
      maxHeight: "192px",
    },
    "& .MuiDialogActions-root, & .MuiPickersLayout-actionBar": {
      padding: "0 4px 6px",
    },
    "& .MuiDialogActions-root .MuiButton-root, & .MuiPickersLayout-actionBar .MuiButton-root":
      {
        minHeight: "36px",
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

/** Shared open/close behavior for form date pickers. Do not keep open on field focus. */
export const formDatePickerBehaviorProps = {
  closeOnSelect: true,
  views: ["day"] as const,
  openTo: "day" as const,
};

/** Mobile dialog extras: hide the empty toolbar; Cancel is a custom action bar. */
export const formDatePickerMobileSlotProps = {
  actionBar: {
    actions: ["cancel"] as const,
  },
  toolbar: {
    hidden: true,
  },
};

function DatePickerCancelActionBar({ onCancel }: { onCancel: () => void }) {
  return (
    <DialogActions
      sx={{
        padding: "0 4px 8px",
        marginTop: 0,
        "& .MuiButton-root": {
          minHeight: "40px",
          minWidth: "72px",
          borderRadius: "var(--btn-radius)",
          fontWeight: 700,
          textTransform: "none",
          color: "var(--btn-outline-color)",
          transition: "transform 140ms cubic-bezier(0.23, 1, 0.32, 1)",
        },
        "& .MuiButton-root:active": {
          transform: "scale(0.97)",
        },
      }}
    >
      <Button type="button" onClick={onCancel}>
        Cancel
      </Button>
    </DialogActions>
  );
}

/** Close the dialog after a calendar tap; keep it open while editing the field. */
export function shouldClosePickerAfterViewChange(
  context: Pick<PickerChangeHandlerContext<unknown>, "source"> | undefined,
): boolean {
  return context?.source === "view";
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
  const [open, setOpen] = useState(false);
  const pickerValue = value ? dayjs(value) : null;
  const displayValue = pickerValue?.isValid()
    ? pickerValue.format("MM/DD/YYYY")
    : "";

  return (
    <Field label={label} htmlFor={id} required={required}>
      {isMounted ? (
        <DatePicker
          value={pickerValue}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          onChange={(nextValue, context) => {
            onChange(formatDatePickerValue(nextValue));
            if (shouldClosePickerAfterViewChange(context)) {
              setOpen(false);
            }
          }}
          format="MM/DD/YYYY"
          timezone={maxDate ? FORM_DATE_TIMEZONE : undefined}
          maxDate={maxDate}
          showDaysOutsideCurrentMonth
          {...formDatePickerBehaviorProps}
          slots={{
            openPickerIcon: CalendarIcon,
            actionBar: () => (
              <DatePickerCancelActionBar onCancel={() => setOpen(false)} />
            ),
          }}
          slotProps={{
            textField: {
              id,
              required,
              fullWidth: true,
              error: Boolean(error),
              size: "small",
              sx: datePickerTextFieldSx,
              inputProps: {
                inputMode: "numeric",
              },
            },
            openPickerButton: {
              "aria-label": `Choose ${label}`,
              edge: "end",
            },
            desktopPaper: {
              sx: datePickerPaperSx,
            },
            mobilePaper: {
              sx: datePickerPaperSx,
            },
            toolbar: formDatePickerMobileSlotProps.toolbar,
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
            minHeight: "44px",
            borderRadius: "var(--btn-radius)",
            border: "1px solid var(--divider-color)",
            backgroundColor: "var(--card-bg)",
            boxShadow: "var(--field-shadow)",
            color: "var(--foreground)",
            padding: "0 12px",
            fontSize: "1rem",
            fontFamily: "var(--font-family), Arial, sans-serif",
          }}
        />
      )}
    </Field>
  );
}
