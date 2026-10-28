import { useEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router";
import { FieldError } from "../_core/FieldError";
import { PrimaryButton } from "../_core/PrimaryButton";
import { Notice, secondaryButtonClassName } from "../_core/ui";
import { useFieldIds } from "../_core/useFieldIds";
import {
  DEFAULT_APP_BRANDING,
  MAX_LOGO_ALT_LENGTH,
  MAX_LOGO_URL_LENGTH,
  normalizeLogoAlt,
  normalizeLogoUrl,
  type AppBranding,
} from "@/app/theme/appTheme";
import "./settings-branding.css";

export function BrandingSettingsPanel({
  initialBranding,
}: {
  initialBranding: AppBranding;
}) {
  const revalidator = useRevalidator();
  const urlIds = useFieldIds("branding-logo-url");
  const altIds = useFieldIds("branding-logo-alt");
  const normalizedInitial = {
    logoUrl: initialBranding.logoUrl ?? "",
    logoAlt: normalizeLogoAlt(initialBranding.logoAlt),
  };

  const [logoUrl, setLogoUrl] = useState(normalizedInitial.logoUrl);
  const [logoAlt, setLogoAlt] = useState(normalizedInitial.logoAlt);
  const [savedBranding, setSavedBranding] = useState<AppBranding>({
    logoUrl: initialBranding.logoUrl,
    logoAlt: normalizedInitial.logoAlt,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewRef = useRef<HTMLImageElement>(null);

  const normalizedUrl = normalizeLogoUrl(logoUrl);
  const urlError =
    logoUrl.trim() && !normalizedUrl
      ? "Use an absolute http(s) URL, e.g. https://example.com/logo.png."
      : null;
  const altError =
    logoAlt.trim().length > MAX_LOGO_ALT_LENGTH
      ? `Alt text must be ${MAX_LOGO_ALT_LENGTH} characters or fewer.`
      : null;

  const nextBranding: AppBranding = {
    logoUrl: normalizedUrl,
    logoAlt: normalizeLogoAlt(logoAlt),
  };
  const isDirty =
    nextBranding.logoUrl !== savedBranding.logoUrl ||
    nextBranding.logoAlt !== savedBranding.logoAlt;
  const canSave = !urlError && !altError && isDirty && !busy;

  const previewSrc = normalizedUrl ?? "/logo-banner.png";
  const previewAlt = normalizeLogoAlt(logoAlt);

  useEffect(() => {
    setPreviewFailed(false);
    const image = previewRef.current;
    // The SSR image can fail before hydration; catch that case explicitly.
    if (image?.complete && image.naturalWidth === 0) {
      setPreviewFailed(true);
    }
  }, [previewSrc]);

  const urlDescribedBy = [urlIds.hintId, urlError ? urlIds.errorId : null]
    .filter(Boolean)
    .join(" ");
  const altDescribedBy = [altIds.hintId, altError ? altIds.errorId : null]
    .filter(Boolean)
    .join(" ");

  const save = async () => {
    if (!canSave) {
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/forms/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoUrl.trim(),
          logoAlt: logoAlt.trim(),
        }),
      });
      const payload = (await response.json()) as {
        logoUrl?: string | null;
        logoAlt?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to save branding.");
      }

      const next: AppBranding = {
        logoUrl: payload.logoUrl ?? null,
        logoAlt: payload.logoAlt ?? DEFAULT_APP_BRANDING.logoAlt,
      };

      setLogoUrl(next.logoUrl ?? "");
      setLogoAlt(next.logoAlt);
      setSavedBranding(next);
      setSuccess(true);
      revalidator.revalidate();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save branding.",
      );
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setLogoUrl("");
    setLogoAlt(DEFAULT_APP_BRANDING.logoAlt);
    setError(null);
    setSuccess(false);
  };

  return (
    <section className="settings-section branding-settings">
      <p className="settings-section-description text-pretty">
        Point to an image hosted on your CDN or website. When set, it appears in
        the app header, the HTML summary email, and FUB notes. Use an https URL
        so email clients can load it. Leave it blank to use the built-in banner
        in the app; emails and notes then omit the logo.
      </p>

      {error ? (
        <div role="alert">
          <Notice tone="warning">{error}</Notice>
        </div>
      ) : null}
      {success ? (
        <div role="status">
          <Notice tone="success">
            Branding saved. The app header and summary surfaces are updated.
          </Notice>
        </div>
      ) : null}

      <div className="branding-fields">
        <div className="branding-field">
          <label className="branding-field__label" htmlFor={urlIds.inputId}>
            Logo URL
          </label>
          <p className="branding-field__description" id={urlIds.hintId}>
            Absolute http(s) URL. Leave blank to use the built-in banner.
          </p>
          <input
            id={urlIds.inputId}
            className="bara-input branding-field__input"
            type="url"
            value={logoUrl}
            placeholder="https://example.com/logo.png"
            maxLength={MAX_LOGO_URL_LENGTH}
            aria-invalid={urlError ? true : undefined}
            aria-describedby={urlDescribedBy || undefined}
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            onChange={(event) => {
              setLogoUrl(event.target.value);
              setError(null);
              setSuccess(false);
            }}
          />
          <FieldError id={urlIds.errorId} message={urlError ?? undefined} />
        </div>

        <div className="branding-field">
          <label className="branding-field__label" htmlFor={altIds.inputId}>
            Logo alt text
          </label>
          <p className="branding-field__description" id={altIds.hintId}>
            Describes the image for screen readers. Defaults to “Bara Agency”.
          </p>
          <input
            id={altIds.inputId}
            className="bara-input branding-field__input"
            type="text"
            value={logoAlt}
            placeholder={DEFAULT_APP_BRANDING.logoAlt}
            maxLength={MAX_LOGO_ALT_LENGTH}
            aria-invalid={altError ? true : undefined}
            aria-describedby={altDescribedBy || undefined}
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            onChange={(event) => {
              setLogoAlt(event.target.value);
              setError(null);
              setSuccess(false);
            }}
            onBlur={() => {
              if (!logoAlt.trim()) {
                setLogoAlt(DEFAULT_APP_BRANDING.logoAlt);
              }
            }}
          />
          <FieldError id={altIds.errorId} message={altError ?? undefined} />
        </div>
      </div>

      <div className="branding-preview-block">
        <h3 className="branding-preview-block__title">Preview</h3>
        <div className="branding-preview">
          <img
            ref={previewRef}
            src={previewSrc}
            alt={previewAlt}
            className="branding-preview__image"
            onLoad={() => setPreviewFailed(false)}
            onError={() => setPreviewFailed(true)}
          />
        </div>
        {previewFailed ? (
          <p className="branding-preview__warning" role="status">
            Preview unavailable. The app will fall back to the built-in banner
            if the saved URL cannot load.
          </p>
        ) : null}
        <p className="branding-preview__caption">
          Header, HTML summary email, and FUB note
        </p>
      </div>

      <div className="settings-form-footer">
        <button
          type="button"
          className={`app-button-press ${secondaryButtonClassName}`}
          disabled={busy}
          onClick={reset}
        >
          Use default logo
        </button>
        <PrimaryButton
          type="button"
          loading={busy}
          disabled={!canSave}
          onClick={save}
        >
          Save branding
        </PrimaryButton>
      </div>
    </section>
  );
}
