import { describe, expect, it } from "bun:test";
import { action } from "../route";

const validPendingPayload = {
  personId: "123",
  agentId: "1",
  clientFirstName: "Jane",
  clientLastName: "Client",
  clientPhone: "(843) 555-1234",
  clientEmail: "jane.client@example.com",
  clientType: "buyer",
  transactionAmount: "$425,000.00",
  addressLine1: "123 Main St",
  city: "Charleston",
  state: "SC",
  postal: "29401",
  jcreOffice: "Charleston",
  jcreLeadTransaction: "yes",
  hasSecondaryClient: "no",
  onTeam: "no",
  isaSet: "no",
  pastClient: "no",
  underContractDate: "2026-06-01",
  forecastedClosedDate: "2026-07-15",
  outsideReferral: "No",
  otherAgentName: "Other Agent",
  otherAgentEmail: "other@example.com",
  closingAttorney: "1001",
  mortgageCompany: "2001",
  financingType: "Conventional",
  multipleTransactions: "no",
  goodFundContribution: "yes",
  commissionDelivery: "Wire",
  grossCommissionTotal: "$13,500.00",
};

describe("pending submit route", () => {
  it("returns validation errors for an empty payload", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/pending/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      params: {},
    });
    const payload = (await response.json()) as { message?: string };

    expect(response.status).toBe(400);
    expect(payload.message).toBe("Pending submission has validation errors.");
  });

  it("runs the hybrid workflow for a valid payload (skips live APIs without keys)", async () => {
    const response = await action({
      request: new Request("http://localhost/api/forms/pending/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPendingPayload),
      }),
      params: {},
    });
    const payload = (await response.json()) as {
      formType?: string;
      dealId?: number;
      transaction?: { transaction_id?: number };
      email?: { sent?: boolean; reason?: string };
      steps?: Array<{ step: string; status: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.formType).toBe("pending");
    expect(payload.dealId).toBeUndefined();
    expect(payload.transaction).toBeUndefined();
    expect(payload.email?.sent).toBe(false);
    expect(payload.email?.reason).toBeTruthy();
    expect(Array.isArray(payload.steps)).toBe(true);
    expect(payload.steps!.some((step) => step.step === "persist")).toBe(true);
  });
});
