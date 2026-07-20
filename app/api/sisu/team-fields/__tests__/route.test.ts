import { afterEach, describe, expect, it } from "bun:test";
import { loader } from "../route";

const originalSisuKey = process.env.SISU_API_KEY;

afterEach(() => {
  if (originalSisuKey === undefined) {
    delete process.env.SISU_API_KEY;
  } else {
    process.env.SISU_API_KEY = originalSisuKey;
  }
});

describe("sisu team-fields route", () => {
  it("returns fixture team fields when SISU_API_KEY is unset", async () => {
    delete process.env.SISU_API_KEY;

    const response = await loader();
    const payload = (await response.json()) as {
      fields?: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(payload.fields?.client_type).toBeDefined();
  });
});
