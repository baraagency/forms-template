import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { buildSettingsAdminSessionCookieHeader } from "@/app/api/_services/settingsAdminAuth";

const publishPage = mock(async () => ({ ok: true, version: 2 }));

mock.module("@/app/api/_services/formPageQueries", () => ({
  getFormPage: mock(async () => ({ data: null, error: null })),
  saveFormPageDraft: mock(async () => ({ ok: true, version: 2 })),
  publishFormPage: publishPage,
}));

const { action } = await import("../[form]/publish/route");

const emptyDoc = { content: [], root: { props: {} } };

function authedRequest(body: unknown) {
  const cookie = buildSettingsAdminSessionCookieHeader()?.split(";")[0] ?? "";
  return new Request("http://localhost/api/forms/page/closed/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

describe("POST /api/forms/page/:form/publish", () => {
  const previousPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "secret";
    publishPage.mockClear();
  });

  afterEach(() => {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  });

  it("rejects unauthenticated publishes", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/page/closed/publish", {
        method: "POST",
      }),
      params: { form: "closed" },
    });

    expect(response.status).toBe(401);
  });

  it("rejects invalid documents", async () => {
    const response = await action({
      request: authedRequest({ data: { content: "nope" }, version: 1 }),
      params: { form: "closed" },
    });

    expect(response.status).toBe(400);
  });

  it("returns 409 on a stale version", async () => {
    publishPage.mockResolvedValueOnce({ ok: false, conflict: true });

    const response = await action({
      request: authedRequest({ data: emptyDoc, version: 1 }),
      params: { form: "closed" },
    });

    expect(response.status).toBe(409);
  });

  it("returns the new version", async () => {
    publishPage.mockResolvedValueOnce({ ok: true, version: 2 });

    const response = await action({
      request: authedRequest({ data: emptyDoc, version: 1 }),
      params: { form: "closed" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: 2, warnings: [] });
  });
});
