import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { action, loader } from "../branding/route";

describe("/api/forms/settings/branding", () => {
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
      request: new Request("http://localhost/api/forms/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: "", logoAlt: "Bara Agency" }),
      }),
    });

    expect(response.status).toBe(401);
  });

  test("guards the loader with admin auth", async () => {
    process.env.ADMIN_PASSWORD = "secret";

    const response = await loader({
      request: new Request("http://localhost/api/forms/settings/branding"),
    });

    expect(response.status).toBe(401);
  });

  test("rejects invalid JSON", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    });

    expect(response.status).toBe(400);
  });

  test("rejects non-http(s) logo URLs before touching storage", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: "javascript:alert(1)",
          logoAlt: "Acme",
        }),
      }),
    });

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { message: string };
    expect(payload.message).toContain("absolute http(s) URL");
  });

  test("rejects relative logo URLs", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: "/logo.png",
          logoAlt: "Acme",
        }),
      }),
    });

    expect(response.status).toBe(400);
  });

  test("rejects overlong alt text", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: "",
          logoAlt: "x".repeat(201),
        }),
      }),
    });

    expect(response.status).toBe(400);
  });

  test("rejects missing fields", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    });

    expect(response.status).toBe(400);
  });

  test("rejects unsupported methods", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/settings/branding", {
        method: "POST",
      }),
    });

    expect(response.status).toBe(405);
  });
});
