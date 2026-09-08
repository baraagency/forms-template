import { afterEach, describe, expect, it } from "bun:test";
import { action } from "../auth/route";
import { buildSettingsAdminSessionCookieHeader } from "@/app/api/_services/settingsAdminAuth";

describe("POST /api/forms/settings/auth", () => {
  const previousPassword = process.env.ADMIN_PASSWORD;

  afterEach(() => {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  });

  it("rejects invalid passwords when ADMIN_PASSWORD is configured", async () => {
    process.env.ADMIN_PASSWORD = "secret";

    const response = await action({
      request: new Request("http://localhost/api/forms/settings/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "wrong" }),
      }),
    });

    expect(response.status).toBe(401);
  });

  it("sets an auth cookie for valid passwords", async () => {
    process.env.ADMIN_PASSWORD = "secret";

    const response = await action({
      request: new Request("http://localhost/api/forms/settings/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "secret" }),
      }),
    });

    expect(response.status).toBe(200);
    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toContain("settings_admin_auth=");
    expect(setCookie).toContain(buildSettingsAdminSessionCookieHeader()?.split(";")[0]);
  });
});
