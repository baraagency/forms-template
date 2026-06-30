import { describe, expect, it } from "bun:test";
import {
  buildSignedFubContext,
  decodeBase64Url,
  verifyFubContextSignature,
} from "@/app/forms/_core/fubContextVerify";

describe("fubContextVerify", () => {
  it("verifies signed embedded context payloads", () => {
    const previousSecret = process.env.FUB_SECRET_KEY;
    process.env.FUB_SECRET_KEY = "test-secret";

    const payload = {
      clientName: "Jane Client",
      fubPersonId: 123,
      person: { id: 123, firstName: "Jane", lastName: "Client" },
    };
    const { context, signature } = buildSignedFubContext(payload, "test-secret");

    expect(verifyFubContextSignature(context, signature)).toBe(true);
    expect(JSON.parse(decodeBase64Url(context))).toEqual(payload);

    process.env.FUB_SECRET_KEY = previousSecret;
  });
});
