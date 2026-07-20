import { describe, expect, test } from "bun:test";
import { loader } from "../sisu-mappings/route";

describe("GET /api/forms/settings/sisu-mappings", () => {
  test("requires form query", async () => {
    const response = await loader({
      request: new Request("http://localhost/api/forms/settings/sisu-mappings"),
      params: {},
    });
    expect(response.status).toBe(400);
  });
});
