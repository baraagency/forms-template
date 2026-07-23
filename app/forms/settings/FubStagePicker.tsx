import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Notice,
  Spinner,
} from "@baraagency/components";
import { FormSelectInput } from "../_core/formSelectInput";
import type {
  FUBListPipelinesResponse,
  FUBListStagesResponse,
  FUBPipeline,
  FUBStage,
} from "@/app/types/fub";
import type { FormFubStage, FubStageTarget } from "@/app/types/storage";
import type { SettingsFormKind } from "../_core/formIdentity";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }
  return payload;
}

function desiredStageForTarget(
  stages: FormFubStage[],
  target: FubStageTarget,
): FormFubStage | null {
  return (
    stages.find(
      (stage) => stage.target === target && stage.client_type === null,
    ) ?? null
  );
}

type StageOption = {
  id: number;
  name: string;
  group?: string;
};

function parseStageId(value: string | number): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function DesiredStagePicker({
  formKind,
  target,
  label,
  description,
  options,
  optionsLoading,
  optionsError,
  nested = false,
}: {
  formKind: SettingsFormKind;
  target: FubStageTarget;
  label: string;
  description: string;
  options: StageOption[];
  optionsLoading: boolean;
  optionsError: string | null;
  nested?: boolean;
}) {
  const [savedStages, setSavedStages] = useState<FormFubStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await readJson<{ stages: FormFubStage[] }>(
        await fetch(
          `/api/forms/settings/fub/stages?form=${encodeURIComponent(formKind)}`,
        ),
      );
      setSavedStages(payload.stages);
      const desired = desiredStageForTarget(payload.stages, target);
      setSelectedId(desired ? String(desired.stage_id) : "");
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load desired stage.",
      );
    } finally {
      setLoading(false);
    }
  }, [formKind, target]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectedStillPresent = options.some(
    (option) => String(option.id) === selectedId,
  );
  const desired = desiredStageForTarget(savedStages, target);

  const displayOptions = useMemo(() => {
    if (!nested) {
      return options;
    }
    return options.map((option) => ({
      ...option,
      name: option.group
        ? `${option.group} · ${option.name}`
        : option.name,
    }));
  }, [nested, options]);

  return (
    <div className="settings-panel-body settings-fub-stage-picker">
      <p className="settings-section-description">{description}</p>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      {optionsError ? <Notice tone="warning">{optionsError}</Notice> : null}
      {loading || optionsLoading ? (
        <p className="settings-hint flex items-center gap-2">
          <Spinner className="h-4 w-4" />
          Loading stages…
        </p>
      ) : (
        <FormSelectInput
          id={`${formKind}-${target}-desired-stage`}
          label={label}
          value={selectedId}
          disabled={saving}
          onChange={async (event) => {
            const nextValue = event.target.value;
            const nextId = nextValue === "" ? null : Number(nextValue);
            const nextName =
              nextId === null
                ? null
                : (options.find((option) => option.id === nextId)?.name ??
                  desired?.stage_name ??
                  null);

            setSelectedId(nextValue);
            setSaving(true);
            setError(null);
            try {
              await readJson(
                await fetch("/api/forms/settings/fub/stages", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    form: formKind,
                    target,
                    stage_id: nextId,
                    stage_name: nextName,
                  }),
                }),
              );
              await reload();
            } catch (saveError) {
              setError(
                saveError instanceof Error
                  ? saveError.message
                  : "Failed to save stage.",
              );
              setSelectedId(desired ? String(desired.stage_id) : "");
            } finally {
              setSaving(false);
            }
          }}
        >
          <option value="">No stage selected</option>
          {selectedId && !selectedStillPresent ? (
            <option value={selectedId}>
              {desired?.stage_name
                ? `${desired.stage_name} (${selectedId})`
                : `Stage ${selectedId}`}{" "}
              (not in catalog)
            </option>
          ) : null}
          {displayOptions.map((option) => (
            <option key={option.id} value={String(option.id)}>
              {option.name}
            </option>
          ))}
        </FormSelectInput>
      )}
      {saving ? (
        <p className="settings-hint tabular-nums">Saving stage…</p>
      ) : null}
    </div>
  );
}

export function usePersonStageOptions() {
  const [options, setOptions] = useState<StageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/fub/stages");
        if (!response.ok) {
          throw new Error(
            `Unable to load FUB stages (HTTP ${response.status}).`,
          );
        }
        const payload = (await response.json()) as FUBListStagesResponse;
        const next = (payload.stages ?? [])
          .map((stage: FUBStage) => {
            const id = parseStageId(stage.id);
            if (!id) {
              return null;
            }
            return { id, name: stage.name || `Stage ${id}` };
          })
          .filter((option): option is StageOption => option !== null)
          .sort((left, right) => left.name.localeCompare(right.name));
        if (!cancelled) {
          setOptions(next);
        }
      } catch (loadError) {
        if (!cancelled) {
          setOptions([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load FUB stages.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading, error };
}

export function useDealStageOptions() {
  const [options, setOptions] = useState<StageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/fub/pipelines");
        if (!response.ok) {
          throw new Error(
            `Unable to load FUB pipelines (HTTP ${response.status}).`,
          );
        }
        const payload = (await response.json()) as FUBListPipelinesResponse;
        const next: StageOption[] = [];
        for (const pipeline of payload.pipelines ?? ([] as FUBPipeline[])) {
          const group = pipeline.name || `Pipeline ${pipeline.id}`;
          for (const stage of pipeline.stages ?? []) {
            const id = parseStageId(stage.id);
            if (!id) {
              continue;
            }
            next.push({
              id,
              name: stage.name || `Stage ${id}`,
              group,
            });
          }
        }
        if (!cancelled) {
          setOptions(next);
        }
      } catch (loadError) {
        if (!cancelled) {
          setOptions([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load FUB pipelines.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading, error };
}
