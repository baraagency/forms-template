import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PrimaryButton } from "../PrimaryButton";

describe("PrimaryButton", () => {
  test("renders a button with label wrapper for hover arrow", () => {
    const html = renderToStaticMarkup(
      <PrimaryButton type="submit">Submit</PrimaryButton>,
    );

    expect(html).toContain('type="submit"');
    expect(html).toContain("bara-button--primary");
    expect(html).toContain("form-router-launch-button");
    expect(html).toContain("form-router-launch-button__title");
    expect(html).toContain("Submit");
  });

  test("renders as a link when href is set", () => {
    const html = renderToStaticMarkup(
      <PrimaryButton href="/forms">Back</PrimaryButton>,
    );

    expect(html).toContain('href="/forms"');
    expect(html).toContain("form-router-launch-button__title");
    expect(html).toContain("Back");
  });

  test("can disable the hover-arrow label wrapper", () => {
    const html = renderToStaticMarkup(
      <PrimaryButton withHoverArrow={false}>Plain</PrimaryButton>,
    );

    expect(html).not.toContain("form-router-launch-button__title");
    expect(html).toContain("Plain");
  });
});
