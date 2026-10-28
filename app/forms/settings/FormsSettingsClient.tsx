import { useEffect, useMemo, useState } from "react";
import { Notice, SectionCard } from "../_core/ui";
import type { RouterForm } from "@/app/types/storage";
import {
  SETTINGS_TAB_SLUGS,
  formKindLabel,
  slugToFormKind,
  type FormRouterSlug,
} from "../_core/formIdentity";
import { GmailAccountPanel } from "./GmailAndRecipientsPanels";
import { FormSettingsPanel } from "./FormSettingsPanel";
import { AppearanceSettingsPanel } from "./AppearanceSettingsPanel";
import { BrandingSettingsPanel } from "./BrandingSettingsPanel";
import { SettingsMasthead } from "./SettingsMasthead";
import { SettingsBackLink } from "./SettingsBackLink";
import type { AppBranding, ThemeSelection } from "@/app/theme/appTheme";
import { useRovingTabIndex } from "../_core/useRovingTabIndex";
import "./settings-layout.css";
import "./settings-tabs.css";

const SETTINGS_SECTION_TABS = [
  { id: "forms", label: "Forms" },
  { id: "appearance", label: "Appearance" },
  { id: "integrations", label: "Integrations" },
] as const;

const SETTINGS_SECTION_TAB_IDS = SETTINGS_SECTION_TABS.map((tab) => tab.id);

type SettingsSectionTab = (typeof SETTINGS_SECTION_TABS)[number]["id"];

type GmailStatus = {
  environment: string;
  oauthConfigured: boolean;
  connected: boolean;
  email: string | null;
};

function useWideSettingsLayout() {
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1000px)");
    const update = () => setIsWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isWide;
}

export function FormsSettingsClient({
  initialRouterForms,
  initialGmailStatus,
  initialAppearance,
  initialBranding,
  gmailFlash,
}: {
  initialRouterForms: RouterForm[];
  initialGmailStatus: GmailStatus | null;
  initialAppearance: ThemeSelection;
  initialBranding: AppBranding;
  gmailFlash: { tone: "success" | "warning"; message: string } | null;
}) {
  const [activeSection, setActiveSection] = useState<SettingsSectionTab>(
    gmailFlash ? "integrations" : "forms",
  );
  const [activeSlug, setActiveSlug] =
    useState<FormRouterSlug>("appointment-set");
  const [routerForms, setRouterForms] =
    useState<RouterForm[]>(initialRouterForms);
  const isWideLayout = useWideSettingsLayout();

  const routerFormBySlug = useMemo(() => {
    return new Map(routerForms.map((form) => [form.slug, form]));
  }, [routerForms]);

  const { getTabProps: getSectionTabProps } = useRovingTabIndex({
    items: SETTINGS_SECTION_TAB_IDS,
    selected: activeSection,
    onSelect: setActiveSection,
    orientation: isWideLayout ? "vertical" : "horizontal",
  });

  const { getTabProps } = useRovingTabIndex({
    items: SETTINGS_TAB_SLUGS,
    selected: activeSlug,
    onSelect: setActiveSlug,
  });

  return (
    <main id="main-content" className="page-form settings-page">
      <title>Form Settings</title>

      <SettingsMasthead />

      {gmailFlash ? (
        <div className="settings-flash">
          <Notice tone={gmailFlash.tone}>{gmailFlash.message}</Notice>
        </div>
      ) : null}

      <div className="settings-workspace">
        <nav className="settings-rail" aria-label="Settings navigation">
          <SettingsBackLink />
          <div
            className="settings-rail__tabs"
            role="tablist"
            aria-label="Settings sections"
            aria-orientation={isWideLayout ? "vertical" : "horizontal"}
          >
            {SETTINGS_SECTION_TABS.map((tab) => {
              const selected = tab.id === activeSection;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`settings-section-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`settings-section-panel-${tab.id}`}
                  className={`settings-rail__tab app-button-press${
                    selected ? " settings-rail__tab--active" : ""
                  }`}
                  {...getSectionTabProps(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="settings-panels">
          <div
            className="settings-tab-panel"
            role="tabpanel"
            id="settings-section-panel-forms"
            aria-labelledby="settings-section-tab-forms"
            hidden={activeSection !== "forms"}
          >
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
                          const next = current.filter(
                            (row) => row.slug !== form.slug,
                          );
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

          <div
            className="settings-tab-panel"
            role="tabpanel"
            id="settings-section-panel-appearance"
            aria-labelledby="settings-section-tab-appearance"
            hidden={activeSection !== "appearance"}
          >
            <div className="settings-appearance-grid">
              <SectionCard title="Colors">
                <AppearanceSettingsPanel initialSelection={initialAppearance} />
              </SectionCard>
              <SectionCard title="Branding">
                <BrandingSettingsPanel initialBranding={initialBranding} />
              </SectionCard>
            </div>
          </div>

          <div
            className="settings-tab-panel"
            role="tabpanel"
            id="settings-section-panel-integrations"
            aria-labelledby="settings-section-tab-integrations"
            hidden={activeSection !== "integrations"}
          >
            <SectionCard title="Gmail">
              <GmailAccountPanel initialStatus={initialGmailStatus} />
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}
