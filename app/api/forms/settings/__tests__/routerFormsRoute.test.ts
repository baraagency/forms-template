import { describe, expect, test } from "bun:test";
import { PATCH } from "../router-forms/[slug]/route";

describe("PATCH /api/forms/settings/router-forms/[slug]", () => {
  test("rejects unknown slug", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/forms/settings/router-forms/nope", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: false }),
      }),
      { params: Promise.resolve({ slug: "nope" }) },
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { message: string };
    expect(payload.message).toContain("Unknown form slug");
  });

  test("rejects missing visible boolean", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/forms/settings/router-forms/pending", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ slug: "pending" }) },
    );

    expect(response.status).toBe(400);
  });
});
