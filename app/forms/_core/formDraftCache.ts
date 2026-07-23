import type { SubmissionFormType } from "./submissionUtils";

const draftVersion = 1;
const draftStorageAppPrefix = "forms-template";

type FormDraftRecord<TState extends Record<string, string>> = {
  version: typeof draftVersion;
  updatedAt: string;
  formState: TState;
};

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** In-memory mirror of localStorage reads/writes (js-cache-storage). */
const storageCache = new Map<string, string | null>();

function getDraftStorage(): DraftStorage | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }

  return window.localStorage;
}

function normalizePersonId(personId: string): string {
  return personId.trim();
}

export function getFormDraftStorageKey(
  formType: SubmissionFormType,
  personId: string,
): string {
  const normalizedPersonId = normalizePersonId(personId);
  if (!normalizedPersonId) {
    return "";
  }

  return `${draftStorageAppPrefix}:${formType}:draft:v${draftVersion}:${normalizedPersonId}`;
}

function isFormDraftState(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return typeof (value as { personId?: unknown }).personId === "string";
}

function isFormDraftRecord(
  value: unknown,
): value is FormDraftRecord<Record<string, string>> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as FormDraftRecord<Record<string, string>>;
  return record.version === draftVersion && isFormDraftState(record.formState);
}

function readCachedItem(storage: DraftStorage, storageKey: string): string | null {
  if (storageCache.has(storageKey)) {
    return storageCache.get(storageKey) ?? null;
  }

  try {
    const rawValue = storage.getItem(storageKey);
    storageCache.set(storageKey, rawValue);
    return rawValue;
  } catch {
    return null;
  }
}

function writeCachedItem(storage: DraftStorage, storageKey: string, value: string): void {
  try {
    storage.setItem(storageKey, value);
    storageCache.set(storageKey, value);
  } catch {
    // Ignore quota and private-mode storage failures.
  }
}

function removeCachedItem(storage: DraftStorage, storageKey: string): void {
  try {
    storage.removeItem(storageKey);
    storageCache.set(storageKey, null);
  } catch {
    // Ignore storage failures.
  }
}

/** Test helper: drop the in-memory mirror without touching Storage. */
export function clearFormDraftStorageCache(): void {
  storageCache.clear();
}

export function readFormDraft<TState extends Record<string, string>>(
  formType: SubmissionFormType,
  personId: string,
  storage: DraftStorage | null = getDraftStorage(),
): TState | null {
  const storageKey = getFormDraftStorageKey(formType, personId);
  if (!storageKey || !storage) {
    return null;
  }

  try {
    const rawValue = readCachedItem(storage, storageKey);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!isFormDraftRecord(parsedValue)) {
      return null;
    }

    return parsedValue.formState as TState;
  } catch {
    return null;
  }
}

export function writeFormDraft<TState extends Record<string, string>>(
  formType: SubmissionFormType,
  personId: string,
  formState: TState,
  storage: DraftStorage | null = getDraftStorage(),
): void {
  const storageKey = getFormDraftStorageKey(formType, personId);
  if (!storageKey || !storage) {
    return;
  }

  const record: FormDraftRecord<TState> = {
    version: draftVersion,
    updatedAt: new Date().toISOString(),
    formState,
  };

  writeCachedItem(storage, storageKey, JSON.stringify(record));
}

export function clearFormDraft(
  formType: SubmissionFormType,
  personId: string,
  storage: DraftStorage | null = getDraftStorage(),
): void {
  const storageKey = getFormDraftStorageKey(formType, personId);
  if (!storageKey || !storage) {
    return;
  }

  removeCachedItem(storage, storageKey);
}
