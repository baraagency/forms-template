import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createUsePuck } from "@puckeditor/core";
import { isLockedClientTypeSisuMapping } from "@/app/forms/settings/formFieldCatalog";
import type {
  FormFubDealMapping,
  FormFubPersonMapping,
  FormSisuMapping,
} from "@/app/types/storage";
import type { SISUTeamFieldsCatalogResponse } from "@/app/types/sisu";
import { usePageEditorForm } from "./PageEditorFormContext";

const usePuck = createUsePuck();

const RESERVED_SISU_FIELDS = new Set([
  "agent_id",
  "type_id",
  "lead_source",
  "source",
]);

type SisuOption = {
  value: string;
  label: string;
  type: string;
  custom: boolean;
};

type MappingData = {
  sisu: FormSisuMapping[];
  person: FormFubPersonMapping[];
  deal: FormFubDealMapping[];
};

type Values = {
  sisu: string;
  person: string;
  deal: string;
};

const EMPTY_MAPPINGS: MappingData = { sisu: [], person: [], deal: [] };

function extractKeys(samples: readonly Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const sample of samples) {
    for (const key of Object.keys(sample)) {
      keys.add(key);
    }
  }
  return [...keys].sort((left, right) => left.localeCompare(right));
}

function buildSisuOptions(
  fields: SISUTeamFieldsCatalogResponse["fields"],
): SisuOption[] {
  return Object.values(fields)
    .map((field) => ({
      value: field.name,
      label: field.label || field.name,
      type: field.type ?? "",
      custom: field.custom ?? false,
    }))
    .filter(
      (field) =>
        field.value &&
        !RESERVED_SISU_FIELDS.has(field.value) &&
        field.label.toLowerCase() !== "lead source",
    )
    .sort((left, right) => left.label.localeCompare(right.label));
}

function valuesFrom(data: MappingData, fieldName: string): Values {
  const sisu = data.sisu.find((row) => row.field_name === fieldName);
  const person = data.person.find((row) => row.field_name === fieldName);
  const deal = data.deal.find((row) => row.field_name === fieldName);
  return {
    sisu: sisu?.sisu_field_name ?? "",
    person: person?.fub_field_name ?? "",
    deal: deal?.fub_field_name ?? "",
  };
}

export function FieldMappingsPanel() {
  const form = usePageEditorForm();
  const selectedItem = usePuck((state) => state.selectedItem);
  const fieldId =
    selectedItem?.type === "FieldBlock"
      ? (selectedItem.props.id as string | undefined)
      : undefined;
  const fieldLabel =
    selectedItem?.type === "FieldBlock"
      ? String(selectedItem.props.label ?? "Field")
      : "Field";

  const [mappings, setMappings] = useState<MappingData>(EMPTY_MAPPINGS);
  const [sisuOptions, setSisuOptions] = useState<SisuOption[]>([]);
  const [personFields, setPersonFields] = useState<string[]>([]);
  const [dealFields, setDealFields] = useState<string[]>([]);
  const [values, setValues] = useState<Values>({ sisu: "", person: "", deal: "" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const controlId = useId();

  const locked =
    Boolean(fieldId) && isLockedClientTypeSisuMapping(form, fieldId!);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      setError(null);
      try {
        const [mappingsResponse, sisuResponse, peopleResponse, dealsResponse] =
          await Promise.all([
            fetch(`/api/forms/page/${form}/mappings`, {
              signal: controller.signal,
            }),
            fetch("/api/sisu/team-fields", { signal: controller.signal }),
            fetch("/api/fub/people?fields=allFields&limit=1", {
              signal: controller.signal,
            }),
            fetch("/api/fub/deals?fields=allFields&limit=25", {
              signal: controller.signal,
            }),
          ]);

        if (!mappingsResponse.ok) {
          throw new Error(
            `Unable to load mappings (HTTP ${mappingsResponse.status}).`,
          );
        }

        const mappingsPayload = (await mappingsResponse.json()) as MappingData;
        setMappings(mappingsPayload);

        if (sisuResponse.ok) {
          const sisuPayload =
            (await sisuResponse.json()) as SISUTeamFieldsCatalogResponse;
          setSisuOptions(buildSisuOptions(sisuPayload.fields ?? {}));
        }

        if (peopleResponse.ok) {
          const peoplePayload = (await peopleResponse.json()) as {
            people?: Record<string, unknown>[];
          };
          setPersonFields(extractKeys(peoplePayload.people ?? []));
        }

        if (dealsResponse.ok) {
          const dealsPayload = (await dealsResponse.json()) as {
            deals?: Record<string, unknown>[];
          };
          setDealFields(extractKeys(dealsPayload.deals ?? []));
        }
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load field mappings.",
        );
        setLoadError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load field mappings.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [form]);

  useEffect(() => {
    if (!fieldId) {
      setValues({ sisu: "", person: "", deal: "" });
      return;
    }
    const next = valuesFrom(mappings, fieldId);
    setValues(locked ? { ...next, sisu: "type_id" } : next);
  }, [fieldId, locked, mappings]);

  const sisuSelectOptions = useMemo(() => {
    if (!locked) {
      return sisuOptions;
    }
    return [{ value: "type_id", label: "type_id (locked)", type: "", custom: false }];
  }, [locked, sisuOptions]);

  const sisuChoices = useMemo(() => {
    if (!values.sisu || sisuSelectOptions.some((option) => option.value === values.sisu)) {
      return sisuSelectOptions;
    }
    return [
      ...sisuSelectOptions,
      { value: values.sisu, label: values.sisu, type: "", custom: false },
    ];
  }, [sisuSelectOptions, values.sisu]);

  const personChoices = useMemo(
    () =>
      values.person && !personFields.includes(values.person)
        ? [...personFields, values.person]
        : personFields,
    [personFields, values.person],
  );

  const dealChoices = useMemo(
    () =>
      values.deal && !dealFields.includes(values.deal)
        ? [...dealFields, values.deal]
        : dealFields,
    [dealFields, values.deal],
  );

  const save = (next: Values) => {
    if (!fieldId) {
      return;
    }

    setValues(next);
    setStatus("saving");
    setError(null);

    const selectedSisu = sisuOptions.find(
      (option) => option.value === next.sisu,
    );

    saveChain.current = saveChain.current.then(async () => {
      try {
        const response = await fetch(`/api/forms/page/${form}/mappings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldName: fieldId,
            sisuFieldName: next.sisu || null,
            sisuFieldType: selectedSisu?.type ?? null,
            custom: selectedSisu?.custom ?? false,
            fubPersonField: next.person || null,
            fubDealField: next.deal || null,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        if (!response.ok) {
          throw new Error(payload.message ?? "Unable to save mappings.");
        }
        const refreshed = await fetch(`/api/forms/page/${form}/mappings`);
        if (refreshed.ok) {
          setMappings((await refreshed.json()) as MappingData);
        }
        setStatus("saved");
      } catch (saveError) {
        setStatus("error");
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to save mappings.",
        );
      }
    });
  };

  if (selectedItem?.type !== "FieldBlock" || !fieldId) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Select a field block to configure its mappings.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Loading field mappings…
      </p>
    );
  }

  if (loadError) {
    return (
      <p role="alert" className="text-xs text-[var(--error-color)]">
        {loadError}
      </p>
    );
  }

  return (
    <section className="space-y-3" aria-label={`Field mappings for ${fieldLabel}`}>
      <div>
        <h3 className="text-sm font-semibold">Field mappings</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          {fieldLabel} · saves automatically
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-[var(--error-color)]">
          {error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label
          htmlFor={`${controlId}-sisu`}
          className="block text-xs font-medium"
        >
          SISU field
        </label>
        <select
          id={`${controlId}-sisu`}
          className="w-full rounded border border-[var(--divider-color)] bg-[var(--card-bg)] p-2 text-sm"
          value={values.sisu}
          disabled={locked}
          onChange={(event) => save({ ...values, sisu: event.target.value })}
        >
          <option value="">Not mapped</option>
          {sisuChoices.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {locked ? (
          <span className="block text-[var(--muted-foreground)]">
            Client Type is fixed to SISU type_id.
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`${controlId}-person`}
          className="block text-xs font-medium"
        >
          FUB Person field
        </label>
        <select
          id={`${controlId}-person`}
          className="w-full rounded border border-[var(--divider-color)] bg-[var(--card-bg)] p-2 text-sm"
          value={values.person}
          onChange={(event) => save({ ...values, person: event.target.value })}
        >
          <option value="">Not mapped</option>
          {personChoices.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`${controlId}-deal`}
          className="block text-xs font-medium"
        >
          FUB Deal field
        </label>
        <select
          id={`${controlId}-deal`}
          className="w-full rounded border border-[var(--divider-color)] bg-[var(--card-bg)] p-2 text-sm"
          value={values.deal}
          onChange={(event) => save({ ...values, deal: event.target.value })}
        >
          <option value="">Not mapped</option>
          {dealChoices.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-[var(--muted-foreground)]" role="status">
        {status === "saving"
          ? "Saving mappings…"
          : status === "saved"
            ? "Mappings saved."
            : status === "error"
              ? ""
              : "No changes yet."}
      </p>
    </section>
  );
}
