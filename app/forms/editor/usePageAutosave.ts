import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";
import { createSaveQueue } from "./createSaveQueue";
import type { FormPageData } from "./formPageTypes";

type SaveStatus = "idle" | "saving" | "saved" | "conflict" | "error";

const SAVE_DELAY_MS = 1_000;

export function usePageAutosave(input: {
  form: SettingsFormKind;
  initialVersion: number;
  initialData: FormPageData;
}) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const versionRef = useRef(input.initialVersion);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Promise<number>>(Promise.resolve(input.initialVersion));
  const lastSavedJsonRef = useRef(JSON.stringify(input.initialData));

  const saveDraft = useCallback(
    async (data: FormPageData): Promise<number> => {
      const response = await fetch(`/api/forms/page/${input.form}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, version: versionRef.current }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        version?: number;
        message?: string;
      };

      if (response.status === 409) {
        setStatus("conflict");
        throw new Error("conflict");
      }
      if (!response.ok || typeof payload.version !== "number") {
        setStatus("error");
        setErrorMessage(payload.message ?? "Failed to save the page draft.");
        throw new Error(payload.message ?? "Failed to save the page draft.");
      }

      versionRef.current = payload.version;
      lastSavedJsonRef.current = JSON.stringify(data);
      setErrorMessage(null);
      setStatus("saved");
      return payload.version;
    },
    [input.form],
  );

  const queue = useMemo(() => createSaveQueue(saveDraft), [saveDraft]);

  const schedule = useCallback(
    (data: FormPageData) => {
      if (JSON.stringify(data) === lastSavedJsonRef.current) {
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setStatus("saving");

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        pendingRef.current = queue(data);
        void pendingRef.current.catch(() => undefined);
      }, SAVE_DELAY_MS);
    },
    [queue],
  );

  const publish = useCallback(
    async (data: FormPageData) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      await pendingRef.current.catch(() => undefined);
      setStatus("saving");

      const response = await fetch(`/api/forms/page/${input.form}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, version: versionRef.current }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        version?: number;
        warnings?: string[];
        message?: string;
      };

      if (response.status === 409) {
        setStatus("conflict");
        throw new Error("conflict");
      }
      if (!response.ok || typeof payload.version !== "number") {
        setStatus("error");
        setErrorMessage(payload.message ?? "Failed to publish the page.");
        throw new Error(payload.message ?? "Failed to publish the page.");
      }

      versionRef.current = payload.version;
      lastSavedJsonRef.current = JSON.stringify(data);
      setErrorMessage(null);
      setStatus("saved");
      return {
        version: payload.version,
        warnings: payload.warnings ?? [],
      };
    },
    [input.form],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { schedule, publish, status, errorMessage, version: versionRef.current };
}
