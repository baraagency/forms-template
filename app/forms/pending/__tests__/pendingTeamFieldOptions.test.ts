import { describe, expect, it } from "bun:test";
import type { TeamFieldCatalog } from "../_core/teamFieldOptions";
import {
  getPendingSelectOptions,
  isNoSelection,
  isOtherSelection,
  isSellerSelection,
  isYesSelection,
  prioritizeSpecialVendorOptions,
} from "../pendingTeamFieldOptions";

const fields: TeamFieldCatalog = {
  jcre_leads_63: {
    name: "jcre_leads_63",
    label: "JCRE Lead?",
    type: "yes_no",
    custom: true,
    options: [
      { value: "Y", label: "Yes" },
      { value: "N", label: "No" },
    ],
  },
  f_client_type: {
    name: "f_client_type",
    label: "Client Type",
    type: "select",
    custom: true,
    options: [
      { value: "buyer", label: "Buyer" },
      { value: "seller", label: "Seller" },
    ],
  },
  f_multiple_transactions: {
    name: "client_multiple_transactionss_63",
    label: "Client Multiple Transactions?",
    type: "options",
    custom: true,
    options: [
      { value: "0", label: "Yes" },
      { value: "1", label: "No" },
    ],
  },
  outside_referral: {
    name: "outside_referral",
    label: "Outside Referral or Rebate?",
    type: "options",
    custom: true,
    options: [
      { value: "0", label: "Rebate" },
      { value: "3", label: "N/A" },
    ],
  },
  commission_delivery_to_lpt: {
    name: "commission_delivery_to_lpt",
    label: "Commission Delivery to LPT",
    type: "options",
    custom: true,
    options: [
      { value: "0", label: "Wire" },
      { value: "1", label: "Mail Check" },
    ],
  },
};

describe("getPendingSelectOptions", () => {
  it("uses SISU team field options for pending selects", () => {
    const options = getPendingSelectOptions(fields);

    expect(options.clientTypeOptions).toEqual([
      { value: "Buyer", label: "Buyer" },
      { value: "Seller", label: "Seller" },
    ]);
    expect(options.jcreLeadTransactionOptions).toEqual([
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ]);
    expect(options.multipleTransactionsOptions).toEqual([
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ]);
    expect(options.outsideReferralOptions).toEqual([
      { value: "0", label: "Rebate" },
      { value: "3", label: "N/A" },
    ]);
    expect(options.commissionDeliveryOptions).toEqual([
      { value: "0", label: "Wire" },
      { value: "1", label: "Mail Check" },
    ]);
  });

  it("falls back when SISU does not expose a matching team field", () => {
    const options = getPendingSelectOptions({});

    expect(options.clientTypeOptions).toEqual([
      { value: "Buyer", label: "Buyer" },
      { value: "Seller", label: "Seller" },
    ]);
    expect(options.goodFundContributionOptions).toEqual([
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ]);
  });

  it("normalizes uppercase SISU yes/no labels for display", () => {
    const options = getPendingSelectOptions({
      client_multiple_transactionss_63: {
        name: "client_multiple_transactionss_63",
        label: "Client Multiple Transactions?",
        type: "options",
        custom: true,
        options: [
          { value: "0", label: "YES" },
          { value: "1", label: "NO" },
        ],
      },
    });

    expect(options.multipleTransactionsOptions).toEqual([
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ]);
  });
});

describe("selection helpers", () => {
  it("normalizes conditional select values for SISU or fallback values", () => {
    expect(isYesSelection("yes")).toBe(true);
    expect(isYesSelection("Yes")).toBe(true);
    expect(isNoSelection("no")).toBe(true);
    expect(isNoSelection("No")).toBe(true);
    expect(isOtherSelection("Other")).toBe(true);
    expect(isOtherSelection("other")).toBe(true);
    expect(isSellerSelection("Seller")).toBe(true);
    expect(isSellerSelection("seller")).toBe(true);
  });
});

describe("prioritizeSpecialVendorOptions", () => {
  it("places Other and None before vendor names", () => {
    expect(
      prioritizeSpecialVendorOptions([
        { value: "vendor-1", label: "Acme Law" },
        { value: "none", label: "None" },
        { value: "vendor-2", label: "Best Mortgage" },
        { value: "other", label: "Other" },
      ]),
    ).toEqual([
      { value: "other", label: "Other" },
      { value: "none", label: "None" },
      { value: "vendor-1", label: "Acme Law" },
      { value: "vendor-2", label: "Best Mortgage" },
    ]);
  });
});
