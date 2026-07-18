"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Field,
  Notice,
  Row,
  SectionCard,
  SelectInput,
  Spinner,
  TextAreaInput,
  TextInput,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@baraagency/components";
import type { FUBPerson } from "@/app/types/fub";
import type { SISUDropdownOption, SISUTeamFieldsCatalogResponse } from "@/app/types/sisu";
import {
  formatCurrencyInput,
  formatPercentageInput,
  limitPercentageInputPrecision,
} from "../_core/formatUtils";
import { FormDatePickerField } from "../_core/formDatePickerField";
import type { TeamFieldCatalog } from "../_core/teamFieldOptions";
import {
  applyPendingPersonPrefill,
  applyPendingSisuTransactionPrefill,
  defaultPendingIsaSetFromIsaName,
  formatPendingPhoneField,
  getInitialPendingFormState,
  isOutsideReferralSelected,
  validatePendingForm,
  type PendingFieldErrors,
  type PendingFormState,
} from "./pendingFormUtils";
import {
  getPendingSelectOptions,
  isOtherSelection,
  isSellerSelection,
  isYesSelection,
  prioritizeSpecialVendorOptions,
} from "./pendingTeamFieldOptions";
import {
  buildPostSubmissionHref,
  buildSubmittedAddress,
  getSubmittedFubDealId,
  getSubmittedSisuTransactionId,
  getSubmissionErrorMessage,
  getSubmissionSummaryEmailWarning,
  storeSubmittedDebugRecord,
} from "../_core/submissionUtils";
import {
  clearDiscardedSisuTransactionId,
  removeSisuTransactionIdFromCurrentUrl,
  resolveSisuTransactionLookup,
  SISU_TRANSACTION_NOT_FOUND_WARNING,
  shouldResolveSisuTransactionLookup,
} from "../_core/sisuTransactionLookup";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";
import type { JsonValue } from "@/app/types/storage";
import { FormRouterBackLink } from "../_core/formRouterBackLink";
import { buildFormRouterReturnUrlFromSearchParams } from "../_core/formRouterUtils";

type SelectOption = {
  value: string;
  label: string;
};

type VendorsResponse = {
  vendors: {
    mortgageCompany: SISUDropdownOption[];
  };
};

const usStates = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="form-field-group">
      <h3 className="border-b border-[var(--divider-color)] pb-2 text-xs font-semibold uppercase text-[var(--body-color)]">
        {title}
      </h3>
      <div className="form-field-group-fields">{children}</div>
    </div>
  );
}

function MuiDateField({
  id,
  label,
  value,
  required,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FormDatePickerField
        id={id}
        label={label}
        value={value}
        required={required}
        error={error}
        onChange={onChange}
      />
      <FieldError message={error} />
    </div>
  );
}

function buildRouterHref(
  state: PendingFormState,
  params: Record<string, string | string[] | undefined>,
) {
  return buildFormRouterReturnUrlFromSearchParams(params, {
    personId: state.personId,
  });
}

export function PendingFormClient({
  searchParams,
  previousSubmissionFormData = null,
  localDemoEnabled = false,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  previousSubmissionFormData?: JsonValue | null;
  localDemoEnabled?: boolean;
}) {
  const router = useRouter();
  const routedAgentName = getSingleSearchParam(searchParams, "agentName");
  const [formState, setFormState] = useState<PendingFormState>(() => {
    const initialState = getInitialPendingFormState({
      personId:
        getSingleSearchParam(searchParams, "clientId") ||
        getSingleSearchParam(searchParams, "personId"),
      agentId: getSingleSearchParam(searchParams, "agentId"),
      clientName: getSingleSearchParam(searchParams, "clientName"),
      dealId: getSingleSearchParam(searchParams, "dealId"),
      sisuTransactionId: getSingleSearchParam(searchParams, "sisuTransactionId"),
    });

    return defaultPendingIsaSetFromIsaName(
      applyPreviousSubmissionFormData(
        initialState,
        previousSubmissionFormData,
      ),
    );
  });
  const [errors, setErrors] = useState<PendingFieldErrors>({});
  const [teamFields, setTeamFields] = useState<TeamFieldCatalog>({});
  const [mortgageVendors, setMortgageVendors] = useState<SelectOption[]>([]);
  const [loadingLead, setLoadingLead] = useState(Boolean(formState.personId));
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "complete" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const {
    clientTypeOptions,
    hasSecondaryClientOptions,
    outsideReferralOptions,
    financingOptions,
    dueDiligencePeriodOptions,
    contingenciesOptions,
  } = getPendingSelectOptions(teamFields);
  const mortgageCompanyOptions = prioritizeSpecialVendorOptions(mortgageVendors);
  const showMortgageCompanyOther = isOtherVendorSelection(
    formState.mortgageCompany,
    mortgageCompanyOptions,
  );

  useEffect(() => {
    if (!formState.personId) {
      return;
    }

    const controller = new AbortController();

    const loadLead = async () => {
      try {
        setLoadError(null);
        setLoadingLead(true);

        const personResponse = await fetch(
          `/api/fub/people/${formState.personId}`,
          { signal: controller.signal },
        );

        if (!personResponse.ok) {
          throw new Error(`Unable to load lead details (HTTP ${personResponse.status}).`);
        }

        const person = (await personResponse.json()) as FUBPerson;
        setFormState((current) => applyPendingPersonPrefill(current, person));
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setLoadError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load lead details.",
        );
      } finally {
        setLoadingLead(false);
      }
    };

    void loadLead();
    return () => controller.abort();
  }, [formState.personId]);

  useEffect(() => {
    const controller = new AbortController();

    const loadOptions = async () => {
      try {
        setOptionsError(null);
        const [teamFieldsResponse, vendorsResponse] = await Promise.all([
          fetch("/api/sisu/team-fields", { signal: controller.signal }),
          fetch("/api/sisu/vendors", { signal: controller.signal }),
        ]);

        if (!teamFieldsResponse.ok) {
          throw new Error(
            `Unable to load SISU team fields (HTTP ${teamFieldsResponse.status}).`,
          );
        }
        if (!vendorsResponse.ok) {
          throw new Error(
            `Unable to load SISU vendors (HTTP ${vendorsResponse.status}).`,
          );
        }

        const teamFieldsPayload =
          (await teamFieldsResponse.json()) as SISUTeamFieldsCatalogResponse;
        const vendorsPayload = (await vendorsResponse.json()) as VendorsResponse;

        setTeamFields(teamFieldsPayload.fields ?? {});
        setMortgageVendors(normalizeSisuOptions(vendorsPayload.vendors.mortgageCompany));
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setOptionsError(
          requestError instanceof Error
            ? `${requestError.message} Using default field options where available.`
            : "Unable to load SISU options. Using default field options where available.",
        );
      }
    };

    void loadOptions();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (
      !shouldResolveSisuTransactionLookup({
        sisuTransactionId: formState.sisuTransactionId,
        dealId: formState.dealId,
      })
    ) {
      return;
    }

    const controller = new AbortController();

    const loadTransaction = async () => {
      try {
        setTransactionError(null);
        setLoadingTransaction(true);

        const result = await resolveSisuTransactionLookup({
          sisuTransactionId: formState.sisuTransactionId,
          dealId: formState.dealId,
          signal: controller.signal,
        });
        const discardedSisuTransactionId = result.discardedSisuTransactionId;

        if (
          discardedSisuTransactionId &&
          formState.sisuTransactionId === discardedSisuTransactionId
        ) {
          removeSisuTransactionIdFromCurrentUrl();
          setFormState((current) =>
            clearDiscardedSisuTransactionId(current, discardedSisuTransactionId),
          );
        }

        if (result.error) {
          setTransactionError(result.error);
          return;
        }

        if (result.transaction) {
          setFormState((current) =>
            applyPendingSisuTransactionPrefill(
              clearDiscardedSisuTransactionId(current, discardedSisuTransactionId),
              result.transaction!,
            ),
          );
        }
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setTransactionError(SISU_TRANSACTION_NOT_FOUND_WARNING);
      } finally {
        setLoadingTransaction(false);
      }
    };

    void loadTransaction();
    return () => controller.abort();
  }, [formState.dealId, formState.sisuTransactionId]);

  const updateField = useCallback(
    (field: keyof PendingFormState, value: string) => {
      setFormState((current) => {
        const nextState = { ...current, [field]: value };
        if (field === "clientType") {
          nextState.transactionStage = value === "Buyer" ? "buyer-pending" : value === "Seller" ? "seller-pending" : "";
        }
        return nextState;
      });
      setErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    const nextErrors = validatePendingForm(formState);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSubmitStatus("submitting");
      setSubmitMessage(null);
      const response = await fetch("/api/forms/pending/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) {
        throw new Error(
          getSubmissionErrorMessage(
            payload,
            `Pending submission failed (HTTP ${response.status}).`,
          ),
        );
      }

      const debugKey = storeSubmittedDebugRecord("pending", payload);
      router.push(
        buildPostSubmissionHref({
          formType: "pending",
          personId: formState.personId,
          agentId: formState.agentId,
          dealId: getSubmittedFubDealId(payload) || formState.dealId,
          agentName: routedAgentName,
          clientName: [formState.clientFirstName, formState.clientLastName]
            .filter(Boolean)
            .join(" "),
          address: buildSubmittedAddress(
            formState.addressLine1,
            formState.addressLine2,
            formState.city,
            formState.state,
            formState.postal,
          ),
          sisuTransactionId:
            getSubmittedSisuTransactionId(payload) || formState.sisuTransactionId,
          debugKey,
          emailWarning: getSubmissionSummaryEmailWarning(payload) ?? undefined,
        }),
      );
    } catch (submitError) {
      setSubmitStatus("error");
      setSubmitMessage(
        submitError instanceof Error
          ? submitError.message
          : "Pending submission failed.",
      );
    }
  }, [formState, routedAgentName, router]);

  if (
    submitStatus === "submitting" ||
    submitStatus === "complete"
  ) {
    return (
      <main className="page-form">
        <SectionCard title="Submission Status">
          <div className="space-y-4">
            {submitStatus === "submitting" ? (
              <Notice tone="warning">
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Submitting Pending form...
                </span>
              </Notice>
            ) : null}
            {submitStatus === "complete" ? (
              <Notice tone="success">{submitMessage}</Notice>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={() => setSubmitStatus("idle")}
              >
                Back to Form
              </button>
              <FormRouterBackLink
                href={buildRouterHref(formState, searchParams)}
                className={secondaryButtonClassName}
              />
            </div>
          </div>
        </SectionCard>
      </main>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <main className="page-form">
        <div className="mb-4">
          <FormRouterBackLink
            href={buildRouterHref(formState, searchParams)}
            className={`${secondaryButtonClassName} px-4 py-2 text-xs`}
          />
        </div>
        <title>Pending Form</title>
        <div className="mb-6 border-b border-[var(--divider-color)] pb-6">
          <h1 className="page-title mb-0 text-balance">Pending</h1>
          <p className="page-intro">
            Complete the under-contract transaction intake for this client.
          </p>
        </div>

        {localDemoEnabled ? (
          <Notice tone="warning">
            Local demo mode — fixture client/deal/SISU IDs were applied because no
            clientId was provided.
          </Notice>
        ) : null}
        {loadError ? <Notice tone="warning">{loadError}</Notice> : null}
        {optionsError ? <Notice tone="warning">{optionsError}</Notice> : null}
        {transactionError ? (
          <div className="mb-4">
            <Notice tone="warning">{transactionError}</Notice>
          </div>
        ) : null}
        {submitStatus === "error" && submitMessage ? (
          <Notice tone="warning">{submitMessage}</Notice>
        ) : null}
        {loadingLead || loadingTransaction ? (
          <div className="form-loading">
            <Spinner className="h-4 w-4" />
            Loading pending form details...
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="divide-y divide-[var(--divider-color)]">
            <SectionCard title="Client Info">
              <Row>
                <div>
                  <TextInput
                    id="clientFirstName"
                    label="Client First Name"
                    value={formState.clientFirstName}
                    required
                    onChange={(event) =>
                      updateField("clientFirstName", event.target.value)
                    }
                  />
                  <FieldError message={errors.clientFirstName} />
                </div>
                <div>
                  <TextInput
                    id="clientLastName"
                    label="Client Last Name"
                    value={formState.clientLastName}
                    required
                    onChange={(event) =>
                      updateField("clientLastName", event.target.value)
                    }
                  />
                  <FieldError message={errors.clientLastName} />
                </div>
              </Row>
              <Row>
                <div>
                  <TextInput
                    id="clientPhone"
                    label="Client Phone Number"
                    type="tel"
                    value={formState.clientPhone}
                    required
                    onBlur={() =>
                      updateField(
                        "clientPhone",
                        formatPendingPhoneField(formState.clientPhone),
                      )
                    }
                    onChange={(event) =>
                      updateField("clientPhone", event.target.value)
                    }
                  />
                  <FieldError message={errors.clientPhone} />
                </div>
                <div>
                  <TextInput
                    id="clientEmail"
                    label="Client Email"
                    type="email"
                    value={formState.clientEmail}
                    required
                    onChange={(event) =>
                      updateField("clientEmail", event.target.value)
                    }
                  />
                  <FieldError message={errors.clientEmail} />
                </div>
              </Row>
              <div>
                <SelectInput
                  id="hasSecondaryClient"
                  label="Is there a secondary client?"
                  value={formState.hasSecondaryClient}
                  required
                  onChange={(event) =>
                    updateField("hasSecondaryClient", event.target.value)
                  }
                >
                  <option value="">Select...</option>
                  {hasSecondaryClientOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
                <FieldError message={errors.hasSecondaryClient} />
              </div>
              {isYesSelection(formState.hasSecondaryClient) ? (
                <div className="space-y-4 border-l-[var(--indent-border-width)] border-l-[var(--indent-border-color)] pl-[var(--indent-padding-left)]">
                  <div>
                    <TextInput
                      id="secondaryContact"
                      label="Secondary Client Name"
                      value={formState.secondaryContact}
                      required
                      onChange={(event) =>
                        updateField("secondaryContact", event.target.value)
                      }
                    />
                    <FieldError message={errors.secondaryContact} />
                  </div>
                  <Row>
                    <div>
                      <TextInput
                        id="secondaryContactPhone"
                        label="Secondary Client Phone"
                        type="tel"
                        value={formState.secondaryContactPhone}
                        required
                        onBlur={() =>
                          updateField(
                            "secondaryContactPhone",
                            formatPendingPhoneField(formState.secondaryContactPhone),
                          )
                        }
                        onChange={(event) =>
                          updateField("secondaryContactPhone", event.target.value)
                        }
                      />
                      <FieldError message={errors.secondaryContactPhone} />
                    </div>
                    <div>
                      <TextInput
                        id="secondaryContactEmail"
                        label="Secondary Client Email"
                        type="email"
                        value={formState.secondaryContactEmail}
                        required
                        onChange={(event) =>
                          updateField("secondaryContactEmail", event.target.value)
                        }
                      />
                      <FieldError message={errors.secondaryContactEmail} />
                    </div>
                  </Row>
                </div>
              ) : null}
              <Row>
                <div>
                  <TextInput
                    id="transactionAmount"
                    label="Transaction Amount"
                    inputMode="decimal"
                    value={formState.transactionAmount}
                    required
                    onBlur={() =>
                      updateField(
                        "transactionAmount",
                        formatCurrencyInput(formState.transactionAmount),
                      )
                    }
                    onChange={(event) =>
                      updateField("transactionAmount", event.target.value)
                    }
                  />
                  <FieldError message={errors.transactionAmount} />
                </div>
                <div>
                  <SelectInput
                    id="clientType"
                    label="Client Type"
                    value={formState.clientType}
                    required
                    onChange={(event) =>
                      updateField("clientType", event.target.value)
                    }
                  >
                    <option value="">Select type...</option>
                    {clientTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  <FieldError message={errors.clientType} />
                </div>
              </Row>
              <input
                type="hidden"
                name="transactionStage"
                value={formState.transactionStage}
              />
              <div className="form-address-grid">
                <div>
                  <TextInput
                    id="addressLine1"
                    label="Street Address"
                    value={formState.addressLine1}
                    required
                    onChange={(event) =>
                      updateField("addressLine1", event.target.value)
                    }
                  />
                  <FieldError message={errors.addressLine1} />
                </div>
                <TextInput
                  id="addressLine2"
                  label="Address Line 2"
                  value={formState.addressLine2}
                  onChange={(event) =>
                    updateField("addressLine2", event.target.value)
                  }
                />
              </div>
              <div className="form-grid-three">
                <div>
                  <TextInput
                    id="city"
                    label="City"
                    value={formState.city}
                    required
                    onChange={(event) => updateField("city", event.target.value)}
                  />
                  <FieldError message={errors.city} />
                </div>
                <div>
                  <SelectInput
                    id="state"
                    label="State/Province/Region"
                    value={formState.state}
                    required
                    onChange={(event) =>
                      updateField("state", event.target.value)
                    }
                  >
                    <option value="">Select state...</option>
                    {usStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </SelectInput>
                  <FieldError message={errors.state} />
                </div>
                <div>
                  <TextInput
                    id="postal"
                    label="Postal Code"
                    value={formState.postal}
                    required
                    onChange={(event) =>
                      updateField("postal", event.target.value)
                    }
                  />
                  <FieldError message={errors.postal} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Financing">
              <Row>
                <div>
                  <SelectInput
                    id="financingType"
                    label="Financing Type"
                    value={formState.financingType}
                    required
                    onChange={(event) =>
                      updateField("financingType", event.target.value)
                    }
                  >
                    <option value="">Select financing...</option>
                    {financingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  <FieldError message={errors.financingType} />
                </div>
                <div>
                  <SelectInput
                    id="mortgageCompany"
                    label="Mortgage Company"
                    value={formState.mortgageCompany}
                    required
                    onChange={(event) =>
                      updateField("mortgageCompany", event.target.value)
                    }
                  >
                    <option value="">Select mortgage company...</option>
                    {mortgageCompanyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  <FieldError message={errors.mortgageCompany} />
                </div>
              </Row>
              {showMortgageCompanyOther ? (
                <div className="space-y-4 border-l-[var(--indent-border-width)] border-l-[var(--indent-border-color)] pl-[var(--indent-padding-left)]">
                  <div>
                    <TextInput
                      id="mortgageCompanyName"
                      label="Mortgage Company Name"
                      value={formState.mortgageCompanyName}
                      required
                      onChange={(event) =>
                        updateField("mortgageCompanyName", event.target.value)
                      }
                    />
                    <FieldError message={errors.mortgageCompanyName} />
                  </div>
                  <Row>
                    <TextInput
                      id="loanOfficerName"
                      label="Loan Officer Name"
                      value={formState.loanOfficerName}
                      onChange={(event) =>
                        updateField("loanOfficerName", event.target.value)
                      }
                    />
                    <div>
                      <TextInput
                        id="loanOfficerEmail"
                        label="Loan Officer Email"
                        type="email"
                        value={formState.loanOfficerEmail}
                        onChange={(event) =>
                          updateField("loanOfficerEmail", event.target.value)
                        }
                      />
                      <FieldError message={errors.loanOfficerEmail} />
                    </div>
                  </Row>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Additional Details">
              <FieldGroup title="Timeline & Source">
                <Row>
                  <MuiDateField
                    id="underContractDate"
                    label="Under Contract Date"
                    value={formState.underContractDate}
                    required
                    error={errors.underContractDate}
                    onChange={(value) => updateField("underContractDate", value)}
                  />
                  <MuiDateField
                    id="forecastedClosedDate"
                    label="Forecasted Closed Date"
                    value={formState.forecastedClosedDate}
                    required
                    error={errors.forecastedClosedDate}
                    onChange={(value) => updateField("forecastedClosedDate", value)}
                  />
                </Row>
                <Row>
                  <div>
                    <SelectInput
                      id="outsideReferral"
                      label="Outside Referral/Rebate?"
                      value={formState.outsideReferral}
                      required
                      onChange={(event) =>
                        updateField("outsideReferral", event.target.value)
                      }
                    >
                      <option value="">Select...</option>
                      {outsideReferralOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                    <FieldError message={errors.outsideReferral} />
                  </div>
                  <div aria-hidden className="form-hidden-placeholder" />
                </Row>
                {isOutsideReferralSelected(formState.outsideReferral) ? (
                  <div className="space-y-4 border-l-[var(--indent-border-width)] border-l-[var(--indent-border-color)] pl-[var(--indent-padding-left)]">
                    <Row>
                      <div>
                        <TextInput
                          id="referralPercent"
                          label="Referral Percent"
                          inputMode="decimal"
                          value={formState.referralPercent}
                          onBlur={() =>
                            updateField(
                              "referralPercent",
                              formatPercentageInput(formState.referralPercent),
                            )
                          }
                          onChange={(event) =>
                            updateField(
                              "referralPercent",
                              limitPercentageInputPrecision(event.target.value),
                            )
                          }
                        />
                        <FieldError message={errors.referralPercent} />
                      </div>
                      <div>
                        <TextInput
                          id="referralAmount"
                          label="Referral Amount"
                          inputMode="decimal"
                          value={formState.referralAmount}
                          onBlur={() =>
                            updateField(
                              "referralAmount",
                              formatCurrencyInput(formState.referralAmount),
                            )
                          }
                          onChange={(event) =>
                            updateField("referralAmount", event.target.value)
                          }
                        />
                        <FieldError message={errors.referralAmount} />
                      </div>
                    </Row>
                    <div>
                      <TextInput
                        id="referralMailingAddress"
                        label="Referral Mailing Address"
                        value={formState.referralMailingAddress}
                        onChange={(event) =>
                          updateField("referralMailingAddress", event.target.value)
                        }
                      />
                      <FieldError message={errors.referralMailingAddress} />
                    </div>
                  </div>
                ) : null}
              </FieldGroup>

              <FieldGroup title="Cooperating Agent">
                <Row>
                  <div>
                    <TextInput
                      id="otherAgentName"
                      label="Coop Agent Name"
                      value={formState.otherAgentName}
                      required
                      onChange={(event) =>
                        updateField("otherAgentName", event.target.value)
                      }
                    />
                    <FieldError message={errors.otherAgentName} />
                  </div>
                  <div>
                    <TextInput
                      id="otherAgentPhone"
                      label="Coop Agent Phone"
                      type="tel"
                      value={formState.otherAgentPhone}
                      onBlur={() =>
                        updateField(
                          "otherAgentPhone",
                          formatPendingPhoneField(formState.otherAgentPhone),
                        )
                      }
                      onChange={(event) =>
                        updateField("otherAgentPhone", event.target.value)
                      }
                    />
                    <FieldError message={errors.otherAgentPhone} />
                  </div>
                </Row>
                <Row>
                  <div>
                    <TextInput
                      id="otherAgentEmail"
                      label="Coop Agent Email"
                      type="email"
                      value={formState.otherAgentEmail}
                      required
                      onChange={(event) =>
                        updateField("otherAgentEmail", event.target.value)
                      }
                    />
                    <FieldError message={errors.otherAgentEmail} />
                  </div>
                  <TextInput
                    id="otherAgentCompany"
                    label="Coop Agent Company"
                    value={formState.otherAgentCompany}
                    onChange={(event) =>
                      updateField("otherAgentCompany", event.target.value)
                    }
                  />
                </Row>
              </FieldGroup>

              {isSellerSelection(formState.clientType) ? (
                <FieldGroup title="Seller Terms">
                  <Row>
                    <div>
                      <SelectInput
                        id="dueDiligencePeriod"
                        label="Is there a due diligence period?"
                        value={formState.dueDiligencePeriod}
                        onChange={(event) =>
                          updateField("dueDiligencePeriod", event.target.value)
                        }
                      >
                        <option value="">Select...</option>
                        {dueDiligencePeriodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </SelectInput>
                    </div>
                    {isYesSelection(formState.dueDiligencePeriod) ? (
                      <MuiDateField
                        id="dueDiligenceDeadline"
                        label="Due Diligence Deadline"
                        value={formState.dueDiligenceDeadline}
                        required
                        error={errors.dueDiligenceDeadline}
                        onChange={(value) =>
                          updateField("dueDiligenceDeadline", value)
                        }
                      />
                    ) : (
                      <div />
                    )}
                  </Row>
                  <Row>
                    <SelectInput
                      id="contingencies"
                      label="Are there contingencies?"
                      value={formState.contingencies}
                      onChange={(event) =>
                        updateField("contingencies", event.target.value)
                      }
                    >
                      <option value="">Select...</option>
                      {contingenciesOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                    <div>
                      <TextInput
                        id="sellerCompensationPercent"
                        label="Seller Compensation to Buyer Broker (%)"
                        inputMode="decimal"
                        value={formState.sellerCompensationPercent}
                        onBlur={() =>
                          updateField(
                            "sellerCompensationPercent",
                            formatPercentageInput(formState.sellerCompensationPercent),
                          )
                        }
                        onChange={(event) =>
                          updateField(
                            "sellerCompensationPercent",
                            limitPercentageInputPrecision(event.target.value),
                          )
                        }
                      />
                      <FieldError message={errors.sellerCompensationPercent} />
                    </div>
                  </Row>
                  {isYesSelection(formState.contingencies) ? (
                    <div>
                      <TextAreaInput
                        id="contingencyDetails"
                        label="Contingencies"
                        value={formState.contingencyDetails}
                        required
                        onChange={(event) =>
                          updateField("contingencyDetails", event.target.value)
                        }
                      />
                      <FieldError message={errors.contingencyDetails} />
                    </div>
                  ) : null}
                </FieldGroup>
              ) : null}
            </SectionCard>
          </div>

          <div className="form-actions mt-6">
            <button
              type="submit"
              className={`app-button-press ${primaryButtonClassName} w-full`}
            >
              Submit
            </button>
          </div>
        </form>
      </main>
    </LocalizationProvider>
  );
}
