import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

export type SelectOption = {
  value: string;
  label: string;
  isDisabled?: boolean;
};

export type SelectChangeEvent = {
  target: {
    value: string;
  };
};

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  hint?: string;
  wrapperClassName?: string;
};

export type TextAreaInputProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  id: string;
  hint?: string;
  wrapperClassName?: string;
};

export type SelectInputProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "children" | "onChange"
> & {
  label?: string;
  id: string;
  hint?: string;
  wrapperClassName?: string;
  value: string;
  onChange?: (event: SelectChangeEvent) => void;
  onSearchInputChange?: (value: string) => void;
  children: ReactNode;
};
