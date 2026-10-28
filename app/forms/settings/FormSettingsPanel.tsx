import { useCallback, useEffect, useState } from "react";
import { Notice, Spinner } from "../_core/ui";
import type {
  FormFubTag,
  RouterForm,
} from "@/app/types/storage";
import type { FormRouterSlug, SettingsFormKind } from "../_core/formIdentity";
import {
  DesiredStagePicker,
  useDealStageOptions,
  usePersonStageOptions,
} from "./FubStagePicker";
import {
  FUB_CLIENT_TYPES,
  formSupportsFubClientType,
  normalizeFubClientType,
  type FubClientType,
} from "../_core/fubClientTypeSettings";
import { FormRecipientsPanel } from "./GmailAndRecipientsPanels";
import { PillToggle } from "./PillToggle";
import { useRovingTabIndex } from "../_core/useRovingTabIndex";
import { FubTagsMultiSelect, useFubTagOptions } from "./FubTagsMultiSelect";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }
  return payload;
}

export function TagsEditor({
  formKind,
  clientType,
  fubTagOptions,
  fubTagsLoading,
  fubTagsError,
}: {
  formKind: SettingsFormKind;
  clientType: FubClientType | null;
  fubTagOptions: string[];
  fubTagsLoading: boolean;
  fubTagsError: string | null;
}) {
  const [tags, setTags] = useState<FormFubTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await readJson<{ tags: FormFubTag[] }>(
        await fetch(
          `/api/forms/settings/fub/tags?form=${encodeURIComponent(formKind)}`,
        ),
      );
      setTags(payload.tags);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load tags.",
      );
    } finally {
      setLoading(false);
    }
  }, [formKind]);

  const clientTags = tags.filter(
    (row) => normalizeFubClientType(row.client_type) === clientType,
  );
  const selectedTags = clientTags
    .filter((row) => row.enabled)
    .map((row) => row.tag);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveTags = async (nextTags: string[]) => {
    setSaving(true);
    try {
      const payload = await readJson<{ tags: FormFubTag[] }>(
        await fetch("/api/forms/settings/fub/tags", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form: formKind,
            client_type: clientType,
            tags: nextTags,
          }),
        }),
      );
      setTags((current) => {
        const otherClientTags = current.filter(
          (row) => normalizeFubClientType(row.client_type) !== clientType,
        );
        return [...otherClientTags, ...payload.tags];
      });
      setError(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save tags.",
      );
      await reload();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-panel-body">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="settings-panel-body">
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <FubTagsMultiSelect
        id={`${formKind}-${clientType ?? "general"}-tags`}
        ariaLabel={`${clientType ?? "General"} tags`}
        value={selectedTags}
        options={fubTagOptions}
        optionsLoading={fubTagsLoading}
        optionsError={fubTagsError}
        saving={saving}
        onChange={saveTags}
      />
    </div>
  );
}

function FubPersonSection({
  formKind,
  panelId,
  labelledBy,
  hidden,
}: {
  formKind: SettingsFormKind;
  panelId: string;
  labelledBy: string;
  hidden: boolean;
}) {
  const personStages = usePersonStageOptions();
  const fubTagCatalog = useFubTagOptions();
  const clientTypes: readonly (FubClientType | null)[] = formSupportsFubClientType(
    formKind,
  )
    ? FUB_CLIENT_TYPES
    : [null];

  return (
    <div
      className="settings-mapping-tabs-panel"
      role="tabpanel"
      id={panelId}
      aria-labelledby={labelledBy}
      hidden={hidden}
    >
      <p className="settings-section-description text-pretty">
        {clientTypes.length > 1
          ? "Desired person stages and tags by client type. Field mappings live in the page editor."
          : "Desired person stage and tags. Field mappings live in the page editor."}
      </p>

      <div className="settings-fub-client-type-grid">
        {clientTypes.map((clientType) => (
          <div key={clientType ?? "general"} className="settings-fub-subsection">
            <h4 className="settings-subsection-title">{clientType ?? "General"}</h4>
            <h5 className="settings-subsection-eyebrow">Stage</h5>
            <DesiredStagePicker
              formKind={formKind}
              target="person"
              clientType={clientType}
              options={personStages.options}
              optionsLoading={personStages.loading}
              optionsError={personStages.error}
            />
            <h5 className="settings-subsection-eyebrow">Tags</h5>
            <TagsEditor
              formKind={formKind}
              clientType={clientType}
              fubTagOptions={fubTagCatalog.tags}
              fubTagsLoading={fubTagCatalog.loading}
              fubTagsError={fubTagCatalog.error}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FubDealSection({
  formKind,
  panelId,
  labelledBy,
  hidden,
}: {
  formKind: SettingsFormKind;
  panelId: string;
  labelledBy: string;
  hidden: boolean;
}) {
  const dealStages = useDealStageOptions();
  const clientTypes: readonly (FubClientType | null)[] = formSupportsFubClientType(
    formKind,
  )
    ? FUB_CLIENT_TYPES
    : [null];

  return (
    <div
      className="settings-mapping-tabs-panel"
      role="tabpanel"
      id={panelId}
      aria-labelledby={labelledBy}
      hidden={hidden}
    >
      <p className="settings-section-description text-pretty">
        {clientTypes.length > 1
          ? "Desired deal stages by client type from your pipelines. Field mappings live in the page editor."
          : "Desired deal stage from your pipelines. Field mappings live in the page editor."}
      </p>

      <div className="settings-fub-client-type-grid">
        {clientTypes.map((clientType) => (
          <div key={clientType ?? "general"} className="settings-fub-subsection">
            <h4 className="settings-subsection-title">{clientType ?? "General"}</h4>
            <h5 className="settings-subsection-eyebrow">Stage</h5>
            <DesiredStagePicker
              formKind={formKind}
              target="deal"
              clientType={clientType}
              options={dealStages.options}
              optionsLoading={dealStages.loading}
              optionsError={dealStages.error}
              nested
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type FubSettingsTab = "fub-person" | "fub-deal";

const FUB_SETTINGS_TABS: { id: FubSettingsTab; label: string }[] = [
  { id: "fub-person", label: "FUB Person" },
  { id: "fub-deal", label: "FUB Deal" },
];

export function FormSettingsPanel({
  slug,
  formKind,
  title,
  routerForm,
  onRouterFormChange,
  gmailConnected,
}: {
  slug: FormRouterSlug;
  formKind: SettingsFormKind;
  title: string;
  routerForm: RouterForm | null;
  onRouterFormChange: (form: RouterForm) => void;
  gmailConnected: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [fubTab, setFubTab] = useState<FubSettingsTab>("fub-person");
  const fubTabIds = FUB_SETTINGS_TABS.map((tab) => tab.id);
  const { getTabProps } = useRovingTabIndex({
    items: fubTabIds,
    selected: fubTab,
    onSelect: setFubTab,
  });

  const visible = routerForm?.visible ?? true;

  return (
    <div
      className="settings-panel"
      role="tabpanel"
      id={`settings-panel-${slug}`}
      aria-labelledby={`settings-tab-${slug}`}
    >
      <section className="settings-section">
        <div className="settings-section-header">
          <div>
            <h3 className="settings-section-title text-balance">{title}</h3>
            <p className="settings-section-description text-pretty">
              Show this form on the form router and configure email recipients,
              FUB stages, and tags.
            </p>
          </div>
          <PillToggle
            label="Show on form router"
            checked={visible}
            disabled={toggleBusy || !routerForm}
            onChange={async (nextVisible) => {
              if (!routerForm) {
                return;
              }
              setToggleBusy(true);
              setError(null);
              try {
                const payload = await readJson<{ form: RouterForm }>(
                  await fetch(`/api/forms/settings/router-forms/${slug}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ visible: nextVisible }),
                  }),
                );
                onRouterFormChange(payload.form);
              } catch (toggleError) {
                setError(
                  toggleError instanceof Error
                    ? toggleError.message
                    : "Failed to update visibility.",
                );
              } finally {
                setToggleBusy(false);
              }
            }}
          />
        </div>
      </section>

      {error ? <Notice tone="warning">{error}</Notice> : null}

      <FormRecipientsPanel
        formKind={formKind}
        gmailConnected={gmailConnected}
      />

      <section className="settings-section">
        <h3 className="settings-section-title text-balance">
          Follow Up Boss
        </h3>
        <p className="settings-section-description text-pretty">
          Stage and tag rules by client type. Field mappings are configured in
          the page editor.
        </p>

        <div
          className="settings-tabs settings-tabs--2"
          role="tablist"
          aria-label={`${title} Follow Up Boss settings`}
        >
          {FUB_SETTINGS_TABS.map((tab) => {
            const selected = tab.id === fubTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${slug}-fub-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`${slug}-fub-panel-${tab.id}`}
                className={`settings-tabs__tab app-button-press${
                  selected ? " settings-tabs__tab--active" : ""
                }`}
                {...getTabProps(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
          <span
            className="settings-tabs__indicator"
            style={{
              transform: `translateX(${
                FUB_SETTINGS_TABS.findIndex((tab) => tab.id === fubTab) * 100
              }%)`,
              width: `${100 / FUB_SETTINGS_TABS.length}%`,
            }}
            aria-hidden="true"
          />
        </div>

        <FubPersonSection
          formKind={formKind}
          panelId={`${slug}-fub-panel-fub-person`}
          labelledBy={`${slug}-fub-tab-fub-person`}
          hidden={fubTab !== "fub-person"}
        />

        <FubDealSection
          formKind={formKind}
          panelId={`${slug}-fub-panel-fub-deal`}
          labelledBy={`${slug}-fub-tab-fub-deal`}
          hidden={fubTab !== "fub-deal"}
        />
      </section>
    </div>
  );
}
