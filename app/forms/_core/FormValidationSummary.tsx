type FormValidationSummaryProps = {
  errors: Record<string, string | undefined>;
  show: boolean;
};

/**
 * Form-level validation announcement after a failed submit attempt.
 */
export function FormValidationSummary({
  errors,
  show,
}: FormValidationSummaryProps) {
  const count = Object.values(errors).filter(Boolean).length;
  if (!show || count === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="form-validation-summary mb-4 rounded-md border px-4 py-3 text-sm font-medium"
      style={{
        borderColor: "color-mix(in srgb, var(--error-color) 30%, #ffffff)",
        background: "color-mix(in srgb, var(--error-color) 8%, #ffffff)",
        color: "var(--error-color)",
      }}
    >
      Please fix {count} {count === 1 ? "error" : "errors"} before submitting.
    </div>
  );
}
