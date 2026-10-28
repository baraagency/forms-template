import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { buildSettingsAdminSessionCookieHeader } from "@/app/api/_services/settingsAdminAuth";

const saveMappings = mock(async () => ({ data: true, error: null }));
const listMappings = mock(async () => ({
  data: { sisu: [], person: [], deal: [] },
  error: null,
}));

mock.module("@/app/api/_services/formMappingQueries", () => ({
  listFormFieldMappings: listMappings,
  saveFormFieldMappings: saveMappings,
  pruneFormFieldMappings: mock(async () => ({ data: 0, error: null })),
}));

const { loader, action } = await import("../[form]/mappings/route");

function authedRequest(body?: unknown) {
  const cookie = buildSettingsAdminSessionCookieHeader()?.split(";")[0] ?? "";
  return new Request("http://localhost/api/forms/page/closed/mappings", {
    method: body === undefined ? "GET" : "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const basePatch = {
  fieldName: "clientType",
  sisuFieldName: "type_id",
  sisuFieldType: "string",
  custom: false,
  fubPersonField: null,
  fubDealField: null,
};

describe("page field mappings API", () => {
  const previousPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "secret";
    saveMappings.mockClear();
  });

  afterEach(() => {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  });

  it("rejects unauthenticated reads and writes", async () => {
    const read = await loader({
      request: new Request("http://localhost/api/forms/page/closed/mappings"),
      params: { form: "closed" },
    });
    const write = await action({
      request: new Request("http://localhost/api/forms/page/closed/mappings", {
        method: "PUT",
      }),
      params: { form: "closed" },
    });

    expect(read.status).toBe(401);
    expect(write.status).toBe(401);
  });

  it("requires a field name", async () => {
    const response = await action({
      request: authedRequest({ ...basePatch, fieldName: "" }),
      params: { form: "closed" },
    });

    expect(response.status).toBe(400);
  });

  it("keeps the Client Type SISU mapping locked", async () => {
    const response = await action({
      request: authedRequest({ ...basePatch, sisuFieldName: "anything" }),
      params: { form: "closed" },
    });

    expect(response.status).toBe(400);
    expect(saveMappings).not.toHaveBeenCalled();
  });

  it("saves a field mapping", async () => {
    const response = await action({
      request: authedRequest(basePatch),
      params: { form: "closed" },
    });

    expect(response.status).toBe(200);
    expect(saveMappings).toHaveBeenCalledWith(
      "closed",
      "clientType",
      expect.objectContaining({ sisuFieldName: "type_id" }),
    );
  });

  it("lists mappings for the editor", async () => {
    const response = await loader({
      request: authedRequest(),
      params: { form: "closed" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      form: "closed",
      sisu: [],
      person: [],
      deal: [],
    });
  });
});
