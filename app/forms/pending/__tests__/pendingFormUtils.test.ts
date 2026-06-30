import { describe, expect, it } from "bun:test";
import {
  applyPendingSisuTransactionPrefill,
  applyPendingPersonPrefill,
  getInitialPendingFormState,
  isOutsideReferralSelected,
  pendingDatePickerBehaviorProps,
  validatePendingForm,
  validatePendingSection,
  type PendingFormState,
} from "../pendingFormUtils";

const baseState: PendingFormState = {
  ...getInitialPendingFormState({
    personId: "123",
    agentId: "456",
    clientName: "Jane Client",
  }),
  dealId: "",
  sisuTransactionId: "",
  clientPhone: "(843) 555-0100",
  clientEmail: "jane@example.com",
  clientType: "Seller",
  transactionAmount: "$450,000.00",
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
  underContractDate: "2026-05-05",
  forecastedClosedDate: "2026-06-05",
  outsideReferral: "No",
  otherAgentName: "Other Agent",
  otherAgentEmail: "other@example.com",
  closingAttorney: "Attorney Vendor",
  mortgageCompany: "Mortgage Vendor",
  financingType: "Conventional",
  dueDiligencePeriod: "no",
  contingencies: "no",
  multipleTransactions: "no",
  goodFundContribution: "yes",
  commissionDelivery: "Wire",
  grossCommissionTotal: "$13,500.00",
};

describe("getInitialPendingFormState", () => {
  it("prefills ids and client names from routed context", () => {
    expect(
      getInitialPendingFormState({
        personId: "123",
        agentId: "456",
        clientName: "Jane Mary Client",
        dealId: "789",
        sisuTransactionId: "555",
      }),
    ).toMatchObject({
      personId: "123",
      agentId: "456",
      clientFirstName: "Jane",
      clientLastName: "Mary Client",
      dealId: "789",
      sisuTransactionId: "555",
    });
  });
});

describe("pendingDatePickerBehaviorProps", () => {
  it("lets the picker close after selecting a date or clicking away", () => {
    expect(pendingDatePickerBehaviorProps).toEqual({
      closeOnSelect: true,
    });
    expect("keepOpenDuringFieldFocus" in pendingDatePickerBehaviorProps).toBe(false);
  });
});

describe("applyPendingPersonPrefill", () => {
  it("fills missing lead and address details without overwriting user input", () => {
    expect(
      applyPendingPersonPrefill(
        { ...getInitialPendingFormState({}), clientLastName: "Typed" },
        {
          id: "123",
          firstName: "Jane",
          lastName: "Client",
          assignedUserId: 456,
          phones: [{ value: "8435550100", isPrimary: 1 }],
          emails: [{ value: "jane@example.com", isPrimary: 1 }],
          address: "123 Main St",
          city: "Charleston",
          state: "SC",
          zipCode: "29401",
        },
      ),
    ).toMatchObject({
      personId: "123",
      agentId: "456",
      clientFirstName: "Jane",
      clientLastName: "Typed",
      clientPhone: "(843) 555-0100",
      clientEmail: "jane@example.com",
      addressLine1: "123 Main St",
      city: "Charleston",
      state: "SC",
      postal: "29401",
    });
  });

  it("fills secondary contact details from the first FUB relationship", () => {
    expect(
      applyPendingPersonPrefill(getInitialPendingFormState({}), {
        id: "123",
        firstName: "Jane",
        lastName: "Client",
        relationships: [
          {
            type: "spouse",
            person: {
              firstName: "John",
              lastName: "Client",
              phones: [{ value: "8435550101", isPrimary: 1 }],
              emails: [{ value: "john@example.com", isPrimary: 1 }],
            },
          },
        ],
      }),
    ).toMatchObject({
      hasSecondaryClient: "yes",
      secondaryContact: "John Client",
      secondaryContactPhone: "(843) 555-0101",
      secondaryContactEmail: "john@example.com",
    });
  });
});

describe("applyPendingSisuTransactionPrefill", () => {
  it("maps SISU transaction fields into the pending form using submission keys", () => {
    expect(
      applyPendingSisuTransactionPrefill(getInitialPendingFormState({}), {
        transaction_id: "555",
        agent_id: 456,
        first_name: "Jane",
        last_name: "Client",
        email: "jane@example.com",
        mobile_phone: "8435550100",
        second_contact_name: "John Client",
        second_contact_email: "john@example.com",
        second_contact_phone: "8435550101",
        client_type: "Buyer",
        trans_amt: 450000,
        address_1: "123 Main St",
        address_2: "Unit 2",
        city: "Charleston",
        state: "SC",
        postal_code: "29401",
        agent_2: "Sam Agent",
        agent_2_s_37: 25,
        jcre_office: "Charleston",
        jcre_leads_63: "no",
        do_you_understand_that_plrs_92s_need_to_be_fully_executed_within_48_hours_of_ratification_and_prior_:
          "yes",
        cap_agentss_58_if_personals_44_closing_servicess_63: "yes",
        are_you_on_a_teams_63: "yes",
        team_leader_name: "Team Lead",
        teamss_58_pay_notes_for_accounting: "Team split notes",
        isa_sets_63: "yes",
        appt_set_by_agent_id: 1234,
        past_client: "no",
        uc_dt: "2026-05-05",
        forecasted_closed_dt: "2026-06-05",
        outside_referral: "Outside Referral",
        referral_amount: 25,
        referral_amt: 3500,
        referral_mailing_address: "PO Box 123",
        other_agent_name: "Other Agent",
        other_agent_phone: "8435550102",
        other_agent_email: "other@example.com",
        other_agent_company: "Other Realty",
        attorney_vid: 184883,
        jcre_closing_attorney: "Other Attorney",
        jcre_closing_attorney_phone: "8435550103",
        jcre_closing_attorney_email: "attorney@example.com",
        mortgage_company_vid: 184058,
        mortgage_other: "Other Mortgage",
        loan_officer_name: "Loan Officer",
        loan_officer_email: "loan@example.com",
        financing: "Conventional",
        is_there_a_due_diligence_periods_63: "yes",
        due_diligence_deadline_dt: "2026-05-15",
        are_there_any_contingenciess_63: "yes",
        contingencies: "Inspection contingency",
        client_multiple_transactionss_63: "yes",
        second_address_multiple_transactions: "456 Backup St",
        notes_for_the_closing_department: "Closing notes",
        "1s_37_for_good_contribution": "yes",
        commission_delivery_to_lpt: "Wire",
        "120_compensations_63": "2.50%",
        jcre_gross_comission_total_in_s_36: 13500,
        fub_id: "123",
        fub_deal_id: "789",
      }),
    ).toMatchObject({
      sisuTransactionId: "555",
      agentId: "456",
      clientFirstName: "Jane",
      clientLastName: "Client",
      clientPhone: "(843) 555-0100",
      clientEmail: "jane@example.com",
      hasSecondaryClient: "yes",
      secondaryContact: "John Client",
      secondaryContactPhone: "(843) 555-0101",
      secondaryContactEmail: "john@example.com",
      clientType: "Buyer",
      transactionStage: "buyer-pending",
      transactionAmount: "$450,000.00",
      addressLine1: "123 Main St",
      addressLine2: "Unit 2",
      city: "Charleston",
      state: "SC",
      postal: "29401",
      agent2: "Sam Agent",
      agent2Percent: "25.00%",
      jcreOffice: "Charleston",
      jcreLeadTransaction: "no",
      plrAcknowledgement: "yes",
      closingDepartment: "yes",
      onTeam: "yes",
      teamLeaderName: "Team Lead",
      teamPayNotes: "Team split notes",
      isaSet: "yes",
      isaName: "1234",
      pastClient: "no",
      underContractDate: "2026-05-05",
      forecastedClosedDate: "2026-06-05",
      outsideReferral: "Outside Referral",
      referralPercent: "25.00%",
      referralAmount: "$3,500.00",
      referralMailingAddress: "PO Box 123",
      otherAgentName: "Other Agent",
      otherAgentPhone: "(843) 555-0102",
      otherAgentEmail: "other@example.com",
      otherAgentCompany: "Other Realty",
      closingAttorney: "184883",
      closingAttorneyOther: "Other Attorney",
      closingAttorneyPhone: "(843) 555-0103",
      closingAttorneyEmail: "attorney@example.com",
      mortgageCompany: "184058",
      mortgageCompanyName: "Other Mortgage",
      loanOfficerName: "Loan Officer",
      loanOfficerEmail: "loan@example.com",
      financingType: "Conventional",
      dueDiligencePeriod: "yes",
      dueDiligenceDeadline: "2026-05-15",
      contingencies: "yes",
      contingencyDetails: "Inspection contingency",
      multipleTransactions: "yes",
      otherAddresses: "456 Backup St",
      closingDepartmentNotes: "Closing notes",
      goodFundContribution: "yes",
      commissionDelivery: "Wire",
      sellerCompensationPercent: "2.50%",
      grossCommissionTotal: "$13,500.00",
      personId: "123",
      dealId: "789",
    });
  });

  it("derives Client Type and transaction stage from SISU type_id", () => {
    expect(
      applyPendingSisuTransactionPrefill(getInitialPendingFormState({}), {
        transaction_id: "555",
        type_id: "s",
        client_type: "0",
      }),
    ).toMatchObject({
      clientType: "Seller",
      transactionStage: "seller-pending",
    });

    expect(
      applyPendingSisuTransactionPrefill(getInitialPendingFormState({}), {
        transaction_id: "556",
        type_id: "b",
        client_type: "1",
      }),
    ).toMatchObject({
      clientType: "Buyer",
      transactionStage: "buyer-pending",
    });
  });

  it("normalizes SISU yes/no option ids for JCRE Lead Transaction", () => {
    expect(
      applyPendingSisuTransactionPrefill(getInitialPendingFormState({}), {
        transaction_id: "6495594",
        jcre_leads_63: "0",
      }),
    ).toMatchObject({
      jcreLeadTransaction: "yes",
    });

    expect(
      applyPendingSisuTransactionPrefill(getInitialPendingFormState({}), {
        transaction_id: "6495594",
        jcre_leads_63: "1",
      }),
    ).toMatchObject({
      jcreLeadTransaction: "no",
    });
  });

  it("defaults ISA Set to yes when an ISA name is present", () => {
    expect(
      applyPendingSisuTransactionPrefill(getInitialPendingFormState({}), {
        appt_set_by_agent_id: 1234,
      }),
    ).toMatchObject({
      isaSet: "yes",
      isaName: "1234",
    });
  });

  it("prefills contact details from the nested SISU contact record when top-level values are absent", () => {
    expect(
      applyPendingSisuTransactionPrefill(getInitialPendingFormState({}), {
        client_id: 6495593,
        agent_id: 203440,
        type_id: "s",
        trans_amt: 1,
        custom: {},
        contact: {
          first_name: "TEst",
          last_name: "Test",
          mobile_phone: "(123) 123-1234",
          email: "test@example.com",
          address_1: "123 test ave",
          city: "city",
          state: "AZ",
          postal_code: "00000",
        },
      }),
    ).toMatchObject({
      sisuTransactionId: "6495593",
      agentId: "203440",
      clientFirstName: "TEst",
      clientLastName: "Test",
      clientPhone: "(123) 123-1234",
      clientEmail: "test@example.com",
      clientType: "Seller",
      transactionStage: "seller-pending",
      transactionAmount: "$1.00",
      addressLine1: "123 test ave",
      city: "city",
      state: "AZ",
      postal: "00000",
    });
  });
});

describe("isOutsideReferralSelected", () => {
  it("only treats actual outside referral selections as showing referral details", () => {
    expect(isOutsideReferralSelected("")).toBe(false);
    expect(isOutsideReferralSelected("No")).toBe(false);
    expect(isOutsideReferralSelected("N/A")).toBe(false);
    expect(isOutsideReferralSelected("Rebate")).toBe(false);
    expect(isOutsideReferralSelected("0")).toBe(false);
    expect(isOutsideReferralSelected("3")).toBe(false);
    expect(isOutsideReferralSelected("Outside Referral")).toBe(true);
    expect(isOutsideReferralSelected("Referral and Rebate")).toBe(true);
    expect(isOutsideReferralSelected("1")).toBe(true);
    expect(isOutsideReferralSelected("2")).toBe(true);
  });
});

describe("validatePendingSection", () => {
  it("validates primary details", () => {
    expect(validatePendingSection(baseState, "primary")).toEqual({});
    expect(
      validatePendingSection(
        {
          ...baseState,
          clientFirstName: "",
          clientLastName: "",
          clientPhone: "",
          clientEmail: "",
          transactionAmount: "",
          hasSecondaryClient: "",
          postal: "",
        },
        "primary",
      ),
    ).toEqual({
      clientFirstName: "This field is required.",
      clientLastName: "This field is required.",
      clientPhone: "This field is required.",
      clientEmail: "This field is required.",
      transactionAmount: "This field is required.",
      hasSecondaryClient: "This field is required.",
      postal: "This field is required.",
    });
  });

  it("validates primary client phone and email formats", () => {
    expect(
      validatePendingSection(
        { ...baseState, clientPhone: "123", clientEmail: "bad-email" },
        "primary",
      ),
    ).toEqual({
      clientPhone: "Enter a valid phone number.",
      clientEmail: "Enter a valid email address.",
    });
  });

  it("validates conditional secondary client fields in Client Info", () => {
    expect(
      validatePendingSection(
        {
          ...baseState,
          hasSecondaryClient: "yes",
          secondaryContact: "",
          secondaryContactPhone: "123",
          secondaryContactEmail: "bad-email",
        },
        "primary",
      ),
    ).toEqual({
      secondaryContact: "Enter the secondary contact.",
      secondaryContactPhone: "Enter a valid secondary contact phone number.",
      secondaryContactEmail: "Enter a valid secondary contact email.",
    });
  });

  it("validates conditional PLR fields", () => {
    expect(
      validatePendingSection(
        {
          ...baseState,
          jcreLeadTransaction: "no",
          plrAcknowledgement: "",
        },
        "secondary",
      ),
    ).toEqual({
      plrAcknowledgement: "Choose a PLR acknowledgement option.",
    });
  });

  it("validates conditional additional detail fields", () => {
    expect(
      validatePendingSection(
        {
          ...baseState,
          isaSet: "yes",
          isaName: "",
          outsideReferral: "Outside Referral",
          referralPercent: "",
          referralAmount: "",
          referralMailingAddress: "",
          closingAttorney: "Other",
          closingAttorneyOther: "",
          closingAttorneyEmail: "bad-email",
          mortgageCompany: "Other",
          mortgageCompanyName: "",
          loanOfficerEmail: "bad-email",
        },
        "additional",
      ),
    ).toEqual({
      isaName: "Choose the Call Partner/ISA.",
      closingAttorneyOther: "Enter the closing attorney.",
      closingAttorneyEmail: "Enter a valid closing attorney email.",
      mortgageCompanyName: "Enter the mortgage company name.",
      loanOfficerEmail: "Enter a valid loan officer email.",
    });
  });

  it("validates referral percent format only when an optional referral percent is present", () => {
    expect(
      validatePendingSection(
        {
          ...baseState,
          outsideReferral: "Outside Referral",
          referralPercent: "125%",
          referralAmount: "",
          referralMailingAddress: "",
        },
        "additional",
      ),
    ).toEqual({
      referralPercent: "Enter a percentage from 0 to 100.",
    });
  });

  it("validates SISU Other vendor ids as conditional additional detail fields", () => {
    expect(
      validatePendingSection(
        {
          ...baseState,
          closingAttorney: "184883",
          closingAttorneyOther: "",
          mortgageCompany: "184058",
          mortgageCompanyName: "",
        },
        "additional",
      ),
    ).toEqual({
      closingAttorneyOther: "Enter the closing attorney.",
      mortgageCompanyName: "Enter the mortgage company name.",
    });
  });

  it("validates seller-only and final commission fields", () => {
    expect(
      validatePendingSection(
        {
          ...baseState,
          dueDiligencePeriod: "yes",
          dueDiligenceDeadline: "",
          contingencies: "yes",
          contingencyDetails: "",
          multipleTransactions: "yes",
          otherAddresses: "",
          sellerCompensationPercent: "125%",
          grossCommissionTotal: "",
        },
        "final",
      ),
    ).toEqual({
      dueDiligenceDeadline: "Choose the due diligence deadline.",
      contingencyDetails: "Enter the contingencies.",
      sellerCompensationPercent: "Enter a percentage from 0 to 100.",
      grossCommissionTotal: "This field is required.",
    });
  });
});

describe("validatePendingForm", () => {
  it("validates all pending sections for the single-page form", () => {
    expect(validatePendingForm(baseState)).toEqual({});
    expect(
      validatePendingForm({
        ...baseState,
        clientType: "",
        jcreOffice: "",
        underContractDate: "",
        commissionDelivery: "",
      }),
    ).toEqual({
      clientType: "This field is required.",
      jcreOffice: "This field is required.",
      underContractDate: "This field is required.",
      commissionDelivery: "This field is required.",
    });
  });

  it("does not require a transaction selection when the field is not displayed", () => {
    expect(validatePendingForm({ ...baseState, dealId: "" }).dealId).toBeUndefined();
  });
});
