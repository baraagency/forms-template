import { useEffect, useMemo, useState } from "react";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectEmpty,
  MultiSelectInput,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/motion/multi-select";
import { Notice, Spinner } from "../_core/ui";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }
  return payload;
}

export function useFubTagOptions() {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const payload = await readJson<{ tags: string[] }>(
          await fetch("/api/fub/tags"),
        );
        if (!cancelled) {
          setTags(payload.tags);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setTags([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load FUB tags.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { tags, loading, error };
}

export function FubTagsMultiSelect({
  id,
  label,
  ariaLabel,
  value,
  options,
  optionsLoading,
  optionsError,
  disabled = false,
  saving = false,
  onChange,
}: {
  id: string;
  label?: string;
  ariaLabel: string;
  value: string[];
  options: string[];
  optionsLoading: boolean;
  optionsError: string | null;
  disabled?: boolean;
  saving?: boolean;
  onChange: (tags: string[]) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();

  const allOptions = useMemo(() => {
    const merged = new Set<string>();
    for (const tag of options) merged.add(tag);
    for (const tag of value) merged.add(tag);
    return [...merged].sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: "base" }),
    );
  }, [options, value]);

  const showCreateOption =
    trimmedQuery.length > 0 &&
    !allOptions.some(
      (tag) => tag.toLocaleLowerCase() === trimmedQuery.toLocaleLowerCase(),
    );

  const handleValueChange = (next: string[]) => {
    void onChange(next);
  };

  return (
    <div className="bara-field settings-fub-tags-field">
      {label ? (
        <label className="bara-label" htmlFor={`${id}-input`}>
          {label}
        </label>
      ) : null}
      {optionsError ? (
        <Notice tone="warning">
          Could not load FUB tag catalog. You can still add custom tags.
        </Notice>
      ) : null}
      <MultiSelect
        value={value}
        onValueChange={handleValueChange}
        query={query}
        onQueryChange={setQuery}
        disabled={disabled || saving}
      >
        <MultiSelectTrigger className="settings-fub-tags-trigger">
          <MultiSelectValue placeholder={`Select ${ariaLabel.toLowerCase()}`} />
          <MultiSelectInput
            id={`${id}-input`}
            aria-label={ariaLabel}
            placeholder="Search or add tags…"
            showIcon
          />
        </MultiSelectTrigger>
        <MultiSelectContent className="settings-fub-tags-menu">
          <MultiSelectList ariaLabel={ariaLabel} className="settings-fub-tags-list">
            {optionsLoading ? (
              <div className="settings-fub-tags-loading">
                <Spinner />
              </div>
            ) : null}
            {showCreateOption ? (
              <MultiSelectItem
                value={trimmedQuery}
                textValue={`Create "${trimmedQuery}"`}
                className="settings-fub-tags-option"
              >
                Create &ldquo;{trimmedQuery}&rdquo;
              </MultiSelectItem>
            ) : null}
            {allOptions.map((tag) => (
              <MultiSelectItem
                key={tag}
                value={tag}
                textValue={tag}
                className="settings-fub-tags-option"
              >
                {tag}
              </MultiSelectItem>
            ))}
            <MultiSelectEmpty className="settings-fub-tags-empty">
              {trimmedQuery
                ? "No matching tags. Press Enter to create a custom tag."
                : "No tags available."}
            </MultiSelectEmpty>
          </MultiSelectList>
        </MultiSelectContent>
      </MultiSelect>
      {saving ? (
        <p className="settings-hint" role="status">Saving tags…</p>
      ) : null}
    </div>
  );
}
