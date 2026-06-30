import { describe, expect, it } from "bun:test";
import { POST } from "../route";

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

describe("pending submit route (mock)", () => {
  it("returns validation errors for an empty payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/pending/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    const payload = (await response.json()) as { message?: string };

    expect(response.status).toBe(400);
    expect(payload.message).toBe("Pending submission has validation errors.");
  });

  it("returns mock success for a valid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/forms/pending/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPendingPayload),
      }),
    );
    const payload = (await response.json()) as {
      formType?: string;
      dealId?: number;
      transaction?: { transaction_id?: number };
      email?: { sent?: boolean };
    };

    expect(response.status).toBe(200);
    expect(payload.formType).toBe("pending");
    expect(payload.dealId).toBe(456);
    expect(payload.transaction?.transaction_id).toBe(789);
    expect(payload.email?.sent).toBe(false);
  });
});
