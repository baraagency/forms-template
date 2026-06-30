import {
  getTeamFieldOptions,
  type TeamFieldSelectOption,
  type TeamFieldCatalog,
} from "../_core/teamFieldOptions";

type SelectOption = TeamFieldSelectOption;

const yesNoFallbackOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const clientTypeFallbackOptions = ["Buyer", "Seller"].map(toOption);
const financingFallbackOptions = [
  "Cash",
  "Conventional",
  "FHA",
  "VA",
  "Other",
  "USDA",
  "Seller Financed",
  "Assume Mortgage",
].map(toOption);
const outsideReferralFallbackOptions = [
  "No",
  "Outside Referral",
  "Rebate",
  "Referral and Rebate",
].map(toOption);
const commissionDeliveryFallbackOptions = [
  "Wire",
  "Mail check",
  "ACH",
  "Brokerage pickup",
].map(toOption);
const officeFallbackOptions = [
  "Charleston",
  "Columbia",
  "Greenville",
  "Myrtle Beach",
  "Summerville",
].map(toOption);

const candidateFields = {
  clientType: [
    "clientType",
    "client_type",
    "Client Type",
    "lead_type_id",
    "type_id",
  ],
  jcreOffice: ["jcreOffice", "jcre_office", "JCRE Office"],
  jcreLeadTransaction: [
    "jcreLeadTransaction",
    "jcre_lead_transaction",
    "jcre_leads_63",
    "JCRE Lead Transaction",
    "JCRE Lead?",
  ],
  plrAcknowledgement: [
    "plrAcknowledgement",
    "plr_acknowledgement",
    "do_you_understand_that_plrs_92s_need_to_be_fully_executed_within_48_hours_of_ratification_and_prior_",
    "PLR acknowledgement",
    "PLR Acknowledgement",
  ],
  closingDepartment: [
    "closingDepartment",
    "closing_department",
    "cap_agentss_58_if_personals_44_closing_servicess_63",
    "CAP AGENTS ONLY: If personal, will be using the Closing Department?",
    "CAP AGENTS ONLY: If personal, using the Closing Department?",
    "CAP AGENTS: If personal, Closing Services?",
  ],
  hasSecondaryClient: [
    "hasSecondaryClient",
    "has_secondary_client",
    "Is there a secondary client?",
  ],
  onTeam: [
    "onTeam",
    "on_team",
    "are_you_on_a_teams_63",
    "Are you on a team?",
    "Are you on a Team within JCRE?",
  ],
  isaSet: ["isaSet", "isa_set", "isa_sets_63", "ISA Set", "ISA Set?"],
  pastClient: [
    "pastClient",
    "past_client",
    "Was this a JCRE past client?",
  ],
  outsideReferral: [
    "outsideReferral",
    "outside_referral",
    "Outside Referral/Rebate?",
    "Outside Referral/Rebate",
  ],
  financingType: ["financing", "Financing", "Financing Type"],
  dueDiligencePeriod: [
    "dueDiligencePeriod",
    "due_diligence_period",
    "is_there_a_due_diligence_periods_63",
    "Is there a due diligence period?",
  ],
  contingencies: [
    "contingencies",
    "are_there_any_contingenciess_63",
    "Are there contingencies?",
  ],
  multipleTransactions: [
    "multipleTransactions",
    "multiple_transactions",
    "client_multiple_transactionss_63",
    "Is the client doing multiple transactions with us?",
  ],
  goodFundContribution: [
    "goodFundContribution",
    "good_fund_contribution",
    "1s_37_for_good_contribution",
    "Would you like to contribute $30.00 to the 1% for Good Fund?",
    "Contribute $30.00 to the 1% for Good Fund?",
  ],
  commissionDelivery: [
    "commissionDelivery",
    "commission_delivery",
    "commission_delivery_to_lpt",
    "How would you like the commission delivered to LPT?",
  ],
} as const;

export type PendingSelectOptions = {
  clientTypeOptions: SelectOption[];
  jcreOfficeOptions: SelectOption[];
  jcreLeadTransactionOptions: SelectOption[];
  plrAcknowledgementOptions: SelectOption[];
  closingDepartmentOptions: SelectOption[];
  hasSecondaryClientOptions: SelectOption[];
  onTeamOptions: SelectOption[];
  isaSetOptions: SelectOption[];
  pastClientOptions: SelectOption[];
  outsideReferralOptions: SelectOption[];
  financingOptions: SelectOption[];
  dueDiligencePeriodOptions: SelectOption[];
  contingenciesOptions: SelectOption[];
  multipleTransactionsOptions: SelectOption[];
  goodFundContributionOptions: SelectOption[];
  commissionDeliveryOptions: SelectOption[];
};

function toOption(value: string): SelectOption {
  return { value, label: value };
}

function normalizeSelection(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeYesNoOptions(options: SelectOption[]): SelectOption[] {
  const normalizedOptions = options
    .map((option) => {
      const labelValue = normalizeSelection(option.label);
      const optionValue = normalizeSelection(option.value);

      if (labelValue === "yes" || optionValue === "yes") {
        return { value: "yes", label: "Yes" };
      }
      if (labelValue === "no" || optionValue === "no") {
        return { value: "no", label: "No" };
      }

      return null;
    })
    .filter((option) => option !== null);

  return normalizedOptions.length >= 2 ? normalizedOptions : yesNoFallbackOptions;
}

function normalizeClientTypeOptions(options: SelectOption[]): SelectOption[] {
  const normalizedOptions = options
    .map((option) => {
      const labelValue = normalizeSelection(option.label);
      const optionValue = normalizeSelection(option.value);

      if (labelValue === "buyer" || optionValue === "buyer") {
        return { value: "Buyer", label: option.label || "Buyer" };
      }
      if (labelValue === "seller" || optionValue === "seller") {
        return { value: "Seller", label: option.label || "Seller" };
      }

      return null;
    })
    .filter((option) => option !== null);

  return normalizedOptions.length >= 2
    ? normalizedOptions
    : clientTypeFallbackOptions;
}

function getOptions(
  fields: TeamFieldCatalog,
  field: keyof typeof candidateFields,
  fallbackOptions: SelectOption[],
): SelectOption[] {
  return getTeamFieldOptions(fields, [...candidateFields[field]], fallbackOptions);
}

function getYesNoOptions(
  fields: TeamFieldCatalog,
  field: keyof typeof candidateFields,
): SelectOption[] {
  return normalizeYesNoOptions(getOptions(fields, field, yesNoFallbackOptions));
}

export function isYesSelection(value: string): boolean {
  return normalizeSelection(value) === "yes";
}

export function isNoSelection(value: string): boolean {
  return normalizeSelection(value) === "no";
}

export function isOtherSelection(value: string): boolean {
  return normalizeSelection(value) === "other";
}

function isSpecialVendorOption(option: SelectOption, label: "other" | "none"): boolean {
  return (
    normalizeSelection(option.value) === label ||
    normalizeSelection(option.label) === label
  );
}

export function prioritizeSpecialVendorOptions(options: SelectOption[]): SelectOption[] {
  const withRequiredOptions = [...options];
  const requiredOptions: SelectOption[] = [
    { value: "Other", label: "Other" },
    { value: "None", label: "None" },
  ];

  for (const option of requiredOptions) {
    const normalizedLabel =
      option.label === "Other" ? "other" : "none";

    if (
      !withRequiredOptions.some((currentOption) =>
        isSpecialVendorOption(currentOption, normalizedLabel),
      )
    ) {
      withRequiredOptions.push(option);
    }
  }

  const priority = (option: SelectOption) => {
    if (isSpecialVendorOption(option, "other")) return 0;
    if (isSpecialVendorOption(option, "none")) return 1;
    return 2;
  };

  return withRequiredOptions
    .map((option, index) => ({ option, index }))
    .sort((left, right) => {
      const priorityDifference = priority(left.option) - priority(right.option);
      return priorityDifference || left.index - right.index;
    })
    .map(({ option }) => option);
}

export function isSellerSelection(value: string): boolean {
  return normalizeSelection(value) === "seller";
}

export function getPendingSelectOptions(
  fields: TeamFieldCatalog,
): PendingSelectOptions {
  return {
    clientTypeOptions: normalizeClientTypeOptions(
      getOptions(fields, "clientType", clientTypeFallbackOptions),
    ),
    jcreOfficeOptions: getOptions(fields, "jcreOffice", officeFallbackOptions),
    jcreLeadTransactionOptions: getYesNoOptions(fields, "jcreLeadTransaction"),
    plrAcknowledgementOptions: getYesNoOptions(fields, "plrAcknowledgement"),
    closingDepartmentOptions: getYesNoOptions(fields, "closingDepartment"),
    hasSecondaryClientOptions: getYesNoOptions(fields, "hasSecondaryClient"),
    onTeamOptions: getYesNoOptions(fields, "onTeam"),
    isaSetOptions: getYesNoOptions(fields, "isaSet"),
    pastClientOptions: getYesNoOptions(fields, "pastClient"),
    outsideReferralOptions: getOptions(
      fields,
      "outsideReferral",
      outsideReferralFallbackOptions,
    ),
    financingOptions: getOptions(fields, "financingType", financingFallbackOptions),
    dueDiligencePeriodOptions: getYesNoOptions(fields, "dueDiligencePeriod"),
    contingenciesOptions: getYesNoOptions(fields, "contingencies"),
    multipleTransactionsOptions: getYesNoOptions(fields, "multipleTransactions"),
    goodFundContributionOptions: getYesNoOptions(fields, "goodFundContribution"),
    commissionDeliveryOptions: getOptions(
      fields,
      "commissionDelivery",
      commissionDeliveryFallbackOptions,
    ),
  };
}
