import { useState } from "react";
import {
  Notice,
  primaryButtonClassName,
  secondaryButtonClassName,
  TextInput,
} from "../_core/ui";
import { FormBanner } from "../_core/FormBanner";
import { FormRouterBackLink } from "../_core/formRouterBackLink";

export function SettingsLoginPanel() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forms/settings/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? "Could not sign in.");
        return;
      }

      window.location.reload();
    } catch {
      setError("Could not sign in. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="page-form">
      <title>Form Settings</title>
      <FormRouterBackLink
        href="/forms"
        className={`settings-back-link app-button-press ${secondaryButtonClassName}`}
      />

      <header className="page-header">
        <FormBanner />
      </header>

      <div className="settings-page-stack settings-login-stack">
        <div>
          <h1 className="page-title">Form Settings</h1>
          <p className="page-intro">
            Enter the admin password to configure Gmail delivery, recipients,
            router visibility, and SISU / FUB mappings.
          </p>
        </div>

        <form className="settings-login-form" onSubmit={handleSubmit}>
          {error ? <Notice tone="warning">{error}</Notice> : null}

          <TextInput
            id="settings-admin-password"
            label="Admin password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            type="submit"
            className={`app-button-press ${primaryButtonClassName}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
