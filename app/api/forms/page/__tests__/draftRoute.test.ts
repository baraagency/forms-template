import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { buildSettingsAdminSessionCookieHeader } from "@/app/api/_services/settingsAdminAuth";

const saveDraft = mock(async () => ({ ok: true, version: 2 }));

mock.module("@/app/api/_services/formPageQueries", () => ({
  getFormPage: mock(async () => ({ data: null, error: null })),
  saveFormPageDraft: saveDraft,
  publishFormPage: mock(async () => ({ ok: true, version: 2 })),
}));

const { action } = await import("../[form]/draft/route");

const emptyDoc = { content: [], root: { props: {} } };

function authedRequest(body: unknown) {
  const cookie = buildSettingsAdminSessionCookieHeader()?.split(";")[0] ?? "";
  return new Request("http://localhost/api/forms/page/closed/draft", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/forms/page/:form/draft", () => {
  const previousPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "secret";
    saveDraft.mockClear();
  });

  afterEach(() => {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  });

  it("rejects unauthenticated writes", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/page/closed/draft", {
        method: "PUT",
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
    saveDraft.mockResolvedValueOnce({ ok: false, conflict: true });

    const response = await action({
      request: authedRequest({ data: emptyDoc, version: 1 }),
      params: { form: "closed" },
    });

    expect(response.status).toBe(409);
  });

  it("returns the new version", async () => {
    saveDraft.mockResolvedValueOnce({ ok: true, version: 2 });

    const response = await action({
      request: authedRequest({ data: emptyDoc, version: 1 }),
      params: { form: "closed" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: 2 });
  });
});
