import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { buildSettingsAdminSessionCookieHeader } from "@/app/api/_services/settingsAdminAuth";
import { loader } from "../forms.$slug.edit";

describe("GET /forms/:slug/edit", () => {
  const previousPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "secret";
  });

  afterEach(() => {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  });

  it("returns 404 when ADMIN_PASSWORD is unset", async () => {
    delete process.env.ADMIN_PASSWORD;

    try {
      await loader({
        request: new Request("http://localhost/forms/closed/edit"),
        params: { slug: "closed" },
      } as never);
      throw new Error("expected loader to throw");
    } catch (error) {
      expect((error as Response).status).toBe(404);
    }
  });

  it("returns 404 for an unsupported form", async () => {
    const cookie = buildSettingsAdminSessionCookieHeader()?.split(";")[0] ?? "";

    try {
      await loader({
        request: new Request("http://localhost/forms/pending/edit", {
          headers: { Cookie: cookie },
        }),
        params: { slug: "pending" },
      } as never);
      throw new Error("expected loader to throw");
    } catch (error) {
      expect((error as Response).status).toBe(404);
    }
  });

  it("returns the draft for an authenticated admin", async () => {
    const cookie = buildSettingsAdminSessionCookieHeader()?.split(";")[0] ?? "";
    const result = await loader({
      request: new Request("http://localhost/forms/closed/edit", {
        headers: { Cookie: cookie },
      }),
      params: { slug: "closed" },
    } as never);

    expect(result.form).toBe("closed");
    expect(typeof result.version).toBe("number");
  });
});
