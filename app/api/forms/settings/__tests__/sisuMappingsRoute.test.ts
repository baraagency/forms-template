import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { loader } from "../sisu-mappings/route";

describe("GET /api/forms/settings/sisu-mappings", () => {
  const previousPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    delete process.env.ADMIN_PASSWORD;
  });

  afterEach(() => {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  });

  test("requires form query", async () => {
    const response = await loader({
      request: new Request("http://localhost/api/forms/settings/sisu-mappings"),
      params: {},
    });
    expect(response.status).toBe(400);
  });
});
