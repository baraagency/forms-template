import { useCallback, useEffect, useState } from "react";
import {
  Notice,
  Spinner,
  TextInput,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@baraagency/components";
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
import { SisuMappingsTable } from "./SisuMappingsTable";
import { FormRecipientsPanel } from "./GmailAndRecipientsPanels";
import { PillToggle } from "./PillToggle";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }
  return payload;
}

export function TagsEditor({ formKind }: { formKind: SettingsFormKind }) {
  const [tags, setTags] = useState<FormFubTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tag, setTag] = useState("");

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

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="settings-panel-body">
      {error ? <Notice tone="warning">{error}</Notice> : null}
      {loading ? (
        <Spinner />
      ) : tags.length === 0 ? (
        <p className="settings-hint">No tags configured yet.</p>
      ) : (
        <div className="settings-recipient-list">
          {tags.map((row) => (
            <div key={row.id} className="settings-recipient-row">
              <p className="settings-recipient-email">{row.tag}</p>
              <div className="settings-recipient-actions">
                <PillToggle
                  label="Enabled"
                  checked={row.enabled}
                  onChange={async (enabled) => {
                    await readJson(
                      await fetch(`/api/forms/settings/fub/tags/${row.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled }),
                      }),
                    );
                    await reload();
                  }}
                />
                <button
                  type="button"
                  className={`app-button-press ${secondaryButtonClassName}`}
                  onClick={async () => {
                    await readJson(
                      await fetch(`/api/forms/settings/fub/tags/${row.id}`, {
                        method: "DELETE",
                      }),
                    );
                    await reload();
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        className="settings-dynamic-recipient-form"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await readJson(
              await fetch("/api/forms/settings/fub/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ form: formKind, tag }),
              }),
            );
            setTag("");
            await reload();
          } catch (createError) {
            setError(
              createError instanceof Error
                ? createError.message
                : "Failed to add tag.",
            );
          }
        }}
      >
        <TextInput
          id={`${formKind}-new-tag`}
          label="Tag"
          value={tag}
          onChange={(event) => setTag(event.target.value)}
          required
        />
        <div className="settings-dynamic-recipient-actions">
          <button
            type="submit"
            className={`app-button-press ${primaryButtonClassName}`}
          >
            Add tag
          </button>
        </div>
      </form>
    </div>
  );
}

function FubPersonSection({
  formKind,
  personMaps,
  onReloadMappings,
}: {
  formKind: SettingsFormKind;
  personMaps: FormFubPersonMapping[];
  onReloadMappings: () => Promise<void>;
}) {
  const personStages = usePersonStageOptions();
  const personFields = useFubPersonFieldKeys();

  return (
    <section className="settings-section settings-fub-block">
      <h3 className="settings-section-title text-balance">FUB Person</h3>
      <p className="settings-section-description text-pretty">
        Desired person stage, tags applied on submit, and field mappings into a
        Follow Up Boss person record.
      </p>

      <div className="settings-fub-subsections">
        <div className="settings-fub-subsection">
          <h4 className="settings-subsection-title">Stage</h4>
          <DesiredStagePicker
            formKind={formKind}
            target="person"
            label="Desired person stage"
            description="Choose the Follow Up Boss person stage to set after submit."
            options={personStages.options}
            optionsLoading={personStages.loading}
            optionsError={personStages.error}
          />
        </div>

        <div className="settings-fub-subsection">
          <h4 className="settings-subsection-title">Tags</h4>
          <TagsEditor formKind={formKind} />
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
              await onReloadMappings();
            }}
          />
        </div>
      </div>
    </section>
  );
}

function FubDealSection({
  formKind,
  dealMaps,
  onReloadMappings,
}: {
  formKind: SettingsFormKind;
  dealMaps: FormFubDealMapping[];
  onReloadMappings: () => Promise<void>;
}) {
  const dealStages = useDealStageOptions();
  const dealFields = useFubDealFieldKeys();

  return (
    <section className="settings-section settings-fub-block">
      <h3 className="settings-section-title text-balance">FUB Deal</h3>
      <p className="settings-section-description text-pretty">
        Desired deal stage from your pipelines, and field mappings into a Follow
        Up Boss deal.
      </p>

      <div className="settings-fub-subsections">
        <div className="settings-fub-subsection">
          <h4 className="settings-subsection-title">Stage</h4>
          <DesiredStagePicker
            formKind={formKind}
            target="deal"
            label="Desired deal stage"
            description="Choose a pipeline stage to set on the deal after submit."
            options={dealStages.options}
            optionsLoading={dealStages.loading}
            optionsError={dealStages.error}
            nested
          />
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
              await onReloadMappings();
            }}
          />
        </div>
      </div>
    </section>
  );
}

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
    <div className="settings-panel" role="tabpanel" id={`settings-panel-${slug}`}>
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
            <h3 className="settings-section-title text-balance">SISU mappings</h3>
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
                await reloadMappings();
              }}
            />
          </section>

          <FubPersonSection
            formKind={formKind}
            personMaps={personMaps}
            onReloadMappings={reloadMappings}
          />

          <FubDealSection
            formKind={formKind}
            dealMaps={dealMaps}
            onReloadMappings={reloadMappings}
          />
        </>
      ) : null}
    </div>
  );
}
