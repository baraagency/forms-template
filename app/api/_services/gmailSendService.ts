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

function buildPlainTextRawMessage(params: {
  from: string;
  to: string[];
  subject: string;
  text: string;
}): string {
  const lines = [
    `From: ${params.from}`,
    `To: ${params.to.join(", ")}`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    params.text,
  ];
  return toBase64Url(lines.join("\r\n"));
}

/**
 * Send a plain-text summary email using the stored Gmail OAuth credential.
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
        raw: buildPlainTextRawMessage({
          from: input.credential.email,
          to: recipients,
          subject: input.subject,
          text: input.bodyText,
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
