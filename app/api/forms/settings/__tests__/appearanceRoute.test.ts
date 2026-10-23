import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { action, loader } from "../appearance/route";

describe("/api/forms/settings/appearance", () => {
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

  test("requires admin auth when a password is configured", async () => {
    process.env.ADMIN_PASSWORD = "secret";

    const response = await action({
      request: new Request("http://localhost/api/forms/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor: "#003a55",
          secondaryColor: "#1e1e1e",
        }),
      }),
    });

    expect(response.status).toBe(401);
  });

  test("guards the loader with admin auth", async () => {
    process.env.ADMIN_PASSWORD = "secret";

    const response = await loader({
      request: new Request("http://localhost/api/forms/settings/appearance"),
    });

    expect(response.status).toBe(401);
  });

  test("rejects invalid JSON", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    });

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { message: string };
    expect(payload.message).toContain("Invalid JSON");
  });

  test("rejects non-hex colors before touching storage", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor: "navy",
          secondaryColor: "#1e1e1e",
        }),
      }),
    });

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { message: string };
    expect(payload.message).toContain("hex values");
  });

  test("rejects unsupported methods", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/settings/appearance", {
        method: "POST",
      }),
    });

    expect(response.status).toBe(405);
  });
});
