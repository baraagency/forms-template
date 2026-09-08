import { useCallback, useEffect, useState } from "react";
import {
  Notice,
  Spinner,
} from "../_core/ui";
import type {
  FormFubDealMapping,
  FormFubPersonMapping,
  FormFubTag,
  FormSisuMapping,
  RouterForm,
} from "@/app/types/storage";
import type { FormRouterSlug, SettingsFormKind } from "../_core/formIdentity";
import {
  FubMappingsTable,
  useFubDealFieldKeys,
  useFubPersonFieldKeys,
} from "./FubMappingsTable";
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
import { SisuMappingsTable } from "./SisuMappingsTable";
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
  personMaps,
  onReloadMappings,
  panelId,
  labelledBy,
  hidden,
}: {
  formKind: SettingsFormKind;
  personMaps: FormFubPersonMapping[];
  onReloadMappings: () => Promise<void>;
  panelId: string;
  labelledBy: string;
  hidden: boolean;
}) {
  const personStages = usePersonStageOptions();
  const personFields = useFubPersonFieldKeys();
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
          ? "Desired person stages and tags by client type, plus field mappings into a Follow Up Boss person record."
          : "Desired person stage and tags, plus field mappings into a Follow Up Boss person record."}
      </p>

      <div className="settings-fub-subsections">
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

        <div className="settings-fub-subsection">
          <h4 className="settings-subsection-title">Mappings</h4>
          <FubMappingsTable
            formKind={formKind}
            rows={personMaps}
            emptyHint="No person mapping templates for this form."
            targetLabel="FUB person field"
            fieldOptions={personFields.keys}
            fieldOptionsLoading={personFields.loading}
            fieldOptionsError={personFields.error}
            searchId={`${formKind}-person-mappings-search`}
            tableAriaLabel="FUB person field mappings"
            onSaveRow={async (row, draft) => {
              await readJson(
                await fetch(
                  `/api/forms/settings/fub/person-mappings/${row.id}`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fub_field_name: draft.fub_field_name,
                      enabled: draft.enabled,
                    }),
                  },
                ),
              );
            }}
            onAfterSave={onReloadMappings}
          />
        </div>
      </div>
    </div>
  );
}

function FubDealSection({
  formKind,
  dealMaps,
  onReloadMappings,
  panelId,
  labelledBy,
  hidden,
}: {
  formKind: SettingsFormKind;
  dealMaps: FormFubDealMapping[];
  onReloadMappings: () => Promise<void>;
  panelId: string;
  labelledBy: string;
  hidden: boolean;
}) {
  const dealStages = useDealStageOptions();
  const dealFields = useFubDealFieldKeys();
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
          ? "Desired deal stages by client type from your pipelines, and field mappings into a Follow Up Boss deal."
          : "Desired deal stage from your pipelines, and field mappings into a Follow Up Boss deal."}
      </p>

      <div className="settings-fub-subsections">
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

        <div className="settings-fub-subsection">
          <h4 className="settings-subsection-title">Mappings</h4>
          <FubMappingsTable
            formKind={formKind}
            rows={dealMaps}
            emptyHint="No deal mapping templates for this form."
            targetLabel="FUB deal field"
            fieldOptions={dealFields.keys}
            fieldOptionsLoading={dealFields.loading}
            fieldOptionsError={dealFields.error}
            searchId={`${formKind}-deal-mappings-search`}
            tableAriaLabel="FUB deal field mappings"
            onSaveRow={async (row, draft) => {
              await readJson(
                await fetch(
                  `/api/forms/settings/fub/deal-mappings/${row.id}`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fub_field_name: draft.fub_field_name,
                      enabled: draft.enabled,
                    }),
                  },
                ),
              );
            }}
            onAfterSave={onReloadMappings}
          />
        </div>
      </div>
    </div>
  );
}

type MappingDestinationTab = "sisu" | "fub-person" | "fub-deal";

const MAPPING_DESTINATION_TABS: {
  id: MappingDestinationTab;
  label: string;
}[] = [
  { id: "sisu", label: "SISU" },
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
  const [sisu, setSisu] = useState<FormSisuMapping[]>([]);
  const [personMaps, setPersonMaps] = useState<FormFubPersonMapping[]>([]);
  const [dealMaps, setDealMaps] = useState<FormFubDealMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [mappingTab, setMappingTab] =
    useState<MappingDestinationTab>("sisu");
  const mappingTabIds = MAPPING_DESTINATION_TABS.map((tab) => tab.id);
  const { getTabProps: getMappingTabProps } = useRovingTabIndex({
    items: mappingTabIds,
    selected: mappingTab,
    onSelect: setMappingTab,
  });

  const reloadMappings = useCallback(async () => {
    setLoading(true);
    try {
      const [sisuPayload, personPayload, dealPayload] = await Promise.all([
        readJson<{ mappings: FormSisuMapping[] }>(
          await fetch(
            `/api/forms/settings/sisu-mappings?form=${encodeURIComponent(formKind)}`,
          ),
        ),
        readJson<{ mappings: FormFubPersonMapping[] }>(
          await fetch(
            `/api/forms/settings/fub/person-mappings?form=${encodeURIComponent(formKind)}`,
          ),
        ),
        readJson<{ mappings: FormFubDealMapping[] }>(
          await fetch(
            `/api/forms/settings/fub/deal-mappings?form=${encodeURIComponent(formKind)}`,
          ),
        ),
      ]);
      setSisu(sisuPayload.mappings);
      setPersonMaps(personPayload.mappings);
      setDealMaps(dealPayload.mappings);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load form mappings.",
      );
    } finally {
      setLoading(false);
    }
  }, [formKind]);

  useEffect(() => {
    void reloadMappings();
  }, [reloadMappings]);

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
            <h2 className="settings-section-title text-balance">{title}</h2>
            <p className="settings-section-description text-pretty">
              Show this form on the form router and configure email recipients,
              SISU, and FUB mappings.
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
      {loading ? <Spinner /> : null}

      {!loading ? (
        <>
          <FormRecipientsPanel
            formKind={formKind}
            gmailConnected={gmailConnected}
          />

          <section className="settings-section">
            <h3 className="settings-section-title text-balance">
              Field mappings
            </h3>
            <p className="settings-section-description text-pretty">
              Map form fields to SISU or Follow Up Boss. Choose a destination,
              edit freely, then save.
            </p>

            <div
              className="settings-tabs settings-tabs--3"
              role="tablist"
              aria-label={`${title} mapping destinations`}
            >
              {MAPPING_DESTINATION_TABS.map((tab) => {
                const selected = tab.id === mappingTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`${slug}-mapping-tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={`${slug}-mapping-panel-${tab.id}`}
                    className={`settings-tabs__tab app-button-press${
                      selected ? " settings-tabs__tab--active" : ""
                    }`}
                    {...getMappingTabProps(tab.id)}
                  >
                    {tab.label}
                  </button>
                );
              })}
              <span
                className="settings-tabs__indicator"
                style={{
                  transform: `translateX(${
                    MAPPING_DESTINATION_TABS.findIndex(
                      (tab) => tab.id === mappingTab,
                    ) * 100
                  }%)`,
                  width: `${100 / MAPPING_DESTINATION_TABS.length}%`,
                }}
                aria-hidden="true"
              />
            </div>

            <div
              className="settings-mapping-tabs-panel"
              role="tabpanel"
              id={`${slug}-mapping-panel-sisu`}
              aria-labelledby={`${slug}-mapping-tab-sisu`}
              hidden={mappingTab !== "sisu"}
            >
              <p className="settings-section-description text-pretty">
                Map form fields to SISU field names. Stored for future submit
                workflows.
              </p>
              <SisuMappingsTable
                formKind={formKind}
                rows={sisu}
                emptyHint="No SISU mapping templates for this form."
                onSaveRow={async (row, draft) => {
                  await readJson(
                    await fetch(`/api/forms/settings/sisu-mappings/${row.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(draft),
                    }),
                  );
                }}
                onAfterSave={reloadMappings}
              />
            </div>

            <FubPersonSection
              formKind={formKind}
              personMaps={personMaps}
              onReloadMappings={reloadMappings}
              panelId={`${slug}-mapping-panel-fub-person`}
              labelledBy={`${slug}-mapping-tab-fub-person`}
              hidden={mappingTab !== "fub-person"}
            />

            <FubDealSection
              formKind={formKind}
              dealMaps={dealMaps}
              onReloadMappings={reloadMappings}
              panelId={`${slug}-mapping-panel-fub-deal`}
              labelledBy={`${slug}-mapping-tab-fub-deal`}
              hidden={mappingTab !== "fub-deal"}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
