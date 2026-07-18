import { describe, expect, it } from "bun:test";
import { POST } from "../route";
import { getInitialClosedFormState } from "@/app/forms/closed/closedFormUtils";

function buildValidPayload() {
  return {
    ...getInitialClosedFormState({
      personId: "123",
      agentId: "1",
      dealId: "456",
      sisuTransactionId: "789",
    }),
    transactionType: "none",
    addressLine1: "123 Main St",
    city: "Charleston",
    state: "SC",
    postal: "29401",
    transactionAmount: "$425,000.00",
    totalCommissionGci: "$12,750.00",
    settlementDate: "2026-06-15",
    tcMarketingNotes: "Closed successfully.",
  };
}

describe("POST /api/forms/closed/submit", () => {
  it("rejects invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/closed/submit", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects incomplete payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/closed/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: "123" }),
      }),
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { errors?: Record<string, string> };
    expect(payload.errors).toBeTruthy();
  });

  it("returns mock success for a valid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/closed/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildValidPayload()),
      }),
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      formType?: string;
      dealId?: number;
    };
    expect(payload.formType).toBe("closed");
    expect(payload.dealId).toBe(456);
  });

  it("requires lease/rental fields when transaction type is lease", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/closed/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildValidPayload(),
          transactionType: "lease",
          securityDeposit: "",
          monthlyRent: "",
        }),
      }),
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { errors?: Record<string, string> };
    expect(payload.errors?.securityDeposit).toBeTruthy();
    expect(payload.errors?.monthlyRent).toBeTruthy();
  });
});
