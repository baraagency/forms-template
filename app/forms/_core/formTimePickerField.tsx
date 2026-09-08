import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useMemo,
  useState,
  type ComponentProps,
} from "react";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { SvgIcon, type SvgIconProps } from "@mui/material";
import { Field, Spinner } from "./ui";
import { FORM_TIMEZONE } from "./constants";
import { datePickerTextFieldSx } from "./formDatePickerField";
import { FieldError } from "./FieldError";
import { fieldA11yProps } from "./useFieldIds";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const LazyTimePicker = lazy(() =>
  import("@mui/x-date-pickers/TimePicker").then((module) => ({
    default: module.TimePicker,
  })),
);

const TIME_REFERENCE_DATE = "2000-01-01";
export const FORM_TIME_PICKER_PLACEHOLDER = "00:00 AM";
export const FORM_TIME_PICKER_SINGLE_COLUMN_THRESHOLD = 48;

const timePickerLocaleText = {
  fieldHoursPlaceholder: () => "00",
  fieldMinutesPlaceholder: () => "00",
  fieldMeridiemPlaceholder: () => "AM",
};

const timePickerPaperBaseSx = {
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
};

export const timePickerPaperSx = {
  ...timePickerPaperBaseSx,
  "& .MuiMultiSectionDigitalClock-root": {
    maxHeight: "calc(100dvh - 24px)",
  },
  "& .MuiMultiSectionDigitalClockSection-root": {
    width: "56px",
  },
  "& .MuiMultiSectionDigitalClockSection-item.Mui-selected": {
    backgroundColor: "var(--highlight-color)",
    color: "var(--btn-primary-color)",
  },
  "& .MuiMultiSectionDigitalClockSection-item:hover": {
    backgroundColor: "color-mix(in srgb, var(--btn-outline-color) 8%, transparent)",
  },
  "& .MuiDigitalClock-root": {
    maxHeight: "calc(100dvh - 24px)",
  },
  "& .MuiDigitalClock-item.Mui-selected": {
    backgroundColor: "var(--highlight-color)",
    color: "var(--btn-primary-color)",
  },
  "& .MuiDigitalClock-item:hover": {
    backgroundColor: "color-mix(in srgb, var(--btn-outline-color) 8%, transparent)",
  },
};

export function buildFormTimePickerConfig(minutesStep = 15) {
  return {
    minutesStep,
    timeSteps: { hours: 1, minutes: minutesStep },
    skipDisabled: true,
    reduceAnimations: true,
    ampmInClock: false,
    thresholdToRenderTimeInASingleColumn: FORM_TIME_PICKER_SINGLE_COLUMN_THRESHOLD,
  } as const;
}

export function parseFormTimeValue(
  value: string,
  timezoneName = FORM_TIMEZONE,
): Dayjs | null {
  if (!value.trim()) {
    return null;
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const normalizedValue = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const parsed = dayjs.tz(
    `${TIME_REFERENCE_DATE}T${normalizedValue}`,
    "YYYY-MM-DDTHH:mm",
    timezoneName,
  );
  return parsed.isValid() ? parsed : null;
}

export function formatFormTimeValue(
  value: Dayjs | null,
  timezoneName = FORM_TIMEZONE,
): string {
  if (!value || !value.isValid()) {
    return "";
  }

  return value.tz(timezoneName).format("HH:mm");
}

export function formatFormTimeDisplayValue(value: string): string {
  const parsed = parseFormTimeValue(value);
  return parsed ? parsed.tz(FORM_TIMEZONE).format("hh:mm A") : value.trim();
}

function ClockIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        d="M12 7.25v4.5l3 1.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </SvgIcon>
  );
}

type FormTimePickerFieldProps = {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
  minutesStep?: number;
  minTime?: Dayjs;
  maxTime?: Dayjs;
  disabled?: boolean;
  readOnly?: boolean;
};

function TimePickerFallback({
  id,
  label,
  required,
  displayValue,
}: {
  id: string;
  label: string;
  required?: boolean;
  displayValue: string;
}) {
  return (
    <Field label={label} htmlFor={id} required={required}>
      <div className="relative mt-2">
        <input
          id={id}
          readOnly
          required={required}
          value={displayValue}
          placeholder={FORM_TIME_PICKER_PLACEHOLDER}
          className="h-[44px] w-full rounded-[var(--btn-radius)] border border-[var(--divider-color)] bg-[var(--card-bg)] px-3 pr-10 text-sm text-[var(--foreground)] shadow-[var(--field-shadow)]"
        />
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[var(--icon-muted)]">
          <Spinner className="h-4 w-4" />
        </span>
      </div>
    </Field>
  );
}

function FormTimePickerFieldInner({
  id,
  label,
  value,
  required,
  error,
  onChange,
  minutesStep = 15,
  minTime,
  maxTime,
  disabled = false,
  readOnly = false,
}: FormTimePickerFieldProps) {
  const [pickerActivated, setPickerActivated] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const a11y = fieldA11yProps(id, error);
  const pickerConfig = useMemo(
    () => buildFormTimePickerConfig(minutesStep),
    [minutesStep],
  );
  const pickerValue = useMemo(() => parseFormTimeValue(value), [value]);
  const displayValue = useMemo(() => formatFormTimeDisplayValue(value), [value]);

  const handleChange = useCallback(
    (nextValue: Dayjs | null) => {
      onChange(formatFormTimeValue(nextValue));
    },
    [onChange],
  );

  const activatePicker = useCallback(() => {
    setPickerActivated(true);
    setPickerOpen(true);
  }, []);

  const slotProps = useMemo(
    (): ComponentProps<typeof LazyTimePicker>["slotProps"] => ({
      textField: {
        id,
        required,
        fullWidth: true,
        error: Boolean(error),
        disabled,
        size: "small",
        sx: datePickerTextFieldSx,
        slotProps: {
          htmlInput: {
            readOnly,
            "aria-readonly": readOnly || undefined,
            ...a11y,
          },
        },
      },
      openPickerButton: {
        "aria-label": `Choose ${label}`,
        edge: "end",
        size: "small",
      },
      desktopPaper: {
        sx: timePickerPaperSx,
      },
      mobilePaper: {
        sx: timePickerPaperSx,
      },
      popper: {
        placement: "auto",
        modifiers: [
          {
            name: "flip",
            enabled: true,
          },
          {
            name: "preventOverflow",
            enabled: true,
          },
        ],
      },
    }),
    [a11y, disabled, error, id, label, readOnly, required],
  );

  if (!pickerActivated) {
    return (
      <Field label={label} htmlFor={id} required={required}>
        <div className="relative mt-2">
          <input
            id={id}
            readOnly
            disabled={disabled}
            required={required}
            value={displayValue}
            placeholder={FORM_TIME_PICKER_PLACEHOLDER}
            onFocus={disabled || readOnly ? undefined : activatePicker}
            onClick={disabled || readOnly ? undefined : activatePicker}
            className="h-[44px] w-full rounded-[var(--btn-radius)] border border-[var(--divider-color)] bg-[var(--card-bg)] px-3 pr-11 text-sm text-[var(--foreground)] shadow-[var(--field-shadow)] focus:border-[var(--btn-outline-border)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--btn-outline-color)_15%,transparent)] disabled:cursor-not-allowed disabled:bg-[var(--disabled-bg)]"
            {...a11y}
          />
          <button
            type="button"
            aria-label={`Choose ${label}`}
            disabled={disabled || readOnly}
            onClick={activatePicker}
            className="absolute inset-y-0 right-1 flex min-h-11 min-w-11 items-center justify-center rounded-[var(--btn-radius)] text-[var(--icon-muted)] hover:bg-[color-mix(in_srgb,var(--btn-outline-color)_8%,transparent)] hover:text-[var(--btn-outline-color)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ClockIcon fontSize="small" />
          </button>
        </div>
        <FieldError id={`${id}-error`} message={error} />
      </Field>
    );
  }

  return (
    <Suspense
      fallback={
        <TimePickerFallback
          id={id}
          label={label}
          required={required}
          displayValue={displayValue}
        />
      }
    >
      <Field label={label} htmlFor={id} required={required}>
        <LazyTimePicker
          {...pickerConfig}
          value={pickerValue}
          onChange={handleChange}
          format="hh:mm A"
          ampm
          timezone={FORM_TIMEZONE}
          open={pickerOpen}
          onOpen={() => setPickerOpen(true)}
          onClose={() => setPickerOpen(false)}
          {...(minTime ? { minTime } : {})}
          {...(maxTime ? { maxTime } : {})}
          closeOnSelect
          localeText={timePickerLocaleText}
          slots={{ openPickerIcon: ClockIcon }}
          slotProps={slotProps}
        />
        <FieldError id={`${id}-error`} message={error} />
      </Field>
    </Suspense>
  );
}

export const FormTimePickerField = memo(FormTimePickerFieldInner);
