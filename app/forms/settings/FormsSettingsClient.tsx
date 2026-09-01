import { useMemo, useState } from "react";
import { Notice, SectionCard, secondaryButtonClassName } from "../_core/ui";
import type { RouterForm } from "@/app/types/storage";
import { FormBanner } from "../_core/FormBanner";
import { FormRouterBackLink } from "../_core/formRouterBackLink";
import {
  SETTINGS_TAB_SLUGS,
  formKindLabel,
  slugToFormKind,
  type FormRouterSlug,
} from "../_core/formIdentity";
import { GmailAccountPanel } from "./GmailAndRecipientsPanels";
import { FormSettingsPanel } from "./FormSettingsPanel";
import { useRovingTabIndex } from "../_core/useRovingTabIndex";
import "./settings-tabs.css";

type GmailStatus = {
  environment: string;
  oauthConfigured: boolean;
  connected: boolean;
  email: string | null;
};

export function FormsSettingsClient({
  initialRouterForms,
  initialGmailStatus,
  gmailFlash,
}: {
  initialRouterForms: RouterForm[];
  initialGmailStatus: GmailStatus | null;
  gmailFlash: { tone: "success" | "warning"; message: string } | null;
}) {
  const [activeSlug, setActiveSlug] =
    useState<FormRouterSlug>("appointment-set");
  const [routerForms, setRouterForms] =
    useState<RouterForm[]>(initialRouterForms);

  const routerFormBySlug = useMemo(() => {
    return new Map(routerForms.map((form) => [form.slug, form]));
  }, [routerForms]);

  const { getTabProps } = useRovingTabIndex({
    items: SETTINGS_TAB_SLUGS,
    selected: activeSlug,
    onSelect: setActiveSlug,
  });

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

      <div className="settings-page-stack">
        <div>
          <h1 className="page-title">Form Settings</h1>
          <p className="page-intro">
            Configure Gmail delivery, per-form recipients, router visibility, and
            SISU / FUB mappings. Mapping changes are stored for future workflows;
            submit routes remain mocked in this template.
          </p>
        </div>

        {gmailFlash ? (
          <Notice tone={gmailFlash.tone}>{gmailFlash.message}</Notice>
        ) : null}

        <SectionCard title="Email">
          <GmailAccountPanel initialStatus={initialGmailStatus} />
        </SectionCard>

        <SectionCard title="Forms">
          <div
            className="settings-tabs"
            role="tablist"
            aria-label="Form settings"
          >
            {SETTINGS_TAB_SLUGS.map((slug) => {
              const kind = slugToFormKind(slug)!;
              const selected = slug === activeSlug;
              return (
                <button
                  key={slug}
                  type="button"
                  role="tab"
                  id={`settings-tab-${slug}`}
                  aria-selected={selected}
                  aria-controls={`settings-panel-${slug}`}
                  className={`settings-tabs__tab app-button-press${
                    selected ? " settings-tabs__tab--active" : ""
                  }`}
                  {...getTabProps(slug)}
                >
                  {formKindLabel(kind)}
                </button>
              );
            })}
            <span
              className="settings-tabs__indicator"
              style={{
                transform: `translateX(${SETTINGS_TAB_SLUGS.indexOf(activeSlug) * 100}%)`,
                width: `${100 / SETTINGS_TAB_SLUGS.length}%`,
              }}
              aria-hidden="true"
            />
          </div>

          {SETTINGS_TAB_SLUGS.map((slug) => {
            const kind = slugToFormKind(slug)!;
            const selected = slug === activeSlug;
            return (
              <div key={slug} hidden={!selected}>
                <FormSettingsPanel
                  slug={slug}
                  formKind={kind}
                  title={formKindLabel(kind)}
                  routerForm={routerFormBySlug.get(slug) ?? null}
                  gmailConnected={Boolean(initialGmailStatus?.connected)}
                  onRouterFormChange={(form) => {
                    setRouterForms((current) => {
                      const next = current.filter((row) => row.slug !== form.slug);
                      next.push(form);
                      return next;
                    });
                  }}
                />
              </div>
            );
          })}
        </SectionCard>
      </div>
    </main>
  );
}
