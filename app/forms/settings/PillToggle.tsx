"use client";

import { useId } from "react";

type PillToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  id?: string;
};

export function PillToggle({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}: PillToggleProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className="settings-toggle settings-pill-toggle" htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        className="settings-pill-toggle__input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="settings-pill-toggle__track" aria-hidden="true">
        <span className="settings-pill-toggle__thumb" />
      </span>
      <span>{label}</span>
    </label>
  );
}
