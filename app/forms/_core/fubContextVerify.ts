import { createHmac, timingSafeEqual } from "crypto";
import type Context from "@/app/Context";

type ContextPayload = Partial<Context> & {
  clientName?: string;
  fubUserId?: number;
  fubUserName?: string;
  fubPersonId?: number;
  accountId?: number;
};

export function decodeBase64Url(encoded: string): string {
  const normalized = encoded.replaceAll("-", "+").replaceAll("_", "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${"=".repeat(padding)}`, "base64").toString("utf8");
}

export function verifyFubContextSignature(context: string, signature: string): boolean {
  const secret = process.env.FUB_SECRET_KEY;
  if (!secret) {
    return true;
  }

  const expected = createHmac("sha256", secret).update(context).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export function parseEmbeddedContextPayload(context: string): ContextPayload {
  return JSON.parse(decodeBase64Url(context)) as ContextPayload;
}

export function getEmbeddedClientName(payload: ContextPayload): string {
  if (payload.clientName) {
    return payload.clientName;
  }

  const nameParts = [payload.person?.firstName, payload.person?.lastName].filter(Boolean);
  return nameParts.join(" ").trim();
}

export function buildSignedFubContext(
  payload: ContextPayload,
  secret: string,
): { context: string; signature: string } {
  const context = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(context).digest("hex");
  return { context, signature };
}
