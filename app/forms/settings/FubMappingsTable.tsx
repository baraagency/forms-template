"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Notice,
  Spinner,
  TextInput,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@baraagency/components";
import type { SettingsFormKind } from "../_core/formIdentity";
import { FormSelectInput } from "../_core/formSelectInput";
import { getFormFieldLabel } from "./formFieldCatalog";

const ROWS_PER_PAGE = 5;

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
}: FubMappingsTableProps) {
  const [drafts, setDrafts] = useState<Record<number, FubDraft>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [savingId, setSavingId] = useState<number | null>(null);
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

  useEffect(() => {
    setPage(0);
  }, [searchQuery, formKind]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) => {
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
  }, [drafts, formKind, normalizedSearch, rows]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredRows.length / ROWS_PER_PAGE) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredRows.length, page]);

  const paginatedRows = useMemo(() => {
    const start = page * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, page]);

  if (rows.length === 0) {
    return <p className="settings-hint">{emptyHint}</p>;
  }

  return (
    <div className="settings-sisu-mappings">
      {error ? <Notice tone="warning">{error}</Notice> : null}
      {fieldOptionsError ? (
        <Notice tone="warning">{fieldOptionsError}</Notice>
      ) : null}

      <div className="settings-mapping-search-row">
        <TextInput
          id={searchId}
          label="Search mappings"
          value={searchQuery}
          placeholder={`Filter by form field or ${targetLabel}…`}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      {fieldOptionsLoading ? (
        <p className="settings-hint flex items-center gap-2">
          <Spinner className="h-4 w-4" />
          Loading {targetLabel} options…
        </p>
      ) : null}

      <TableContainer className="settings-mapping-table-container">
        <Table size="small" aria-label={tableAriaLabel}>
          <TableHead>
            <TableRow>
              <TableCell scope="col">Form field</TableCell>
              <TableCell scope="col">{targetLabel}</TableCell>
              <TableCell scope="col" align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <p className="settings-hint py-2">
                    No mappings match your search.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                const draft = drafts[row.id] ?? {
                  fubFieldName: row.fub_field_name ?? "",
                };
                const dirty = isDirty(row, draft);
                const formLabel = getFormFieldLabel(formKind, row.field_name);
                const selectedStillPresent = fieldOptions.includes(
                  draft.fubFieldName,
                );

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <div className="settings-mapping-form-field">
                        <span className="settings-mapping-form-field__label">
                          {formLabel}
                        </span>
                        <code className="settings-mapping-table__field">
                          {row.field_name}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="settings-mapping-table-select">
                        <FormSelectInput
                          id={`fub-field-${searchId}-${row.id}`}
                          label={targetLabel}
                          value={draft.fubFieldName}
                          disabled={fieldOptionsLoading}
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
                    <TableCell align="right">
                      <div className="settings-mapping-table-actions">
                        <button
                          type="button"
                          className={`app-button-press ${
                            dirty
                              ? primaryButtonClassName
                              : secondaryButtonClassName
                          }`}
                          disabled={!dirty || savingId === row.id}
                          onClick={async () => {
                            setSavingId(row.id);
                            setError(null);
                            try {
                              const fubFieldName =
                                draft.fubFieldName.trim() || null;
                              await onSaveRow(row, {
                                fub_field_name: fubFieldName,
                                enabled: Boolean(fubFieldName),
                              });
                            } catch (saveError) {
                              setError(
                                saveError instanceof Error
                                  ? saveError.message
                                  : "Failed to save mapping.",
                              );
                            } finally {
                              setSavingId(null);
                            }
                          }}
                        >
                          {savingId === row.id ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          className="settings-mapping-pagination"
          count={filteredRows.length}
          page={page}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          rowsPerPage={ROWS_PER_PAGE}
          onRowsPerPageChange={() => undefined}
          rowsPerPageOptions={[ROWS_PER_PAGE]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
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
        "/api/fub/deals?fields=allFields&limit=1",
      );
      if (!response.ok) {
        throw new Error(`Unable to load FUB deal fields (HTTP ${response.status}).`);
      }
      const payload = (await response.json()) as {
        deals?: Record<string, unknown>[];
      };
      const deal = payload.deals?.[0] ?? null;
      setKeys(extractFubFieldKeys(deal));
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
