export const CLOSED_TRANSACTION_TYPE_OPTIONS = [
  { value: "lease", label: "Lease Listing" },
  { value: "tenant", label: "Rental/Tenant" },
  { value: "referral", label: "Outbound Referral" },
  { value: "none", label: "None" },
] as const;

export const CLOSED_SISU_FIELD_KEYS = {
  fubId: ["fub_id"],
  fubDealId: ["fub_deal_id"],
  sisuTransactionId: ["client_id"],
  transactionType: ["rentals_63", "rental"],
  addressLine1: ["address_1"],
  city: ["city"],
  state: ["state"],
  postal: ["postal_code"],
  transactionAmount: ["trans_amt"],
  securityDeposit: ["security_deposit"],
  monthlyRent: ["monthly_rent"],
  totalCommissionGci: ["total_commission_and_gci", "total_commission_gci"],
  settlementDate: ["closed_dt", "settlement_date"],
  tcMarketingNotes: ["tc_marketing_notes", "marketing_notes"],
} as const;

export type ClosedSisuFieldKey = keyof typeof CLOSED_SISU_FIELD_KEYS;

export const CLOSED_SISU_DEFAULT_FIELD_TYPES: Partial<
  Record<ClosedSisuFieldKey, string>
> = {
  transactionAmount: "amount",
  securityDeposit: "string",
  monthlyRent: "amount",
  totalCommissionGci: "amount",
  settlementDate: "date",
  fubId: "integer",
  fubDealId: "integer",
};
