import { createContext, useContext, type ReactNode } from "react";
import type { SettingsFormKind } from "@/app/forms/_core/formIdentity";

const PageEditorFormContext = createContext<SettingsFormKind | null>(null);

export function PageEditorFormProvider({
  form,
  children,
}: {
  form: SettingsFormKind;
  children: ReactNode;
}) {
  return (
    <PageEditorFormContext.Provider value={form}>
      {children}
    </PageEditorFormContext.Provider>
  );
}

export function usePageEditorForm(): SettingsFormKind {
  const form = useContext(PageEditorFormContext);
  if (!form) {
    throw new Error("PageEditorFormProvider is missing.");
  }
  return form;
}
