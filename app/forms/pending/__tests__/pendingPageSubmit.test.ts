import { describe, expect, it } from "bun:test";
import { PENDING_PAGE_DOCUMENT } from "../pendingPageDocument";
import { buildPendingSubmission } from "../pendingPageSubmit";

const base = {
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
  office: "Charleston",
  leadTransaction: "yes",
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
  commissionDelivery: "Wire",
};

describe("buildPendingSubmission", () => {
  it("keeps legacy hidden fields for mappings", () => {
    const result = buildPendingSubmission(PENDING_PAGE_DOCUMENT, base);

    expect(result.errors).toEqual({});
    expect(result.formState.office).toBe("Charleston");
    expect(result.formState.commissionDelivery).toBe("Wire");
    expect(result.formState.closingAttorney).toBe("1001");
  });

  it("keeps editor-added fields in formState", () => {
    const document = {
      ...PENDING_PAGE_DOCUMENT,
      content: [
        ...PENDING_PAGE_DOCUMENT.content,
        {
          type: "FieldBlock" as const,
          props: {
            id: "gateCode",
            label: "Gate Code",
            kind: "text" as const,
            required: false,
          },
        },
      ],
    };

    const result = buildPendingSubmission(document, {
      ...base,
      gateCode: "4321",
    });

    expect(result.errors).toEqual({});
    expect(result.formState.gateCode).toBe("4321");
  });

  it("accepts legacy lowercase client types", () => {
    const result = buildPendingSubmission(PENDING_PAGE_DOCUMENT, {
      ...base,
      clientType: "buyer",
    });

    expect(result.errors).toEqual({});
    expect(result.formState.clientType).toBe("buyer");
  });

  it("requires secondary fields only when yes", () => {
    const result = buildPendingSubmission(PENDING_PAGE_DOCUMENT, {
      ...base,
      hasSecondaryClient: "yes",
      secondaryContact: "",
      secondaryContactPhone: "",
      secondaryContactEmail: "",
    });

    expect(result.errors.secondaryContact).toBeTruthy();
    expect(result.errors.secondaryContactPhone).toBeTruthy();
    expect(result.errors.secondaryContactEmail).toBeTruthy();
  });

  it("requires seller fields only for sellers", () => {
    const buyer = buildPendingSubmission(PENDING_PAGE_DOCUMENT, base);
    const seller = buildPendingSubmission(PENDING_PAGE_DOCUMENT, {
      ...base,
      clientType: "Seller",
      dueDiligencePeriod: "yes",
      dueDiligenceDeadline: "",
      contingencies: "yes",
      contingencyDetails: "",
    });

    expect(buyer.errors).toEqual({});
    expect(seller.errors.dueDiligenceDeadline).toBeTruthy();
    expect(seller.errors.contingencyDetails).toBeTruthy();
  });
});
