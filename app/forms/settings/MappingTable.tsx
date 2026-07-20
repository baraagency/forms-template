import { useEffect, useState } from "react";
import {
  Notice,
  TextInput,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@baraagency/components";
import { PillToggle } from "./PillToggle";

type MappingRow = {
  id: number;
  field_name: string;
  enabled: boolean;
};

type MappingTableProps<TRow extends MappingRow> = {
  rows: TRow[];
  targetLabel: string;
  getTargetValue: (row: TRow) => string;
  extraFields?: Array<{
    key: string;
    label: string;
    getValue: (row: TRow) => string | boolean;
    type?: "text" | "checkbox";
  }>;
  onToggleEnabled: (row: TRow, enabled: boolean) => Promise<void>;
  onSaveRow: (
    row: TRow,
    draft: { target: string; extras: Record<string, string | boolean> },
  ) => Promise<void>;
  emptyHint: string;
};

export function MappingTable<TRow extends MappingRow>({
  rows,
  targetLabel,
  getTargetValue,
  extraFields = [],
  onToggleEnabled,
  onSaveRow,
  emptyHint,
}: MappingTableProps<TRow>) {
  const [drafts, setDrafts] = useState<
    Record<number, { target: string; extras: Record<string, string | boolean> }>
  >({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<
      number,
      { target: string; extras: Record<string, string | boolean> }
    > = {};
    for (const row of rows) {
      const extras: Record<string, string | boolean> = {};
      for (const field of extraFields) {
        extras[field.key] = field.getValue(row);
      }
      next[row.id] = {
        target: getTargetValue(row),
        extras,
      };
    }
    setDrafts(next);
    // Re-seed drafts when the row set changes (ids / values from server).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional sync on rows
  }, [rows]);

  if (rows.length === 0) {
    return <p className="settings-hint">{emptyHint}</p>;
  }

  return (
    <div className="settings-mapping-table">
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <div className="settings-mapping-table__head">
        <span>Field</span>
        <span>{targetLabel}</span>
        {extraFields.map((field) => (
          <span key={field.key}>{field.label}</span>
        ))}
        <span>Enabled</span>
        <span />
      </div>
      {rows.map((row) => {
        const draft = drafts[row.id] ?? {
          target: getTargetValue(row),
          extras: {},
        };
        const extrasDirty = extraFields.some((field) => {
          return draft.extras[field.key] !== field.getValue(row);
        });
        const dirty = draft.target !== getTargetValue(row) || extrasDirty;

        return (
          <div key={row.id} className="settings-mapping-table__row">
            <code className="settings-mapping-table__field">{row.field_name}</code>
            <TextInput
              id={`mapping-target-${row.id}`}
              label=""
              value={draft.target}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [row.id]: {
                    ...draft,
                    target: event.target.value,
                  },
                }))
              }
            />
            {extraFields.map((field) =>
              field.type === "checkbox" ? (
                <label
                  key={field.key}
                  className="settings-checkbox"
                  htmlFor={`mapping-extra-${row.id}-${field.key}`}
                >
                  <input
                    id={`mapping-extra-${row.id}-${field.key}`}
                    type="checkbox"
                    checked={Boolean(draft.extras[field.key])}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [row.id]: {
                          ...draft,
                          extras: {
                            ...draft.extras,
                            [field.key]: event.target.checked,
                          },
                        },
                      }))
                    }
                  />
                  {field.label}
                </label>
              ) : (
                <TextInput
                  key={field.key}
                  id={`mapping-extra-${row.id}-${field.key}`}
                  label=""
                  value={String(draft.extras[field.key] ?? "")}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [row.id]: {
                        ...draft,
                        extras: {
                          ...draft.extras,
                          [field.key]: event.target.value,
                        },
                      },
                    }))
                  }
                />
              ),
            )}
            <PillToggle
              label="Enabled"
              checked={row.enabled}
              onChange={async (enabled) => {
                setError(null);
                try {
                  await onToggleEnabled(row, enabled);
                } catch (toggleError) {
                  setError(
                    toggleError instanceof Error
                      ? toggleError.message
                      : "Failed to update enabled state.",
                  );
                }
              }}
            />
            <button
              type="button"
              className={`app-button-press ${dirty ? primaryButtonClassName : secondaryButtonClassName}`}
              disabled={!dirty || savingId === row.id}
              onClick={async () => {
                setSavingId(row.id);
                setError(null);
                try {
                  await onSaveRow(row, draft);
                } catch (saveError) {
                  setError(
                    saveError instanceof Error
                      ? saveError.message
                      : "Failed to save row.",
                  );
                } finally {
                  setSavingId(null);
                }
              }}
            >
              {savingId === row.id ? "Saving…" : "Save"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
