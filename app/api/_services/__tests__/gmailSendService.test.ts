import { describe, expect, test } from "bun:test";
import { buildSummaryRawMessage } from "../gmailSendService";

function decodeRawMessage(raw: string): string {
  return Buffer.from(raw, "base64url").toString("utf8");
}

describe("buildSummaryRawMessage", () => {
  test("builds multipart/alternative when HTML is provided", () => {
    const raw = buildSummaryRawMessage({
      from: "sender@example.com",
      to: ["first@example.com", "second@example.com"],
      subject: "Appointment Set Form Summary",
      text: "Plain summary",
      html: "<p>HTML summary</p>",
    });
    const decoded = decodeRawMessage(raw);

    expect(decoded).toContain("Content-Type: multipart/alternative");
    expect(decoded).toContain('Content-Type: text/plain; charset="UTF-8"');
    expect(decoded).toContain('Content-Type: text/html; charset="UTF-8"');
    expect(decoded).toContain("Plain summary");
    expect(decoded).toContain("<p>HTML summary</p>");
    expect(decoded).toContain("Subject: Appointment Set Form Summary");
  });

  test("builds a plain-text message when HTML is omitted", () => {
    const raw = buildSummaryRawMessage({
      from: "sender@example.com",
      to: ["first@example.com"],
      subject: "Plain only",
      text: "Plain summary",
    });
    const decoded = decodeRawMessage(raw);

    expect(decoded).toContain('Content-Type: text/plain; charset="UTF-8"');
    expect(decoded).not.toContain("multipart/alternative");
    expect(decoded).toContain("Plain summary");
  });

  test("strips newlines from header values", () => {
    const raw = buildSummaryRawMessage({
      from: "sender@example.com",
      to: ["first@example.com"],
      subject: "Summary\r\nBcc: injected@example.com",
      text: "Body",
    });
    const decoded = decodeRawMessage(raw);

    expect(decoded).not.toContain("\r\nBcc:");
    expect(decoded).toContain("Subject: Summary Bcc: injected@example.com");
  });
});
