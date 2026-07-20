import Select from "react-select";
import {
  Field,
  getSelectOptions,
  type SelectChangeEvent,
  type SelectInputProps,
} from "@baraagency/components";
import { useIsMounted } from "./useIsMounted";

const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    marginTop: "0.5rem",
    minHeight: "42px",
    borderRadius: "var(--btn-radius)",
    borderColor: state.isFocused ? "var(--btn-outline-border)" : "var(--divider-color)",
    backgroundColor: "var(--card-bg)",
    boxShadow: state.isFocused
      ? "var(--field-shadow), 0 0 0 4px var(--field-focus-ring)"
      : "var(--field-shadow)",
    transition: "all 150ms ease",
    "&:hover": {
      borderColor: state.isFocused ? "var(--btn-outline-border)" : "var(--field-hover-border)",
    },
  }),
  valueContainer: (base: Record<string, unknown>) => ({
    ...base,
    padding: "0 0.75rem",
  }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: "var(--placeholder-color)",
    fontSize: "0.875rem",
    opacity: 1,
  }),
  singleValue: (base: Record<string, unknown>) => ({
    ...base,
    color: "var(--foreground)",
    fontSize: "0.875rem",
  }),
  input: (base: Record<string, unknown>) => ({
    ...base,
    color: "var(--foreground)",
    fontSize: "0.875rem",
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    borderRadius: "0.75rem",
    overflow: "hidden",
    border: "1px solid var(--divider-color)",
    boxShadow: "0 18px 36px rgba(63, 69, 72, 0.14)",
    zIndex: 40,
  }),
  menuPortal: (base: Record<string, unknown>) => ({
    ...base,
    zIndex: 1300,
  }),
  option: (
    base: Record<string, unknown>,
    state: { isSelected: boolean; isFocused: boolean; isDisabled: boolean },
  ) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--btn-primary-bg)"
      : state.isFocused
        ? "var(--menu-hover-bg)"
        : "var(--card-bg)",
    color: state.isSelected ? "var(--btn-primary-color)" : "var(--foreground)",
    fontSize: "0.875rem",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
  }),
  indicatorSeparator: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "var(--divider-color)",
  }),
  dropdownIndicator: (
    base: Record<string, unknown>,
    state: { isFocused: boolean },
  ) => ({
    ...base,
    color: state.isFocused ? "var(--btn-outline-color)" : "var(--icon-muted)",
    "&:hover": {
      color: "var(--btn-outline-color)",
    },
  }),
};

/**
 * Select field with viewport-aware menu placement (opens above when near the bottom).
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
  ...props
}: SelectInputProps) {
  const isMounted = useIsMounted();
  const { options, placeholder } = getSelectOptions(children);
  const placeholderText = placeholder ?? `Select ${label.toLowerCase()}`;
  const selectedOption = value
    ? (options.find((option) => option.value === value) ?? {
        value,
        label: value,
      })
    : null;
  const isDisabled = Boolean(props.disabled);
  const menuPortalTarget = isMounted ? document.body : undefined;

  return (
    <div className={wrapperClassName}>
      <Field label={label} htmlFor={id} required={required} hint={hint}>
        {isMounted ? (
        <Select
          inputId={id}
          instanceId={id}
          name={props.name}
          value={selectedOption}
          onChange={(nextValue) => {
            onChange?.({
              target: {
                value: nextValue?.value ?? "",
              },
            } as SelectChangeEvent);
          }}
          onInputChange={(inputValue, actionMeta) => {
            if (actionMeta.action === "input-change") {
              onSearchInputChange?.(inputValue);
            }
            return inputValue;
          }}
          options={options}
          placeholder={placeholderText}
          isDisabled={isDisabled}
          isClearable={!required}
          isSearchable={true}
          styles={selectStyles}
          className={className}
          classNamePrefix="bara-select"
          menuPlacement="auto"
          menuPosition="fixed"
          menuPortalTarget={menuPortalTarget}
          menuShouldScrollIntoView={false}
          noOptionsMessage={() => "No matches found"}
        />
        ) : (
          <div
            aria-hidden="true"
            style={{
              marginTop: "0.5rem",
              minHeight: "42px",
              borderRadius: "var(--btn-radius)",
              border: "1px solid var(--divider-color)",
              backgroundColor: "var(--card-bg)",
              boxShadow: "var(--field-shadow)",
              color: "var(--foreground)",
              display: "flex",
              alignItems: "center",
              padding: "0 0.75rem",
              fontSize: "0.875rem",
            }}
          >
            {selectedOption?.label ?? placeholderText}
          </div>
        )}
        <input
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          required={required}
          onChange={() => undefined}
          style={{
            opacity: 0,
            width: 0,
            height: 0,
            position: "absolute",
            pointerEvents: "none",
          }}
        />
      </Field>
    </div>
  );
}
