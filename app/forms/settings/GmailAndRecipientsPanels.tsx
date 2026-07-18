"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Notice,
  Spinner,
  TextInput,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@baraagency/components";
import type { FormEmailRecipient } from "@/app/types/storage";
import {
  formKindLabel,
  type SettingsFormKind,
} from "../_core/formIdentity";

type GmailStatus = {
  environment: string;
  oauthConfigured: boolean;
  connected: boolean;
  email: string | null;
};

export function GmailAccountPanel({
  initialStatus,
}: {
  initialStatus: GmailStatus | null;
}) {
  const [status, setStatus] = useState<GmailStatus | null>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/forms/settings/gmail");
    const payload = (await response.json()) as GmailStatus & { message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? "Failed to load Gmail status.");
    }
    setStatus(payload);
  }, []);

  useEffect(() => {
    if (!initialStatus) {
      void refresh().catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load Gmail status.",
        );
      });
    }
  }, [initialStatus, refresh]);

  return (
    <section className="settings-section">
      <div className="settings-section-header">
        <div>
          <h2 className="settings-section-title text-balance">
            Submission email — Gmail
          </h2>
          <p className="settings-section-description text-pretty">
            Connect the Gmail inbox used for this deploy environment (
            {status?.environment ?? "…"}). Staging and production use separate
            credentials.
          </p>
        </div>
      </div>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <div className="settings-gmail-panel">
        <div>
          <p className="settings-gmail-title">
            {status?.connected
              ? "Gmail connected"
              : status?.oauthConfigured
                ? "Gmail not connected"
                : "Gmail OAuth not configured"}
          </p>
          <p className="settings-gmail-status">
            {status?.connected
              ? status.email
              : status?.oauthConfigured
                ? "Connect a Google account to send summary emails."
                : "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable connect."}
          </p>
        </div>
        <div className="settings-gmail-actions">
          {status?.connected ? (
            <button
              type="button"
              className={`app-button-press ${secondaryButtonClassName}`}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  const response = await fetch(
                    "/api/forms/settings/gmail/disconnect",
                    { method: "POST" },
                  );
                  const payload = (await response.json()) as { message?: string };
                  if (!response.ok) {
                    throw new Error(payload.message ?? "Disconnect failed.");
                  }
                  await refresh();
                } catch (disconnectError) {
                  setError(
                    disconnectError instanceof Error
                      ? disconnectError.message
                      : "Disconnect failed.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Disconnect
            </button>
          ) : (
            <a
              className={`app-button-press ${primaryButtonClassName}${
                !status?.oauthConfigured ? " opacity-50 pointer-events-none" : ""
              }`}
              href="/api/forms/settings/gmail/oauth/start"
              aria-disabled={!status?.oauthConfigured}
            >
              Connect Gmail
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export function FormRecipientsPanel({
  formKind,
  gmailConnected,
}: {
  formKind: SettingsFormKind;
  gmailConnected: boolean;
}) {
  const [recipients, setRecipients] = useState<FormEmailRecipient[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/forms/settings/recipients?form=${encodeURIComponent(formKind)}`,
      );
      const payload = (await response.json()) as {
        recipients?: FormEmailRecipient[];
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load recipients.");
      }
      const next = payload.recipients ?? [];
      setRecipients(next);
      setDrafts(
        Object.fromEntries(next.map((recipient) => [recipient.id, recipient.email])),
      );
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load recipients.",
      );
    } finally {
      setLoading(false);
    }
  }, [formKind]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <section className="settings-section">
      <div className="settings-section-header">
        <div>
          <h3 className="settings-section-title text-balance">
            Email recipients
          </h3>
          <p className="settings-section-description text-pretty">
            Summary recipients for {formKindLabel(formKind)}. Requires a
            connected Gmail account
            {gmailConnected ? "" : " (not connected yet)"}. Remove a recipient to
            stop sending to them.
          </p>
        </div>
      </div>
      {error ? <Notice tone="warning">{error}</Notice> : null}

      <form
        className="settings-dynamic-recipient-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const response = await fetch("/api/forms/settings/recipients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, form_type: formKind }),
            });
            const payload = (await response.json()) as { message?: string };
            if (!response.ok) {
              throw new Error(payload.message ?? "Failed to add recipient.");
            }
            setEmail("");
            await reload();
          } catch (createError) {
            setError(
              createError instanceof Error
                ? createError.message
                : "Failed to add recipient.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <TextInput
          id={`${formKind}-new-recipient-email`}
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <div className="settings-dynamic-recipient-actions">
          <button
            type="submit"
            className={`app-button-press ${primaryButtonClassName}`}
            disabled={busy}
          >
            {busy ? <Spinner /> : "Add recipient"}
          </button>
        </div>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <div className="settings-recipient-list">
          {recipients.length === 0 ? (
            <p className="settings-hint">No recipients for this form yet.</p>
          ) : (
            recipients.map((recipient) => {
              const draftEmail = drafts[recipient.id] ?? recipient.email;
              const dirty =
                draftEmail.trim().toLowerCase() !== recipient.email.toLowerCase();

              return (
                <div key={recipient.id} className="settings-recipient-row">
                  <div className="settings-recipient-details">
                    <TextInput
                      id={`${formKind}-recipient-email-${recipient.id}`}
                      label="Email"
                      type="email"
                      value={draftEmail}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setDrafts((current) => ({
                          ...current,
                          [recipient.id]: nextValue,
                        }));
                      }}
                      required
                    />
                  </div>
                  <div className="settings-recipient-actions">
                    <button
                      type="button"
                      className={`app-button-press ${
                        dirty
                          ? primaryButtonClassName
                          : secondaryButtonClassName
                      }`}
                      disabled={!dirty || savingId === recipient.id}
                      onClick={async () => {
                        setSavingId(recipient.id);
                        setError(null);
                        try {
                          const response = await fetch(
                            `/api/forms/settings/recipients/${recipient.id}`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                email: draftEmail.trim(),
                              }),
                            },
                          );
                          const payload = (await response.json()) as {
                            message?: string;
                          };
                          if (!response.ok) {
                            throw new Error(
                              payload.message ?? "Failed to update recipient.",
                            );
                          }
                          await reload();
                        } catch (saveError) {
                          setError(
                            saveError instanceof Error
                              ? saveError.message
                              : "Failed to update recipient.",
                          );
                        } finally {
                          setSavingId(null);
                        }
                      }}
                    >
                      {savingId === recipient.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      className={`app-button-press ${secondaryButtonClassName}`}
                      onClick={async () => {
                        setError(null);
                        const response = await fetch(
                          `/api/forms/settings/recipients/${recipient.id}`,
                          { method: "DELETE" },
                        );
                        const payload = (await response.json()) as {
                          message?: string;
                        };
                        if (!response.ok) {
                          setError(
                            payload.message ?? "Failed to delete recipient.",
                          );
                          return;
                        }
                        await reload();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
