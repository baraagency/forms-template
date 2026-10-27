import { describe, expect, it } from "bun:test";
import { collectPageFields } from "@/app/forms/editor/formPageData";
import { PENDING_PAGE_DOCUMENT } from "../pendingPageDocument";
import { buildInitialPendingValues } from "../pendingPageValues";

const visibleFieldIds = [
  "clientFirstName",
  "clientLastName",
  "clientPhone",
  "clientEmail",
  "hasSecondaryClient",
  "secondaryContact",
  "secondaryContactPhone",
  "secondaryContactEmail",
  "clientType",
  "transactionAmount",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postal",
  "financingType",
  "mortgageCompany",
  "mortgageCompanyName",
  "loanOfficerName",
  "loanOfficerEmail",
  "underContractDate",
  "forecastedClosedDate",
  "outsideReferral",
  "referralPercent",
  "referralAmount",
  "referralMailingAddress",
  "otherAgentName",
  "otherAgentPhone",
  "otherAgentEmail",
  "otherAgentCompany",
  "dueDiligencePeriod",
  "dueDiligenceDeadline",
  "contingencies",
  "sellerCompensationPercent",
  "contingencyDetails",
];

describe("PENDING_PAGE_DOCUMENT", () => {
  it("covers every visible Pending field", () => {
    expect(
      collectPageFields(PENDING_PAGE_DOCUMENT).map((field) => field.id),
    ).toEqual(visibleFieldIds);
  });

  it("uses percentage fields for referral and seller compensation", () => {
    const fields = collectPageFields(PENDING_PAGE_DOCUMENT);
    expect(fields.find((field) => field.id === "referralPercent")?.kind).toBe(
      "percentage",
    );
    expect(
      fields.find((field) => field.id === "sellerCompensationPercent")?.kind,
    ).toBe("percentage");
  });

  it("gates secondary, mortgage-other, referral, and seller fields", () => {
    const fields = collectPageFields(PENDING_PAGE_DOCUMENT);
    const secondary = fields.find((field) => field.id === "secondaryContact");
    const mortgageName = fields.find(
      (field) => field.id === "mortgageCompanyName",
    );
    const referral = fields.find((field) => field.id === "referralPercent");
    const dueDiligence = fields.find(
      (field) => field.id === "dueDiligenceDeadline",
    );
    const contingency = fields.find(
      (field) => field.id === "contingencyDetails",
    );

    expect(secondary?.visibleWhen?.[0]?.values).toEqual(["yes"]);
    expect(mortgageName?.visibleWhen?.[0]?.values).toContain("Other");
    expect(referral?.visibleWhen?.[0]?.operator).toBe("isFilled");
    expect(dueDiligence?.visibleWhen).toHaveLength(2);
    expect(contingency?.visibleWhen).toHaveLength(2);
  });

  it("seeds values and previous-submission prefill", () => {
    const values = buildInitialPendingValues({
      document: PENDING_PAGE_DOCUMENT,
      personId: "123",
      agentId: "1",
      clientName: "Test Client",
      dealId: "456",
      sisuTransactionId: "789",
      previousSubmissionFormData: {
        clientPhone: "555-123-4567",
        clientType: "Seller",
      },
    });

    expect(values.clientFirstName).toBe("Test");
    expect(values.clientPhone).toBe("555-123-4567");
    expect(values.clientType).toBe("Seller");
  });
});
