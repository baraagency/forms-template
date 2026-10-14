import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TextInput, secondaryButtonClassName } from "../_core/ui";
import type { SettingsFormKind } from "../_core/formIdentity";
import { FormSelectInput } from "../_core/formSelectInput";
import { PrimaryButton } from "../_core/PrimaryButton";
import { FormEmptyState } from "../_core/FormEmptyState";
import { FormNotice } from "../_core/FormNotice";
import { getFormFieldLabel, sortMappingsByMappedFirst } from "./formFieldCatalog";
import {
  MAPPING_TABLE_SKELETON_ROWS,
  useMappingTableInfiniteScroll,
} from "./useMappingTableInfiniteScroll";

type FubMappingRow = {
  id: number;
  field_name: string;
  fub_field_name: string | null;
  enabled: boolean;
};

type FubDraft = {
  fubFieldName: string;
};

function isDirty(row: FubMappingRow, draft: FubDraft): boolean {
  const nextEnabled = Boolean(draft.fubFieldName.trim());
  return (
    draft.fubFieldName !== (row.fub_field_name ?? "") ||
    nextEnabled !== row.enabled
  );
}

/** Top-level keys from a FUB person/deal sample object, sorted. */
export function extractFubFieldKeys(sample: Record<string, unknown> | null): string[] {
  if (!sample) {
    return [];
  }
  return Object.keys(sample).sort((left, right) => left.localeCompare(right));
}

/**
 * Union of top-level keys across every sample record, sorted. Different
 * deals can carry different custom fields (e.g. per pipeline/stage), so
 * field options should reflect any deal returned rather than only the
 * first one.
 */
export function extractFubFieldKeysFromAny(
  samples: readonly Record<string, unknown>[],
): string[] {
  const keys = new Set<string>();
  for (const sample of samples) {
    for (const key of Object.keys(sample)) {
      keys.add(key);
    }
  }
  return Array.from(keys).sort((left, right) => left.localeCompare(right));
}

type FubMappingsTableProps = {
  formKind: SettingsFormKind;
  rows: FubMappingRow[];
  emptyHint: string;
  targetLabel: string;
  fieldOptions: string[];
  fieldOptionsLoading: boolean;
  fieldOptionsError: string | null;
  searchId: string;
  tableAriaLabel: string;
  onSaveRow: (
    row: FubMappingRow,
    draft: { fub_field_name: string | null; enabled: boolean },
  ) => Promise<void>;
  /** Called once after all dirty rows are saved successfully. */
  onAfterSave?: () => Promise<void>;
};

export function FubMappingsTable({
  formKind,
  rows,
  emptyHint,
  targetLabel,
  fieldOptions,
  fieldOptionsLoading,
  fieldOptionsError,
  searchId,
  tableAriaLabel,
  onSaveRow,
  onAfterSave,
}: FubMappingsTableProps) {
  const [drafts, setDrafts] = useState<Record<number, FubDraft>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          { fubFieldName: row.fub_field_name ?? "" },
        ]),
      ),
    );
  }, [rows]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    const matched = !normalizedSearch
      ? rows
      : rows.filter((row) => {
          const draft = drafts[row.id];
          const formLabel = getFormFieldLabel(formKind, row.field_name);
          const haystack = [
            formLabel,
            row.field_name,
            draft?.fubFieldName ?? row.fub_field_name ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        });

    return sortMappingsByMappedFirst(formKind, matched, (row) => {
      const draft = drafts[row.id];
      const fubFieldName = (draft?.fubFieldName ?? row.fub_field_name ?? "").trim();
      return fubFieldName.length > 0;
    });
  }, [drafts, formKind, normalizedSearch, rows]);

  const { scrollRef, visibleRows, onScroll } = useMappingTableInfiniteScroll(
    filteredRows,
    `${formKind}:${normalizedSearch}`,
  );

  const dirtyRows = useMemo(
    () =>
      rows.filter((row) => {
        const draft = drafts[row.id];
        return draft ? isDirty(row, draft) : false;
      }),
    [drafts, rows],
  );
  const dirtyCount = dirtyRows.length;

  const saveDirtyMappings = useCallback(async () => {
    if (dirtyRows.length === 0 || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      for (const row of dirtyRows) {
        const draft = drafts[row.id];
        if (!draft) {
          continue;
        }
        const fubFieldName = draft.fubFieldName.trim() || null;
        await onSaveRow(row, {
          fub_field_name: fubFieldName,
          enabled: Boolean(fubFieldName),
        });
      }
      await onAfterSave?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save mappings.",
      );
    } finally {
      setSaving(false);
    }
  }, [dirtyRows, drafts, onAfterSave, onSaveRow, saving]);

  if (rows.length === 0) {
    return <FormEmptyState>{emptyHint}</FormEmptyState>;
  }

  return (
    <div className="settings-sisu-mappings">
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      {fieldOptionsError ? (
        <FormNotice tone="warning">{fieldOptionsError}</FormNotice>
      ) : null}

      <div className="settings-mapping-search-row">
        <div className="settings-mapping-search-row__field">
          <TextInput
            id={searchId}
            label="Search mappings"
            value={searchQuery}
            placeholder={`Filter by form field or ${targetLabel}…`}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="settings-mapping-search-row__actions">
          {dirtyCount > 0 ? (
            <PrimaryButton
              type="button"
              disabled={saving}
              onClick={() => {
                void saveDirtyMappings();
              }}
            >
              {saving ? "Saving…" : "Save mappings"}
            </PrimaryButton>
          ) : (
            <button
              type="button"
              className={`app-button-press ${secondaryButtonClassName}`}
              disabled
            >
              Save mappings
            </button>
          )}
        </div>
        <p className="settings-mapping-search-row__status">
          {dirtyCount === 0
            ? "No unsaved changes"
            : `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}`}
        </p>
      </div>

      <TableContainer
        className="settings-mapping-table-container"
        aria-busy={fieldOptionsLoading}
      >
        <div
          ref={scrollRef}
          className="settings-mapping-table-scroll"
          onScroll={onScroll}
        >
          <Table size="small" aria-label={tableAriaLabel}>
          <TableHead>
            <TableRow>
              <TableCell scope="col">Form field</TableCell>
              <TableCell scope="col">{targetLabel}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fieldOptionsLoading ? (
              Array.from({ length: MAPPING_TABLE_SKELETON_ROWS }, (_, index) => (
                <TableRow
                  key={`fub-mapping-skeleton-${index}`}
                  className="settings-mapping-table-row--skeleton"
                >
                  <TableCell>
                    <div
                      className="settings-mapping-table-skeleton-bar"
                      aria-hidden="true"
                    />
                  </TableCell>
                  <TableCell>
                    <div
                      className="settings-mapping-table-skeleton-bar"
                      aria-hidden="true"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2}>
                  <p className="settings-hint py-2">
                    No mappings match your search.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const draft = drafts[row.id] ?? {
                  fubFieldName: row.fub_field_name ?? "",
                };
                const formLabel = getFormFieldLabel(formKind, row.field_name);
                const selectedStillPresent = fieldOptions.includes(
                  draft.fubFieldName,
                );

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <span className="settings-mapping-form-field__label">
                        {formLabel}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="settings-mapping-table-select">
                        <FormSelectInput
                          id={`fub-field-${searchId}-${row.id}`}
                          label={targetLabel}
                          value={draft.fubFieldName}
                          disabled={fieldOptionsLoading || saving}
                          onChange={(event) => {
                            const nextName = event.target.value;
                            setDrafts((current) => ({
                              ...current,
                              [row.id]: { fubFieldName: nextName },
                            }));
                          }}
                        >
                          <option value="">Select {targetLabel}...</option>
                          {draft.fubFieldName && !selectedStillPresent ? (
                            <option value={draft.fubFieldName}>
                              {draft.fubFieldName} (not in sample)
                            </option>
                          ) : null}
                          {fieldOptions.map((key) => (
                            <option key={key} value={key}>
                              {key}
                            </option>
                          ))}
                        </FormSelectInput>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          </Table>
        </div>
      </TableContainer>
    </div>
  );
}

export function useFubPersonFieldKeys() {
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/fub/people?fields=allFields&limit=1",
      );
      if (!response.ok) {
        throw new Error(`Unable to load FUB person fields (HTTP ${response.status}).`);
      }
      const payload = (await response.json()) as {
        people?: Record<string, unknown>[];
      };
      const person = payload.people?.[0] ?? null;
      setKeys(extractFubFieldKeys(person));
    } catch (loadError) {
      setKeys([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load FUB person fields.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { keys, loading, error };
}

export function useFubDealFieldKeys() {
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/fub/deals?fields=allFields&limit=25",
      );
      if (!response.ok) {
        throw new Error(`Unable to load FUB deal fields (HTTP ${response.status}).`);
      }
      const payload = (await response.json()) as {
        deals?: Record<string, unknown>[];
      };
      setKeys(extractFubFieldKeysFromAny(payload.deals ?? []));
    } catch (loadError) {
      setKeys([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load FUB deal fields.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { keys, loading, error };
}
