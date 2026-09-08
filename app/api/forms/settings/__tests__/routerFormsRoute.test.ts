import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { action } from "../router-forms/[slug]/route";

describe("PATCH /api/forms/settings/router-forms/[slug]", () => {
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

  test("rejects unknown slug", async () => {
    const response = await action({
      request: new Request(
        "http://localhost/api/forms/settings/router-forms/nope",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visible: false }),
        },
      ),
      params: { slug: "nope" },
    });

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { message: string };
    expect(payload.message).toContain("Unknown form slug");
  });

  test("rejects missing visible boolean", async () => {
    const response = await action({
      request: new Request(
        "http://localhost/api/forms/settings/router-forms/pending",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      ),
      params: { slug: "pending" },
    });

    expect(response.status).toBe(400);
  });
});
