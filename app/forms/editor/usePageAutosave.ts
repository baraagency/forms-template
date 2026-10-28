import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";
import { createSaveQueue } from "./createSaveQueue";
import type { FormPageData } from "./formPageTypes";

export type SaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "publishing"
  | "saved"
  | "conflict"
  | "error";

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
  const latestDataRef = useRef(input.initialData);
  const dirtyRef = useRef(false);

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
      const savedJson = JSON.stringify(data);
      lastSavedJsonRef.current = savedJson;
      setErrorMessage(null);
      if (JSON.stringify(latestDataRef.current) === savedJson) {
        dirtyRef.current = false;
        setStatus("saved");
      } else {
        setStatus("saving");
      }
      return payload.version;
    },
    [input.form],
  );

  const queue = useMemo(() => createSaveQueue(saveDraft), [saveDraft]);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const saveNow = useCallback(
    (data: FormPageData): Promise<number> => {
      latestDataRef.current = data;
      dirtyRef.current = true;
      setStatus("saving");
      const next = queue(data);
      pendingRef.current = next;
      void next.catch(() => undefined);
      return next;
    },
    [queue],
  );

  const schedule = useCallback(
    (data: FormPageData) => {
      latestDataRef.current = data;

      if (JSON.stringify(data) === lastSavedJsonRef.current) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        dirtyRef.current = false;
        setStatus("saved");
        return;
      }

      dirtyRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setStatus("dirty");

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void saveNow(data).catch(() => undefined);
      }, SAVE_DELAY_MS);
    },
    [saveNow],
  );

  const flush = useCallback((): Promise<number> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const data = latestDataRef.current;
    if (JSON.stringify(data) === lastSavedJsonRef.current) {
      dirtyRef.current = false;
      setStatus("saved");
      return pendingRef.current;
    }

    return saveNow(data);
  }, [saveNow]);

  const retry = useCallback(() => flush(), [flush]);

  const publish = useCallback(
    async (data: FormPageData) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      await pendingRef.current.catch(() => undefined);
      setStatus("publishing");

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
      latestDataRef.current = data;
      dirtyRef.current = false;
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
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (JSON.stringify(latestDataRef.current) !== lastSavedJsonRef.current) {
        // Client-side navigation unmounts after the route changes; the request
        // still completes. A full page unload is covered by the guard above.
        void queueRef.current(latestDataRef.current).catch(() => undefined);
      }
    };
  }, []);

  return {
    schedule,
    publish,
    retry,
    status,
    errorMessage,
    version: versionRef.current,
  };
}
