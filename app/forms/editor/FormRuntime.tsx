import { createContext, useContext, type ReactNode } from "react";
import type { FieldValue } from "./formPageTypes";

export type FormRuntimeValue = {
  values: Record<string, FieldValue>;
  errors: Record<string, string>;
  setValue: (fieldId: string, value: FieldValue) => void;
  disabled?: boolean;
};

const FormRuntimeContext = createContext<FormRuntimeValue | null>(null);

export function FormRuntimeProvider({
  value,
  children,
}: {
  value: FormRuntimeValue;
  children: ReactNode;
}) {
  return (
    <FormRuntimeContext.Provider value={value}>
      {children}
    </FormRuntimeContext.Provider>
  );
}

export function useFormRuntime(): FormRuntimeValue | null {
  return useContext(FormRuntimeContext);
}
