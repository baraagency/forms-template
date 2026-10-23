import { google } from "googleapis";
import type { GmailAccountCredential } from "@/app/types/storage";
import {
  getGmailOAuthClient,
  isGmailOAuthConfigured,
} from "./gmailOAuthService";

export type SendSummaryEmailInput = {
  credential: GmailAccountCredential;
  to: string[];
  subject: string;
  bodyText: string;
  /** Optional themed HTML part; falls back to plain text when omitted. */
  bodyHtml?: string;
};

export type SendSummaryEmailResult =
  | { sent: true; messageId: string }
  | { sent: false; reason: string; message: string };

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function buildSummaryRawMessage(params: {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
}): string {
  const headers = [
    `From: ${sanitizeHeader(params.from)}`,
    `To: ${params.to.map(sanitizeHeader).join(", ")}`,
    `Subject: ${sanitizeHeader(params.subject)}`,
    "MIME-Version: 1.0",
  ];

  if (!params.html) {
    return toBase64Url(
      [
        ...headers,
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        params.text,
      ].join("\r\n"),
    );
  }

  const boundary = `----forms-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;

  return toBase64Url(
    [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      params.text,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      params.html,
      `--${boundary}--`,
      "",
    ].join("\r\n"),
  );
}

/**
 * Send a summary email using the stored Gmail OAuth credential. When HTML is
 * provided, sends multipart/alternative with the plain-text fallback.
 */
export async function sendSummaryEmail(
  input: SendSummaryEmailInput,
): Promise<SendSummaryEmailResult> {
  if (!isGmailOAuthConfigured()) {
    return {
      sent: false,
      reason: "gmail_not_configured",
      message: "Google OAuth is not configured for this environment.",
    };
  }

  if (!input.credential.active || !input.credential.refresh_token) {
    return {
      sent: false,
      reason: "gmail_not_connected",
      message: "Gmail is not connected for this environment.",
    };
  }

  const recipients = input.to
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (recipients.length === 0) {
    return {
      sent: false,
      reason: "no_recipients",
      message: "No email recipients are configured for this form.",
    };
  }

  const client = getGmailOAuthClient();
  if (!client) {
    return {
      sent: false,
      reason: "gmail_not_configured",
      message: "Google OAuth is not configured for this environment.",
    };
  }

  client.setCredentials({
    refresh_token: input.credential.refresh_token,
    access_token: input.credential.access_token ?? undefined,
    expiry_date: input.credential.expiry_date
      ? new Date(input.credential.expiry_date).getTime()
      : undefined,
  });

  try {
    const gmail = google.gmail({ version: "v1", auth: client });
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: buildSummaryRawMessage({
          from: input.credential.email,
          to: recipients,
          subject: input.subject,
          text: input.bodyText,
          html: input.bodyHtml,
        }),
      },
    });

    const messageId = response.data.id?.trim();
    if (!messageId) {
      return {
        sent: false,
        reason: "send_failed",
        message: "Gmail API did not return a message id.",
      };
    }

    return { sent: true, messageId };
  } catch (error) {
    return {
      sent: false,
      reason: "send_failed",
      message:
        error instanceof Error
          ? error.message
          : "Failed to send summary email via Gmail.",
    };
  }
}
