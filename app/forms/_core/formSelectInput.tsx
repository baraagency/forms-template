import { Combobox } from "@base-ui/react/combobox";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { fieldSelectA11yProps } from "./useFieldIds";
import { FieldError } from "./FieldError";
import {
  Field,
  getSelectOptions,
  joinClassNames,
  type SelectChangeEvent,
  type SelectInputProps,
  type SelectOption,
} from "./ui";

export type FormSelectInputProps = SelectInputProps & {
  error?: string;
  isLoading?: boolean;
};

function optionClassName({
  highlighted,
  selected,
}: {
  highlighted: boolean;
  selected: boolean;
}) {
  return joinClassNames(
    "bara-select__option",
    highlighted && "bara-select__option--is-focused",
    selected && "bara-select__option--is-selected",
  );
}

function CaretDownIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

function ClearIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <path d="m4.5 4.5 7 7m-7 0 7-7" />
    </svg>
  );
}

function resolveSearchQueryFromInputEvent(
  next: string,
  selectedLabel: string,
  event: Event | undefined,
): string {
  if (event instanceof InputEvent) {
    if (
      event.inputType === "deleteContentBackward" ||
      event.inputType === "deleteContentForward"
    ) {
      return "";
    }
    if (event.data != null && event.data !== "") {
      return event.data;
    }
  }

  if (next.startsWith(selectedLabel) && next.length > selectedLabel.length) {
    return next.slice(selectedLabel.length);
  }

  return next === selectedLabel ? "" : next;
}

/**
 * Searchable select field with a portaled menu and existing bara-select styles.
 */
export function FormSelectInput({
  label,
  id,
  hint,
  required,
  wrapperClassName,
  className,
  value,
  onChange,
  onSearchInputChange,
  children,
  error,
  isLoading = false,
  ...props
}: FormSelectInputProps) {
  const { options, placeholder } = getSelectOptions(children);
  const placeholderText =
    placeholder ?? (label ? `Select ${label.toLowerCase()}` : "Select an option");
  const selectedOption = value
    ? (options.find((option) => option.value === value) ?? {
        value,
        label: value,
      })
    : null;
  const selectedLabel = selectedOption?.label ?? "";
  const isFilterActiveRef = useRef(false);
  const [inputValue, setInputValue] = useState(selectedLabel);

  useEffect(() => {
    if (!isFilterActiveRef.current) {
      setInputValue(selectedLabel);
    }
  }, [selectedLabel]);

  const isDisabled = Boolean(props.disabled) || isLoading;
  const a11y = fieldSelectA11yProps(id, error);
  const comboboxItems = selectedOption
    ? options.some((option) => option.value === selectedOption.value)
      ? options
      : [...options, selectedOption]
    : options;

  return (
    <div className={wrapperClassName}>
      <Field
        label={label}
        htmlFor={id}
        required={required}
        hint={hint}
        invalid={Boolean(error)}
      >
        <Combobox.Root
          items={comboboxItems}
          value={selectedOption}
          inputValue={inputValue}
          onValueChange={(nextValue) => {
            isFilterActiveRef.current = false;
            const nextLabel = nextValue?.label ?? "";
            setInputValue(nextLabel);
            onChange?.({
              target: {
                value: nextValue?.value ?? "",
              },
            } as SelectChangeEvent);
          }}
          onOpenChange={(open) => {
            if (!open) {
              isFilterActiveRef.current = false;
              setInputValue(selectedLabel);
            }
          }}
          onInputValueChange={(next, eventDetails) => {
            if (eventDetails.isCanceled) {
              return;
            }

            const reason = eventDetails.reason;

            if (reason === "input-clear") {
              isFilterActiveRef.current = next !== "";
              setInputValue(next);
              onSearchInputChange?.(next);
              return;
            }

            if (
              reason === "input-change" &&
              selectedOption &&
              !isFilterActiveRef.current
            ) {
              isFilterActiveRef.current = true;
              const query = resolveSearchQueryFromInputEvent(
                next,
                selectedLabel,
                eventDetails.event,
              );
              setInputValue(query);
              onSearchInputChange?.(query);
              return;
            }

            if (reason === "input-change") {
              isFilterActiveRef.current = true;
            }

            setInputValue(next);
            onSearchInputChange?.(next);
          }}
          isItemEqualToValue={(left, right) => left.value === right.value}
          disabled={isDisabled}
          autoHighlight
        >
          <div
            className={joinClassNames(
              "bara-select",
              className,
              error && "bara-select--error",
              isLoading && "bara-select--loading",
              isDisabled && "bara-select--is-disabled",
            )}
          >
            <Combobox.InputGroup
              className={(state) =>
                joinClassNames(
                  "bara-select__control",
                  error && "bara-select__control--error",
                  isLoading && "bara-select--loading",
                  (state.open || state.focused) &&
                    "bara-select__control--is-focused",
                  state.open && "bara-select--menu-is-open",
                )
              }
            >
              <Combobox.Input
                id={id}
                placeholder={placeholderText}
                disabled={isDisabled}
                aria-label={label ?? props["aria-label"]}
                aria-invalid={a11y["aria-invalid"]}
                aria-errormessage={a11y["aria-errormessage"]}
                aria-busy={isLoading || undefined}
                className="bara-select__input"
              />
              <div className="bara-select__actions">
                {!required ? (
                  <Combobox.Clear
                    type="button"
                    className="bara-select__clear"
                    aria-label="Clear selection"
                    disabled={isDisabled}
                  >
                    <ClearIcon />
                  </Combobox.Clear>
                ) : null}
                <span className="bara-select__indicator-separator" aria-hidden="true" />
                <Combobox.Trigger
                  type="button"
                  className="bara-select__dropdown-indicator"
                  aria-label="Open options"
                  disabled={isDisabled}
                >
                  <CaretDownIcon />
                </Combobox.Trigger>
              </div>
            </Combobox.InputGroup>
          </div>

          <Combobox.Portal>
            <Combobox.Positioner
              className="bara-select__positioner bara-select__menu-portal"
              side="bottom"
              sideOffset={4}
              collisionAvoidance={{ side: "flip" }}
            >
              <Combobox.Popup
                className={(state) =>
                  joinClassNames(
                    "bara-select__menu",
                    state.side === "top" && "bara-select__menu-placement-top",
                    state.transitionStatus === "ending" &&
                      "bara-select__menu--closing",
                  )
                }
              >
                <Combobox.Empty className="bara-select__empty">
                  No matches found
                </Combobox.Empty>
                {isLoading ? (
                  <Combobox.Status className="bara-select__empty">
                    Loading
                  </Combobox.Status>
                ) : null}
                <Combobox.List>
                  {(item: SelectOption) => (
                    <Combobox.Item
                      key={item.value}
                      value={item}
                      disabled={item.isDisabled}
                      className={optionClassName}
                    >
                      {item.label}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <input
          tabIndex={-1}
          aria-hidden="true"
          name={props.name ?? id}
          value={value}
          readOnly
          required={required && !isDisabled}
          className="bara-sr-only"
        />
        <FieldError id={`${id}-error`} message={error} />
      </Field>
    </div>
  );
}
