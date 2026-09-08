import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Spinner,
  TextInput,
  secondaryButtonClassName,
} from "../_core/ui";
import type { SISUTeamFieldsCatalogResponse } from "@/app/types/sisu";
import type { FormSisuMapping } from "@/app/types/storage";
import type { SettingsFormKind } from "../_core/formIdentity";
import type { TeamFieldCatalog } from "../_core/teamFieldOptions";
import { FormSelectInput } from "../_core/formSelectInput";
import { PrimaryButton } from "../_core/PrimaryButton";
import { FormEmptyState } from "../_core/FormEmptyState";
import { FormNotice } from "../_core/FormNotice";
import { getFormFieldLabel, sortMappingsByMappedFirst } from "./formFieldCatalog";

const ROWS_PER_PAGE = 5;

const RESERVED_SISU_FIELD_NAMES = new Set([
  "agent_id",
  "type_id",
  "lead_source",
  "source",
]);

type SisuDraft = {
  sisuFieldName: string;
  sisuFieldType: string;
  custom: boolean;
};

type SisuSelectOption = {
  value: string;
  label: string;
  type: string;
  custom: boolean;
};

function isDirty(mapping: FormSisuMapping, draft: SisuDraft): boolean {
  const nextEnabled = Boolean(draft.sisuFieldName.trim());
  return (
    draft.sisuFieldName !== (mapping.sisu_field_name ?? "") ||
    draft.sisuFieldType !== (mapping.sisu_field_type ?? "") ||
    draft.custom !== mapping.custom ||
    nextEnabled !== mapping.enabled
  );
}

function readTeamFieldName(field: TeamFieldCatalog[string]): string {
  return (field.name || "").trim();
}

function readTeamFieldLabel(field: TeamFieldCatalog[string]): string {
  return (field.label || field.name || "").trim();
}

function readTeamFieldType(field: TeamFieldCatalog[string]): string {
  return field.type ?? "";
}

function getSisuFieldSelectOptions(
  teamFields: TeamFieldCatalog,
): SisuSelectOption[] {
  return Object.values(teamFields)
    .map((field) => {
      const value = readTeamFieldName(field);
      const label = readTeamFieldLabel(field);
      return {
        value,
        label: label || value,
        type: readTeamFieldType(field),
        custom: field.custom ?? false,
      };
    })
    .filter(
      (field) =>
        field.value &&
        !RESERVED_SISU_FIELD_NAMES.has(field.value) &&
        field.label.toLowerCase() !== "lead source",
    )
    .sort((left, right) => left.label.localeCompare(right.label));
}

function syncDraftWithSisuField(
  draft: SisuDraft,
  sisuFieldName: string,
  options: SisuSelectOption[],
): SisuDraft {
  if (!sisuFieldName) {
    return {
      sisuFieldName: "",
      sisuFieldType: "",
      custom: false,
    };
  }

  const selected = options.find((option) => option.value === sisuFieldName);
  return {
    sisuFieldName,
    sisuFieldType: selected?.type ?? "",
    custom: selected?.custom ?? false,
  };
}

type SisuMappingsTableProps = {
  formKind: SettingsFormKind;
  rows: FormSisuMapping[];
  emptyHint: string;
  onSaveRow: (
    row: FormSisuMapping,
    draft: {
      sisu_field_name: string | null;
      sisu_field_type: string | null;
      custom: boolean;
      enabled: boolean;
    },
  ) => Promise<void>;
  /** Called once after all dirty rows are saved successfully. */
  onAfterSave?: () => Promise<void>;
};

export function SisuMappingsTable({
  formKind,
  rows,
  emptyHint,
  onSaveRow,
  onAfterSave,
}: SisuMappingsTableProps) {
  const [drafts, setDrafts] = useState<Record<number, SisuDraft>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamFields, setTeamFields] = useState<TeamFieldCatalog>({});
  const [teamFieldsLoading, setTeamFieldsLoading] = useState(true);
  const [teamFieldsError, setTeamFieldsError] = useState<string | null>(null);

  const loadTeamFields = useCallback(async () => {
    setTeamFieldsLoading(true);
    setTeamFieldsError(null);
    try {
      const response = await fetch("/api/sisu/team-fields");
      if (!response.ok) {
        throw new Error(`Unable to load SISU team fields (HTTP ${response.status}).`);
      }
      const payload = (await response.json()) as SISUTeamFieldsCatalogResponse;
      setTeamFields(payload.fields ?? {});
    } catch (loadError) {
      setTeamFields({});
      setTeamFieldsError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load SISU team fields.",
      );
    } finally {
      setTeamFieldsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeamFields();
  }, [loadTeamFields]);

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          {
            sisuFieldName: row.sisu_field_name ?? "",
            sisuFieldType: row.sisu_field_type ?? "",
            custom: row.custom,
          },
        ]),
      ),
    );
  }, [rows]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, formKind]);

  const sisuFieldOptions = useMemo(
    () => getSisuFieldSelectOptions(teamFields),
    [teamFields],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    const matched = !normalizedSearch
      ? rows
      : rows.filter((row) => {
          const draft = drafts[row.id];
          const formLabel = getFormFieldLabel(formKind, row.field_name);
          const sisuLabel =
            sisuFieldOptions.find(
              (option) =>
                option.value ===
                (draft?.sisuFieldName ?? row.sisu_field_name ?? ""),
            )?.label ??
            draft?.sisuFieldName ??
            row.sisu_field_name ??
            "";
          const haystack = [
            formLabel,
            row.field_name,
            sisuLabel,
            draft?.sisuFieldName ?? row.sisu_field_name ?? "",
            draft?.sisuFieldType ?? row.sisu_field_type ?? "",
            (draft?.custom ?? row.custom) ? "custom" : "system",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        });

    return sortMappingsByMappedFirst(formKind, matched, (row) => {
      const draft = drafts[row.id];
      const sisuFieldName = (
        draft?.sisuFieldName ?? row.sisu_field_name ?? ""
      ).trim();
      return sisuFieldName.length > 0;
    });
  }, [drafts, formKind, normalizedSearch, rows, sisuFieldOptions]);

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
        const sisuFieldName = draft.sisuFieldName.trim() || null;
        await onSaveRow(row, {
          sisu_field_name: sisuFieldName,
          sisu_field_type: sisuFieldName
            ? draft.sisuFieldType.trim() || null
            : null,
          custom: sisuFieldName ? draft.custom : false,
          enabled: Boolean(sisuFieldName),
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
      {teamFieldsError ? (
        <FormNotice tone="warning">{teamFieldsError}</FormNotice>
      ) : null}

      <div className="settings-mapping-search-row">
        <div className="settings-mapping-search-row__field">
          <TextInput
            id="sisu-mappings-search"
            label="Search mappings"
            value={searchQuery}
            placeholder="Filter by form field, SISU field, or type…"
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

      {teamFieldsLoading ? (
        <p className="settings-hint flex items-center gap-2">
          <Spinner className="h-4 w-4" />
          Loading SISU team fields…
        </p>
      ) : null}

      <TableContainer className="settings-mapping-table-container">
        <Table size="small" aria-label="SISU field mappings">
          <TableHead>
            <TableRow>
              <TableCell scope="col">Form field</TableCell>
              <TableCell scope="col">SISU field</TableCell>
              <TableCell scope="col">Type</TableCell>
              <TableCell scope="col">Custom</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <p className="settings-hint py-2">
                    No mappings match your search.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                const draft = drafts[row.id] ?? {
                  sisuFieldName: row.sisu_field_name ?? "",
                  sisuFieldType: row.sisu_field_type ?? "",
                  custom: row.custom,
                };
                const formLabel = getFormFieldLabel(formKind, row.field_name);
                const selectedStillPresent = sisuFieldOptions.some(
                  (option) => option.value === draft.sisuFieldName,
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
                          id={`sisu-field-${row.id}`}
                          label="SISU field"
                          value={draft.sisuFieldName}
                          disabled={teamFieldsLoading || saving}
                          onChange={(event) => {
                            const nextName = event.target.value;
                            setDrafts((current) => ({
                              ...current,
                              [row.id]: syncDraftWithSisuField(
                                draft,
                                nextName,
                                sisuFieldOptions,
                              ),
                            }));
                          }}
                        >
                          <option value="">Select SISU field...</option>
                          {draft.sisuFieldName && !selectedStillPresent ? (
                            <option value={draft.sisuFieldName}>
                              {draft.sisuFieldName} (not in catalog)
                            </option>
                          ) : null}
                          {sisuFieldOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </FormSelectInput>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="settings-mapping-type tabular-nums">
                        {draft.sisuFieldType || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="settings-mapping-type">
                        {draft.custom ? "Custom" : "System"}
                      </span>
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
