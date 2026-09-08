import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { loader } from "../route";

const originalSisuKey = process.env.SISU_API_KEY;

describe("sisu team-fields route", () => {
  beforeEach(() => {
    delete process.env.SISU_API_KEY;
  });

  afterEach(() => {
    if (originalSisuKey === undefined) {
      delete process.env.SISU_API_KEY;
    } else {
      process.env.SISU_API_KEY = originalSisuKey;
    }
  });

  it("returns fixture team fields when SISU_API_KEY is unset", async () => {
    const response = await loader();
    const payload = (await response.json()) as {
      fields?: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(payload.fields?.client_type).toBeDefined();
  });
});
