import { describe, expect, test } from "bun:test";
import { GET } from "../sisu-mappings/route";

describe("GET /api/forms/settings/sisu-mappings", () => {
  test("requires form query", async () => {
    const response = await GET(
      new Request("http://localhost/api/forms/settings/sisu-mappings"),
    );
    expect(response.status).toBe(400);
  });
});
