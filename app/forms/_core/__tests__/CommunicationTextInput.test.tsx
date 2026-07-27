import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CommunicationTextInput } from "../CommunicationTextInput";

describe("CommunicationTextInput", () => {
  test("renders a phone icon for tel inputs", () => {
    const html = renderToStaticMarkup(
      <CommunicationTextInput
        id="clientPhone"
        label="Client Phone Number"
        type="tel"
        value="(843) 555-0100"
        readOnly
      />,
    );

    expect(html).toContain('id="clientPhone"');
    expect(html).toContain('type="tel"');
    expect(html).toContain("communication-input__icon");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("M22 16.92");
    expect(html).toContain("Client Phone Number");
  });

  test("renders a mail icon for email inputs", () => {
    const html = renderToStaticMarkup(
      <CommunicationTextInput
        id="clientEmail"
        label="Client Email"
        type="email"
        value="jane@example.com"
        readOnly
      />,
    );

    expect(html).toContain('type="email"');
    expect(html).toContain("M4 4h16");
    expect(html).toContain("communication-input__control");
  });

  test("honors an explicit communicationKind override", () => {
    const html = renderToStaticMarkup(
      <CommunicationTextInput
        id="contact"
        label="Contact"
        communicationKind="phone"
        value=""
        readOnly
      />,
    );

    expect(html).toContain("M22 16.92");
  });

  test("exposes error state for screen readers", () => {
    const html = renderToStaticMarkup(
      <CommunicationTextInput
        id="clientEmail"
        label="Client Email"
        type="email"
        value=""
        error="Invalid email"
      />,
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="clientEmail-error"');
    expect(html).toContain('id="clientEmail-error"');
    expect(html).toContain("Invalid email");
    expect(html).toContain("bara-input--error");
  });
});
