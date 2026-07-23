import { afterEach, describe, expect, it } from "bun:test";
import { applyPreviousSubmissionFormData } from "../previousSubmissionPrefill";
import {
  clearFormDraft,
  clearFormDraftStorageCache,
  getFormDraftStorageKey,
  readFormDraft,
  writeFormDraft,
} from "../formDraftCache";

const storage = new Map<string, string>();

const localStorageMock = {
  getItem(key: string) {
    return storage.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    storage.set(key, value);
  },
  removeItem(key: string) {
    storage.delete(key);
  },
};

type SampleFormState = {
  personId: string;
  agentId: string;
  dealId: string;
  clientFirstName: string;
  notes: string;
};

const baseState: SampleFormState = {
  personId: "123",
  agentId: "1",
  dealId: "456",
  clientFirstName: "",
  notes: "",
};

afterEach(() => {
  storage.clear();
  clearFormDraftStorageCache();
});

describe("getFormDraftStorageKey", () => {
  it("returns a stable key scoped to form type and person id", () => {
    expect(getFormDraftStorageKey("pending", "123")).toBe(
      "forms-template:pending:draft:v1:123",
    );
    expect(getFormDraftStorageKey("appointment-set", "123")).toBe(
      "forms-template:appointment-set:draft:v1:123",
    );
  });

  it("returns an empty string when person id is missing", () => {
    expect(getFormDraftStorageKey("closed", "")).toBe("");
    expect(getFormDraftStorageKey("closed", "   ")).toBe("");
  });
});

describe("formDraftCache", () => {
  it("round-trips draft state through localStorage", () => {
    const draftState: SampleFormState = {
      ...baseState,
      clientFirstName: "Ada",
      notes: "Follow up tomorrow",
    };

    writeFormDraft("pending", "123", draftState, localStorageMock);
    expect(readFormDraft<SampleFormState>("pending", "123", localStorageMock)).toEqual(
      draftState,
    );
  });

  it("keeps drafts isolated per form type", () => {
    writeFormDraft(
      "pending",
      "123",
      { ...baseState, notes: "pending notes" },
      localStorageMock,
    );
    writeFormDraft(
      "closed",
      "123",
      { ...baseState, notes: "closed notes" },
      localStorageMock,
    );

    expect(readFormDraft<SampleFormState>("pending", "123", localStorageMock)?.notes).toBe(
      "pending notes",
    );
    expect(readFormDraft<SampleFormState>("closed", "123", localStorageMock)?.notes).toBe(
      "closed notes",
    );
  });

  it("returns null for missing person id, corrupt json, or unsupported version", () => {
    expect(readFormDraft("pending", "", localStorageMock)).toBeNull();
    expect(readFormDraft("pending", "123", localStorageMock)).toBeNull();

    storage.set(
      getFormDraftStorageKey("pending", "123"),
      JSON.stringify({ version: 2, formState: baseState }),
    );
    clearFormDraftStorageCache();
    expect(readFormDraft("pending", "123", localStorageMock)).toBeNull();

    storage.set(getFormDraftStorageKey("pending", "123"), "{not-json");
    clearFormDraftStorageCache();
    expect(readFormDraft("pending", "123", localStorageMock)).toBeNull();
  });

  it("clears a stored draft", () => {
    writeFormDraft(
      "appointment-met",
      "123",
      { ...baseState, clientFirstName: "Ada" },
      localStorageMock,
    );
    clearFormDraft("appointment-met", "123", localStorageMock);
    expect(readFormDraft("appointment-met", "123", localStorageMock)).toBeNull();
  });

  it("does not overwrite higher-priority values when restoring cached answers", () => {
    const urlState: SampleFormState = {
      ...baseState,
      agentId: "99",
    };

    const cachedDraft: SampleFormState = {
      ...baseState,
      agentId: "1",
      clientFirstName: "Ada",
      notes: "Cached note",
    };

    writeFormDraft("appointment-set", "123", cachedDraft, localStorageMock);

    const merged = applyPreviousSubmissionFormData(
      urlState,
      readFormDraft("appointment-set", "123", localStorageMock) ?? undefined,
    );

    expect(merged.agentId).toBe("99");
    expect(merged.clientFirstName).toBe("Ada");
    expect(merged.notes).toBe("Cached note");
  });
});
