import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FieldError } from "../FieldError";
import { fieldA11yProps, fieldSelectA11yProps } from "../useFieldIds";

describe("FieldError", () => {
  test("renders alert with id", () => {
    const html = renderToStaticMarkup(
      <FieldError id="firstName-error" message="Required" />,
    );
    expect(html).toContain('id="firstName-error"');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('aria-live="polite"');
    expect(html).toContain("Required");
  });

  test("renders nothing when message is empty", () => {
    const html = renderToStaticMarkup(
      <FieldError id="firstName-error" message={undefined} />,
    );
    expect(html).toBe("");
  });
});

describe("fieldA11yProps", () => {
  test("returns aria linkage when error is present", () => {
    expect(fieldA11yProps("clientEmail", "Invalid email")).toEqual({
      "aria-invalid": true,
      "aria-describedby": "clientEmail-error",
    });
  });

  test("returns empty object when no error", () => {
    expect(fieldA11yProps("clientEmail")).toEqual({});
  });
});

describe("fieldSelectA11yProps", () => {
  test("returns aria-errormessage linkage when error is present", () => {
    expect(fieldSelectA11yProps("appointmentLocation", "Required")).toEqual({
      "aria-invalid": true,
      "aria-errormessage": "appointmentLocation-error",
    });
  });

  test("returns empty object when no error", () => {
    expect(fieldSelectA11yProps("appointmentLocation")).toEqual({});
  });
});
