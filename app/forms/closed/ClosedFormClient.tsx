import { useNavigate } from "react-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Notice,
  Row,
  SectionCard,
  Spinner,
  TextAreaInput,
  TextInput,
  secondaryButtonClassName,
} from "@baraagency/components";
import { PrimaryButton } from "../_core/PrimaryButton";
import { FieldError } from "../_core/FieldError";
import { FormValidationSummary } from "../_core/FormValidationSummary";
import { fieldA11yProps } from "../_core/useFieldIds";

import { FormSelectInput } from "../_core/formSelectInput";
import type { SISUTeamFieldsCatalogResponse } from "@/app/types/sisu";
import type { TeamFieldCatalog } from "../_core/teamFieldOptions";
import { FormDatePickerField } from "../_core/formDatePickerField";
import { FormExpand } from "../_core/FormExpand";
import { getMaxFormDateTodayForPicker } from "../_core/formDateValidation";
import { formatCurrencyInput } from "../_core/formatUtils";
import {
  CLOSED_TRANSACTION_TYPE_FIELD_LABEL,
  getClosedSelectOptions,
} from "./closedTeamFieldOptions";
import {
  getInitialClosedFormState,
  isLeaseOrRentalSelection,
  validateClosedForm,
  type ClosedFieldErrors,
  type ClosedFormState,
} from "./closedFormUtils";
import {
  applyClosedSisuTransactionPrefill,
  shouldResolveClosedSisuTransactionPrefill,
} from "./closedSisuTransactionPrefill";
import {
  buildPostSubmissionHref,
  buildSubmittedAddress,
  getSubmittedFubDealId,
  getSubmittedSisuTransactionId,
  getSubmissionErrorMessage,
  getSubmissionSummaryEmailWarning,
  storeSubmittedDebugRecord,
} from "../_core/submissionUtils";
import { FormRouterBackLink } from "../_core/formRouterBackLink";
import { buildFormRouterReturnUrlFromSearchParams } from "../_core/formRouterUtils";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "../_core/formDraftCache";
import {
  clearDiscardedSisuTransactionId,
  removeSisuTransactionIdFromCurrentUrl,
  resolveSisuTransactionLookup,
  SISU_TRANSACTION_NOT_FOUND_WARNING,
} from "../_core/sisuTransactionLookup";

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

function getSingleSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function FieldGroup({ children }: { children: ReactNode }) {
  return (
    <div className="form-field-group">
      <div className="form-field-group-fields">{children}</div>
    </div>
  );
}

function buildRouterHref(
  state: ClosedFormState,
  params: Record<string, string | string[] | undefined>,
) {
  return buildFormRouterReturnUrlFromSearchParams(params, {
    personId: state.personId,
  });
}

export function ClosedFormClient({
  searchParams,
  localDemoEnabled = false,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  localDemoEnabled?: boolean;
}) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<ClosedFormState>(() =>
    getInitialClosedFormState({
      personId:
        getSingleSearchParam(searchParams, "clientId") ||
        getSingleSearchParam(searchParams, "personId"),
      agentId: getSingleSearchParam(searchParams, "agentId"),
      dealId: getSingleSearchParam(searchParams, "dealId"),
      sisuTransactionId: getSingleSearchParam(searchParams, "sisuTransactionId"),
    }),
  );
  const [errors, setErrors] = useState<ClosedFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [teamFields, setTeamFields] = useState<TeamFieldCatalog>({});
  const [loadingTransaction, setLoadingTransaction] = useState(
    shouldResolveClosedSisuTransactionPrefill(
      getSingleSearchParam(searchParams, "sisuTransactionId"),
    ),
  );
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "error">(
    "idle",
  );
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const transactionTypeOptions = useMemo(
    () => getClosedSelectOptions(teamFields).transactionTypeOptions,
    [teamFields],
  );
  const showLeaseRentalFields = isLeaseOrRentalSelection(
    formState.transactionType,
    transactionTypeOptions,
  );
  const settlementDateMax = useMemo(() => getMaxFormDateTodayForPicker(), []);

  useEffect(() => {
    const personId = formState.personId.trim();
    if (!personId) {
      return;
    }

    setFormState((current) => {
      const cachedDraft = readFormDraft<ClosedFormState>("closed", personId);
      if (!cachedDraft) {
        return current;
      }

      const nextState = applyPreviousSubmissionFormData(current, cachedDraft);
      const changed = (Object.keys(nextState) as Array<keyof ClosedFormState>).some(
        (field) => nextState[field] !== current[field],
      );

      return changed ? nextState : current;
    });
  }, [formState.personId]);

  const updateField = useCallback(
    <K extends keyof ClosedFormState>(field: K, value: ClosedFormState[K]) => {
      setFormState((current) => {
        const next = { ...current, [field]: value };

        if (
          field === "transactionType" &&
          !isLeaseOrRentalSelection(String(value), transactionTypeOptions)
        ) {
          next.securityDeposit = "";
          next.monthlyRent = "";
        }

        writeFormDraft("closed", next.personId, next);
        return next;
      });
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        if (field === "transactionType") {
          delete next.securityDeposit;
          delete next.monthlyRent;
        }
        return next;
      });
    },
    [transactionTypeOptions],
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadOptions = async () => {
      try {
        setOptionsError(null);
        const response = await fetch("/api/sisu/team-fields", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            `Unable to load SISU team fields (HTTP ${response.status}). Using fallbacks.`,
          );
        }
        const payload = (await response.json()) as SISUTeamFieldsCatalogResponse;
        setTeamFields(payload.fields ?? {});
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setOptionsError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load SISU team fields. Using fallbacks.",
        );
      }
    };

    void loadOptions();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!shouldResolveClosedSisuTransactionPrefill(formState.sisuTransactionId)) {
      setLoadingTransaction(false);
      return;
    }

    const controller = new AbortController();

    const loadTransaction = async () => {
      try {
        setLoadingTransaction(true);
        setTransactionError(null);
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
            applyClosedSisuTransactionPrefill(current, result.transaction!),
          );
        }
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
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

  const handleSubmit = useCallback(async () => {
    const nextErrors = validateClosedForm(formState, { transactionTypeOptions });
    if (!formState.personId) {
      nextErrors.personId = "A FUB person id is required.";
    }
    setSubmitAttempted(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitStatus("submitting");
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/forms/closed/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getSubmissionErrorMessage(payload, "Unable to submit the Closed form."),
        );
      }

      const debugKey = storeSubmittedDebugRecord("closed", {
        deal: payload.deal,
        transaction: payload.transaction,
      });

      clearFormDraft("closed", formState.personId);
      navigate(
        buildPostSubmissionHref({
          formType: "closed",
          personId: formState.personId,
          agentId: formState.agentId,
          dealId: getSubmittedFubDealId(payload) || formState.dealId,
          address: buildSubmittedAddress(
            formState.addressLine1,
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
          : "Unable to submit the Closed form.",
      );
    }
  }, [formState, transactionTypeOptions, navigate]);

  if (submitStatus === "submitting") {
    return (
      <main id="main-content" className="page-form">
        <SectionCard title="Submission Status">
          <div className="space-y-4">
            <Notice tone="warning">
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Submitting Closed form...
              </span>
            </Notice>
            <FormRouterBackLink
              href={buildRouterHref(formState, searchParams)}
              className={secondaryButtonClassName}
            />
          </div>
        </SectionCard>
      </main>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <main id="main-content" className="page-form">
        <div className="mb-4">
          <FormRouterBackLink
            href={buildRouterHref(formState, searchParams)}
            className={`${secondaryButtonClassName} px-4 py-2 text-xs`}
          />
        </div>
        <title>Closed</title>
        <div className="mb-6">
          <h1 className="page-title mb-0 text-balance">Closed</h1>
          <p className="page-intro text-pretty">
            Capture closed transaction details for this lead.
          </p>
        </div>

        {localDemoEnabled ? (
          <Notice tone="warning">
            Demo mode — fixture client/deal/SISU IDs were applied because no
            clientId was provided.
          </Notice>
        ) : null}
        {optionsError ? <Notice tone="warning">{optionsError}</Notice> : null}
        {transactionError ? (
          <div className="mb-4">
            <Notice tone="warning">{transactionError}</Notice>
          </div>
        ) : null}
        {submitStatus === "error" && submitMessage ? (
          <Notice tone="warning">{submitMessage}</Notice>
        ) : null}
        {loadingTransaction ? (
          <div className="form-loading">
            <Spinner className="h-4 w-4" />
            Loading closed form details...
          </div>
        ) : null}

        <FormValidationSummary errors={errors} show={submitAttempted} />
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div>
            <SectionCard title="Transaction Data">
              <FieldGroup>
                <div>
                  <FormSelectInput
                    id="transactionType"
                    label={CLOSED_TRANSACTION_TYPE_FIELD_LABEL}
                    value={formState.transactionType}
                    required
                    onChange={(event) =>
                      updateField("transactionType", event.target.value)
                    }
                    error={errors.transactionType}
                  >
                    <option value="">Select transaction type...</option>
                    {transactionTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FormSelectInput>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div>
                  <TextInput
                    id="addressLine1"
                      {...fieldA11yProps('addressLine1', errors.addressLine1)}
                    label="Address"
                    value={formState.addressLine1}
                    required
                    onChange={(event) =>
                      updateField("addressLine1", event.target.value)
                    }
                  />
                  <FieldError id={`addressLine1-error`} message={errors.addressLine1} />
                </div>
                <div className="form-grid-three">
                  <div>
                    <TextInput
                      id="city"
                      {...fieldA11yProps('city', errors.city)}
                      label="City"
                      value={formState.city}
                      required
                      onChange={(event) => updateField("city", event.target.value)}
                    />
                    <FieldError id={`city-error`} message={errors.city} />
                  </div>
                  <div>
                    <FormSelectInput
                      id="state"
                      label="State"
                      value={formState.state}
                      required
                      onChange={(event) => updateField("state", event.target.value)}
                    error={errors.state}
                    >
                      <option value="">Select state...</option>
                      {usStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </FormSelectInput>
                  </div>
                  <div>
                    <TextInput
                      id="postal"
                      {...fieldA11yProps('postal', errors.postal)}
                      label="Zip"
                      value={formState.postal}
                      required
                      onChange={(event) => updateField("postal", event.target.value)}
                    />
                    <FieldError id={`postal-error`} message={errors.postal} />
                  </div>
                </div>
              </FieldGroup>

              <FieldGroup>
                <Row>
                  <div>
                    <TextInput
                      id="transactionAmount"
                      {...fieldA11yProps('transactionAmount', errors.transactionAmount)}
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
                    <FieldError id={`transactionAmount-error`} message={errors.transactionAmount} />
                  </div>
                  <div>
                    <TextInput
                      id="totalCommissionGci"
                      {...fieldA11yProps('totalCommissionGci', errors.totalCommissionGci)}
                      label="Total Commission GCI"
                      inputMode="decimal"
                      value={formState.totalCommissionGci}
                      required
                      onBlur={() =>
                        updateField(
                          "totalCommissionGci",
                          formatCurrencyInput(formState.totalCommissionGci),
                        )
                      }
                      onChange={(event) =>
                        updateField("totalCommissionGci", event.target.value)
                      }
                    />
                    <FieldError id={`totalCommissionGci-error`} message={errors.totalCommissionGci} />
                  </div>
                </Row>
                {showLeaseRentalFields ? (
                  <FormExpand>
                    <Row>
                      <div>
                        <TextInput
                          id="securityDeposit"
                      {...fieldA11yProps('securityDeposit', errors.securityDeposit)}
                          label="Security Deposit"
                          inputMode="decimal"
                          value={formState.securityDeposit}
                          required
                          onBlur={() =>
                            updateField(
                              "securityDeposit",
                              formatCurrencyInput(formState.securityDeposit),
                            )
                          }
                          onChange={(event) =>
                            updateField("securityDeposit", event.target.value)
                          }
                        />
                        <FieldError id={`securityDeposit-error`} message={errors.securityDeposit} />
                      </div>
                      <div>
                        <TextInput
                          id="monthlyRent"
                      {...fieldA11yProps('monthlyRent', errors.monthlyRent)}
                          label="Monthly Rent"
                          inputMode="decimal"
                          value={formState.monthlyRent}
                          required
                          onBlur={() =>
                            updateField(
                              "monthlyRent",
                              formatCurrencyInput(formState.monthlyRent),
                            )
                          }
                          onChange={(event) =>
                            updateField("monthlyRent", event.target.value)
                          }
                        />
                        <FieldError id={`monthlyRent-error`} message={errors.monthlyRent} />
                      </div>
                    </Row>
                  </FormExpand>
                ) : null}
              </FieldGroup>
            </SectionCard>

            <SectionCard title="Transaction Dates">
              <div>
                <FormDatePickerField
                  id="settlementDate"
                  label="Closed Date"
                  value={formState.settlementDate}
                  required
                  maxDate={settlementDateMax}
                  error={errors.settlementDate}
                  onChange={(value) => updateField("settlementDate", value)}
                />
              </div>
              <div>
                <TextAreaInput
                  id="tcMarketingNotes"
                  label="Notes"
                  value={formState.tcMarketingNotes}
                  onChange={(event) =>
                    updateField("tcMarketingNotes", event.target.value)
                  }
                />
              </div>
            </SectionCard>
          </div>

          <div className="form-actions mt-6">
            <PrimaryButton type="submit" className="w-full">
              Submit
            </PrimaryButton>
          </div>
        </form>
      </main>
    </LocalizationProvider>
  );
}
