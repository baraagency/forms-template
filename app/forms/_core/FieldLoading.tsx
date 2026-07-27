import { Spinner } from "@baraagency/components";

type FieldLoadingProps = {
  label?: string;
};

/**
 * Screen-reader text for async field loads (pair with `aria-busy` on the control).
 */
export function FieldLoading({ label = "Loading" }: FieldLoadingProps) {
  return (
    <span className="field-loading inline-flex items-center gap-2 text-xs text-[var(--body-color)]">
      <Spinner className="h-4 w-4" />
      <span className="bara-sr-only">{label}</span>
      <span aria-hidden="true">{label}…</span>
    </span>
  );
}
