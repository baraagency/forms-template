import { afterEach, describe, expect, it } from "bun:test";
import {
  buildSettingsAdminSessionCookieHeader,
  buildSettingsAdminSessionToken,
  enforceSettingsAdminAuth,
  isSettingsAdminAuthenticated,
  verifyAdminPassword,
} from "@/app/api/_services/settingsAdminAuth";

describe("settingsAdminAuth", () => {
  const previousPassword = process.env.ADMIN_PASSWORD;

  afterEach(() => {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  });

  it("allows access when ADMIN_PASSWORD is unset", () => {
    delete process.env.ADMIN_PASSWORD;

    const request = new Request("http://localhost/forms/settings");
    expect(isSettingsAdminAuthenticated(request)).toBe(true);
    expect(enforceSettingsAdminAuth(request)).toBeNull();
  });

  it("issues and verifies a signed session cookie", () => {
    process.env.ADMIN_PASSWORD = "test-admin-password";

    const token = buildSettingsAdminSessionToken();
    expect(token).toBeTruthy();

    const cookieHeader = buildSettingsAdminSessionCookieHeader();
    expect(cookieHeader).toContain("settings_admin_auth=");

    const request = new Request("http://localhost/forms/settings", {
      headers: { Cookie: cookieHeader?.split(";")[0] ?? "" },
    });

    expect(verifyAdminPassword("test-admin-password")).toBe(true);
    expect(verifyAdminPassword("wrong-password")).toBe(false);
    expect(isSettingsAdminAuthenticated(request)).toBe(true);
    expect(enforceSettingsAdminAuth(request)).toBeNull();
  });

  it("rejects unauthenticated settings API requests when protected", () => {
    process.env.ADMIN_PASSWORD = "test-admin-password";

    const response = enforceSettingsAdminAuth(
      new Request("http://localhost/api/forms/settings/gmail"),
    );

    expect(response?.status).toBe(401);
  });
});
