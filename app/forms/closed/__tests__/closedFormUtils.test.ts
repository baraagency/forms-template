import { describe, expect, it } from "bun:test";
import {
  getInitialClosedFormState,
  isLeaseOrRentalSelection,
  validateClosedForm,
} from "../closedFormUtils";
import { applyClosedSisuTransactionPrefill } from "../closedSisuTransactionPrefill";

describe("isLeaseOrRentalSelection", () => {
  it("is true for lease listing and rental/tenant labels", () => {
    expect(isLeaseOrRentalSelection("Lease Listing")).toBe(true);
    expect(isLeaseOrRentalSelection("Rental/Tenant")).toBe(true);
    expect(isLeaseOrRentalSelection("None")).toBe(false);
  });

  it("detects lease and rental selections from option values", () => {
    const transactionTypeOptions = [
      { value: "lease", label: "Lease Listing" },
      { value: "tenant", label: "Rental/Tenant" },
      { value: "none", label: "None" },
    ];

    expect(isLeaseOrRentalSelection("lease", transactionTypeOptions)).toBe(true);
    expect(isLeaseOrRentalSelection("tenant", transactionTypeOptions)).toBe(true);
    expect(isLeaseOrRentalSelection("none", transactionTypeOptions)).toBe(false);
  });
});

describe("validateClosedForm", () => {
  const base = {
    ...getInitialClosedFormState({ personId: "1", agentId: "2", dealId: "42" }),
    clientType: "Buyer",
    transactionType: "none",
    addressLine1: "123 Main St",
    city: "Charleston",
    state: "SC",
    postal: "29401",
    transactionAmount: "$100,000.00",
    totalCommissionGci: "$3,000.00",
    settlementDate: "2026-06-01",
  };

  const transactionTypeOptions = [
    { value: "lease", label: "Lease Listing" },
    { value: "tenant", label: "Rental/Tenant" },
    { value: "none", label: "None" },
  ];

  it("passes a complete non-lease submission", () => {
    expect(validateClosedForm(base, { transactionTypeOptions })).toEqual({});
  });

  it("requires lease fields when lease is selected", () => {
    const errors = validateClosedForm(
      {
        ...base,
        transactionType: "lease",
        securityDeposit: "",
        monthlyRent: "",
      },
      { transactionTypeOptions },
    );

    expect(errors.securityDeposit).toBe("This field is required.");
    expect(errors.monthlyRent).toBe("This field is required.");
  });

  it("rejects future settlement dates", () => {
    const errors = validateClosedForm(
      {
        ...base,
        settlementDate: "2099-01-01",
      },
      { transactionTypeOptions },
    );

    expect(errors.settlementDate).toBeTruthy();
  });

  it("requires Client Type", () => {
    const errors = validateClosedForm(
      { ...base, clientType: "" },
      { transactionTypeOptions },
    );

    expect(errors.clientType).toBe("This field is required.");
  });
});

describe("applyClosedSisuTransactionPrefill", () => {
  it("prefills empty fields from SISU without overwriting typed values", () => {
    const next = applyClosedSisuTransactionPrefill(
      {
        ...getInitialClosedFormState({ personId: "" }),
        addressLine1: "Typed Address",
      },
      {
        address_1: "SISU Address",
        city: "Charleston",
        state: "SC",
        postal_code: "29401",
        fub_id: "321",
        fub_deal_id: "654",
        client_id: 999,
        trans_amt: 250000,
      },
    );

    expect(next.addressLine1).toBe("Typed Address");
    expect(next.city).toBe("Charleston");
    expect(next.personId).toBe("321");
    expect(next.dealId).toBe("654");
    expect(next.sisuTransactionId).toBe("999");
  });

  it("derives Client Type from SISU type_id", () => {
    const seller = applyClosedSisuTransactionPrefill(
      getInitialClosedFormState({ personId: "" }),
      { type_id: "seller" },
    );
    const buyer = applyClosedSisuTransactionPrefill(
      getInitialClosedFormState({ personId: "" }),
      { type_id: "buyer" },
    );

    expect(seller.clientType).toBe("Seller");
    expect(buyer.clientType).toBe("Buyer");
  });

  it("does not overwrite a typed Client Type", () => {
    const next = applyClosedSisuTransactionPrefill(
      { ...getInitialClosedFormState({ personId: "" }), clientType: "Buyer" },
      { type_id: "seller" },
    );

    expect(next.clientType).toBe("Buyer");
  });
});
