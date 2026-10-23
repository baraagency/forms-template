import { useMemo, useState, type CSSProperties } from "react";
import { useRevalidator } from "react-router";
import { FieldError } from "../_core/FieldError";
import { PrimaryButton } from "../_core/PrimaryButton";
import { Notice, secondaryButtonClassName } from "../_core/ui";
import { useFieldIds } from "../_core/useFieldIds";
import {
  DEFAULT_THEME_SELECTION,
  getThemePreviewVars,
  normalizeHexColor,
  resolveAppTheme,
  type ThemeSelection,
} from "@/app/theme/appTheme";
import "./settings-appearance.css";

const HEX_ERROR = "Use a hex color like #003A55.";

const THEME_PRESETS: Array<{ name: string } & ThemeSelection> = [
  { name: "Template", ...DEFAULT_THEME_SELECTION },
  { name: "Ocean", primaryColor: "#0b3c5d", secondaryColor: "#0e7490" },
  { name: "Forest", primaryColor: "#2f4a3c", secondaryColor: "#1f2a24" },
  { name: "Clay", primaryColor: "#5b3a2e", secondaryColor: "#b4552d" },
];

function normalizeSelection(selection: ThemeSelection): ThemeSelection {
  return {
    primaryColor:
      normalizeHexColor(selection.primaryColor) ??
      DEFAULT_THEME_SELECTION.primaryColor,
    secondaryColor:
      normalizeHexColor(selection.secondaryColor) ??
      DEFAULT_THEME_SELECTION.secondaryColor,
  };
}

type ColorFieldProps = {
  label: string;
  description: string;
  color: string;
  draft: string;
  error: string | null;
  disabled: boolean;
  ids: ReturnType<typeof useFieldIds>;
  onColorChange: (value: string) => void;
  onDraftChange: (value: string) => void;
  onDraftBlur: () => void;
};

function ColorField({
  label,
  description,
  color,
  draft,
  error,
  disabled,
  ids,
  onColorChange,
  onDraftChange,
  onDraftBlur,
}: ColorFieldProps) {
  const describedBy = [ids.hintId, error ? ids.errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="appearance-field">
      <div className="appearance-field__copy">
        <label className="appearance-field__label" htmlFor={ids.inputId}>
          {label}
        </label>
        <p className="appearance-field__description" id={ids.hintId}>
          {description}
        </p>
      </div>
      <div className="appearance-field__controls">
        <input
          type="color"
          className="appearance-color-input"
          value={color}
          disabled={disabled}
          aria-label={`${label} picker`}
          aria-describedby={ids.hintId}
          onChange={(event) => onColorChange(event.target.value)}
        />
        <input
          id={ids.inputId}
          className="bara-input appearance-field__hex"
          value={draft}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          onChange={(event) => onDraftChange(event.target.value)}
          onBlur={onDraftBlur}
        />
      </div>
      <FieldError id={ids.errorId} message={error ?? undefined} />
    </div>
  );
}

export function AppearanceSettingsPanel({
  initialSelection,
}: {
  initialSelection: ThemeSelection;
}) {
  const revalidator = useRevalidator();
  const primaryIds = useFieldIds("appearance-primary");
  const secondaryIds = useFieldIds("appearance-secondary");
  const normalizedInitial = normalizeSelection(initialSelection);

  const [primaryColor, setPrimaryColor] = useState(
    normalizedInitial.primaryColor,
  );
  const [secondaryColor, setSecondaryColor] = useState(
    normalizedInitial.secondaryColor,
  );
  const [primaryDraft, setPrimaryDraft] = useState(
    normalizedInitial.primaryColor,
  );
  const [secondaryDraft, setSecondaryDraft] = useState(
    normalizedInitial.secondaryColor,
  );
  const [savedSelection, setSavedSelection] =
    useState<ThemeSelection>(normalizedInitial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const primaryError = normalizeHexColor(primaryDraft) ? null : HEX_ERROR;
  const secondaryError = normalizeHexColor(secondaryDraft)
    ? null
    : HEX_ERROR;
  const isDirty =
    primaryColor !== savedSelection.primaryColor ||
    secondaryColor !== savedSelection.secondaryColor;
  const canSave =
    !primaryError && !secondaryError && isDirty && !busy;

  const resolved = useMemo(
    () => resolveAppTheme({ primaryColor, secondaryColor }),
    [primaryColor, secondaryColor],
  );
  const previewVars = useMemo(
    () => getThemePreviewVars(resolved),
    [resolved],
  );

  const derived = [
    { label: "Page wash", value: resolved.background },
    { label: "Body text", value: resolved.body },
    { label: "Action", value: resolved.action },
    { label: "Focus", value: resolved.accent },
  ];

  const selectPreset = (preset: ThemeSelection) => {
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setPrimaryDraft(preset.primaryColor);
    setSecondaryDraft(preset.secondaryColor);
    setError(null);
    setSuccess(false);
  };

  const save = async () => {
    if (!canSave) {
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/forms/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
        }),
      });
      const payload = (await response.json()) as {
        primaryColor?: string;
        secondaryColor?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to save appearance.");
      }

      const next = normalizeSelection({
        primaryColor: payload.primaryColor ?? primaryColor,
        secondaryColor: payload.secondaryColor ?? secondaryColor,
      });

      setPrimaryColor(next.primaryColor);
      setSecondaryColor(next.secondaryColor);
      setPrimaryDraft(next.primaryColor);
      setSecondaryDraft(next.secondaryColor);
      setSavedSelection(next);
      setSuccess(true);
      revalidator.revalidate();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save appearance.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="settings-section appearance-settings">
      <p className="settings-section-description text-pretty">
        Primary color shapes headings, labels, page wash, and body text.
        Secondary color drives primary actions, selected states, and action
        accents. Derived shades adjust automatically to meet WCAG AA; save to
        apply them across every form and the router.
      </p>

      {error ? (
        <div role="alert">
          <Notice tone="warning">{error}</Notice>
        </div>
      ) : null}
      {success ? (
        <div role="status">
          <Notice tone="success">
            Appearance saved. Colors now apply across the app.
          </Notice>
        </div>
      ) : null}

      <div className="appearance-fields">
        <ColorField
          label="Primary color"
          description="Structure: headings, labels, page wash, body text."
          color={primaryColor}
          draft={primaryDraft}
          error={primaryError}
          disabled={busy}
          ids={primaryIds}
          onColorChange={(value) => {
            const normalized = normalizeHexColor(value);
            if (!normalized) return;
            setPrimaryColor(normalized);
            setPrimaryDraft(normalized);
            setError(null);
            setSuccess(false);
          }}
          onDraftChange={(value) => {
            setPrimaryDraft(value);
            setError(null);
            setSuccess(false);
            const normalized = normalizeHexColor(value);
            if (normalized) {
              setPrimaryColor(normalized);
            }
          }}
          onDraftBlur={() => {
            const normalized = normalizeHexColor(primaryDraft);
            if (normalized) {
              setPrimaryDraft(normalized);
              setPrimaryColor(normalized);
            }
          }}
        />

        <ColorField
          label="Secondary color"
          description="Actions: primary CTA, selected states, focus accents."
          color={secondaryColor}
          draft={secondaryDraft}
          error={secondaryError}
          disabled={busy}
          ids={secondaryIds}
          onColorChange={(value) => {
            const normalized = normalizeHexColor(value);
            if (!normalized) return;
            setSecondaryColor(normalized);
            setSecondaryDraft(normalized);
            setError(null);
            setSuccess(false);
          }}
          onDraftChange={(value) => {
            setSecondaryDraft(value);
            setError(null);
            setSuccess(false);
            const normalized = normalizeHexColor(value);
            if (normalized) {
              setSecondaryColor(normalized);
            }
          }}
          onDraftBlur={() => {
            const normalized = normalizeHexColor(secondaryDraft);
            if (normalized) {
              setSecondaryDraft(normalized);
              setSecondaryColor(normalized);
            }
          }}
        />
      </div>

      <div className="appearance-presets">
        <p className="appearance-presets__label">Starter pairs</p>
        <div
          className="appearance-presets__list"
          role="group"
          aria-label="Starter color pairs"
        >
          {THEME_PRESETS.map((preset) => {
            const selected =
              primaryColor === preset.primaryColor &&
              secondaryColor === preset.secondaryColor;

            return (
              <button
                key={preset.name}
                type="button"
                className="appearance-preset app-button-press"
                disabled={busy}
                aria-pressed={selected}
                aria-label={`${preset.name}: primary ${preset.primaryColor}, secondary ${preset.secondaryColor}`}
                onClick={() => selectPreset(preset)}
              >
                <span className="appearance-preset__swatches" aria-hidden="true">
                  <span
                    className="appearance-preset__swatch"
                    style={{ backgroundColor: preset.primaryColor }}
                  />
                  <span
                    className="appearance-preset__swatch"
                    style={{ backgroundColor: preset.secondaryColor }}
                  />
                </span>
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="appearance-preview-block">
        <h3 className="appearance-preview-block__title">Preview</h3>
        <div
          className="appearance-preview"
          style={previewVars as CSSProperties}
          aria-hidden="true"
        >
          <div className="appearance-preview__card">
            <p className="appearance-preview__kicker">Client intake</p>
            <p className="appearance-preview__title">New appointment</p>
            <p className="appearance-preview__body">
              Body copy and field descriptions use the derived structure tint.
            </p>
            <div className="appearance-preview__input">name@example.com</div>
            <div className="appearance-preview__actions">
              <span className="appearance-preview__action">
                Primary action
              </span>
              <span className="appearance-preview__secondary">Secondary</span>
            </div>
            <div className="appearance-preview__footer">
              <span className="appearance-preview__selected">Selected</span>
              <span className="appearance-preview__focus">Focus ring</span>
            </div>
          </div>
        </div>

        <ul className="appearance-derived" aria-label="Derived colors">
          {derived.map((entry) => (
            <li className="appearance-derived__item" key={entry.label}>
              <span
                className="appearance-derived__swatch"
                style={{ backgroundColor: entry.value }}
                aria-hidden="true"
              />
              <span className="appearance-derived__copy">
                <span className="appearance-derived__label">
                  {entry.label}
                </span>
                <span className="appearance-derived__value">
                  {entry.value}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="settings-form-footer">
        <button
          type="button"
          className={`app-button-press ${secondaryButtonClassName}`}
          disabled={busy}
          onClick={() => {
            setPrimaryColor(DEFAULT_THEME_SELECTION.primaryColor);
            setSecondaryColor(DEFAULT_THEME_SELECTION.secondaryColor);
            setPrimaryDraft(DEFAULT_THEME_SELECTION.primaryColor);
            setSecondaryDraft(DEFAULT_THEME_SELECTION.secondaryColor);
            setError(null);
            setSuccess(false);
          }}
        >
          Use default colors
        </button>
        <PrimaryButton
          type="button"
          loading={busy}
          disabled={!canSave}
          onClick={save}
        >
          Save appearance
        </PrimaryButton>
      </div>
    </section>
  );
}
