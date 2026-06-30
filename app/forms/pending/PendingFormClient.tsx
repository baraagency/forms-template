"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { SvgIcon, type SvgIconProps } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
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
  formatDatePickerValue,
  formatPercentageInput,
  limitPercentageInputPrecision,
} from "../_core/formatUtils";
import type { TeamFieldCatalog } from "../_core/teamFieldOptions";
import {
  applyPendingPersonPrefill,
  applyPendingSisuTransactionPrefill,
  defaultPendingIsaSetFromIsaName,
  formatPendingPhoneField,
  getInitialPendingFormState,
  isOutsideReferralSelected,
  pendingDatePickerBehaviorProps,
  validatePendingForm,
  type PendingFieldErrors,
  type PendingFormState,
} from "./pendingFormUtils";
import {
  getPendingSelectOptions,
  isNoSelection,
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

type TeamAgentOption = SelectOption & {
  email: string;
  isIsa: boolean;
};

type VendorsResponse = {
  vendors: {
    titleCompany: SISUDropdownOption[];
    mortgageCompany: SISUDropdownOption[];
    attorney?: SISUDropdownOption[];
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

const datePickerTextFieldSx = {
  mt: "0.5rem",
  width: "100%",
  "& .MuiPickersInputBase-root": {
    minHeight: "42px",
    height: "42px",
    borderRadius: "var(--btn-radius)",
    backgroundColor: "var(--card-bg)",
    color: "var(--foreground)",
    boxShadow: "var(--field-shadow)",
    fontFamily: "var(--font-family), Arial, sans-serif",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    letterSpacing: 0,
    padding: "0 6px 0 12px",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  },
  "& .MuiPickersOutlinedInput-notchedOutline": {
    borderColor: "var(--divider-color)",
  },
  "& .MuiPickersInputBase-root:hover .MuiPickersOutlinedInput-notchedOutline": {
    borderColor: "var(--field-hover-border)",
  },
  "& .MuiPickersInputBase-root.Mui-focused": {
    boxShadow:
      "var(--field-shadow), 0 0 0 4px color-mix(in srgb, var(--btn-outline-color) 15%, transparent)",
  },
  "& .MuiPickersInputBase-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
    {
      borderColor: "var(--btn-outline-border)",
      borderWidth: "1px",
    },
  "& .MuiPickersInputBase-root.Mui-error .MuiPickersOutlinedInput-notchedOutline":
    {
      borderColor: "var(--error-color)",
    },
  "& .MuiPickersSectionList-root": {
    minHeight: "40px",
    width: "auto",
    padding: 0,
    alignItems: "center",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  "& .MuiPickersSectionList-sectionContent": {
    color: "var(--foreground)",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    letterSpacing: 0,
  },
  "& .MuiInputAdornment-root": {
    height: "100%",
    marginLeft: "4px",
  },
  "& .MuiIconButton-root": {
    width: "32px",
    height: "32px",
    marginRight: "-2px",
    padding: "6px",
    color: "var(--icon-muted)",
  },
  "& .MuiIconButton-root:hover": {
    color: "var(--btn-outline-color)",
    backgroundColor:
      "color-mix(in srgb, var(--btn-outline-color) 8%, transparent)",
  },
  "& .MuiSvgIcon-root": {
    fontSize: "1.1rem",
  },
};

const datePickerPaperSx = {
  mt: 1,
  borderRadius: "var(--card-radius)",
  border: "1px solid var(--divider-color)",
  backgroundColor: "var(--card-bg)",
  color: "var(--foreground)",
  boxShadow: "var(--card-shadow)",
  maxHeight: "calc(100dvh - 16px)",
  maxWidth: "calc(100vw - 16px)",
  overflow: "auto",
  transformOrigin: "top center",
  "& .MuiDateCalendar-root": {
    width: "min(320px, calc(100vw - 24px))",
    maxHeight: "calc(100dvh - 24px)",
  },
  "& .MuiPickersCalendarHeader-label": {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--foreground)",
  },
  "& .MuiPickersArrowSwitcher-button": {
    color: "var(--btn-outline-color)",
  },
  "& .MuiDayCalendar-weekDayLabel": {
    color: "var(--body-color)",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  "& .MuiPickersDay-root": {
    borderRadius: "var(--btn-radius)",
    color: "var(--foreground)",
    fontSize: "0.82rem",
  },
  "& .MuiPickersDay-root:hover": {
    backgroundColor:
      "color-mix(in srgb, var(--btn-outline-color) 8%, transparent)",
  },
  "& .MuiPickersDay-root.Mui-selected": {
    backgroundColor: "var(--highlight-color)",
    color: "var(--btn-primary-color)",
  },
  "& .MuiPickersDay-root.Mui-selected:hover, & .MuiPickersDay-root.Mui-selected:focus":
    {
      backgroundColor: "var(--brand-cyan-dark)",
    },
  "@media (max-height: 540px)": {
    "& .MuiDateCalendar-root": {
      width: "min(300px, calc(100vw - 24px))",
    },
    "& .MuiPickersCalendarHeader-root": {
      minHeight: "34px",
      marginTop: "2px",
      marginBottom: "2px",
      paddingLeft: "8px",
      paddingRight: "8px",
    },
    "& .MuiDayCalendar-weekDayLabel": {
      width: "32px",
      height: "24px",
      fontSize: "0.7rem",
    },
    "& .MuiPickersDay-root": {
      width: "32px",
      height: "32px",
      margin: "0 1px",
      fontSize: "0.76rem",
    },
    "& .MuiPickersSlideTransition-root": {
      minHeight: "198px",
    },
    "& .MuiYearCalendar-root, & .MuiMonthCalendar-root": {
      maxHeight: "calc(100dvh - 80px)",
    },
  },
};

function normalizeSisuOptions(options: SISUDropdownOption[]): SelectOption[] {
  return options.map((option) => ({
    value: String(option.value),
    label: option.label,
  }));
}

function isOtherVendorSelection(value: string, options: SelectOption[]): boolean {
  return (
    isOtherSelection(value) ||
    options.some(
      (option) =>
        option.value === value &&
        (isOtherSelection(option.value) || isOtherSelection(option.label)),
    )
  );
}

function getSingleSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs font-medium text-[var(--error-color)]">{message}</p>
  ) : null;
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="border-b border-[var(--divider-color)] pb-2 text-xs font-semibold uppercase text-[var(--body-color)]">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function CalendarIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        d="M7 3.75v3M17 3.75v3M4.75 9h14.5M7 5.25h10A2.75 2.75 0 0 1 19.75 8v9A2.75 2.75 0 0 1 17 19.75H7A2.75 2.75 0 0 1 4.25 17V8A2.75 2.75 0 0 1 7 5.25Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M8 12.25h.01M12 12.25h.01M16 12.25h.01M8 15.75h.01M12 15.75h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </SvgIcon>
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
  const pickerValue = value ? dayjs(value) : null;

  return (
    <div>
      <Field label={label} htmlFor={id} required={required}>
        <DatePicker
          value={pickerValue}
          onChange={(nextValue) => onChange(formatDatePickerValue(nextValue))}
          format="MM/DD/YYYY"
          {...pendingDatePickerBehaviorProps}
          slots={{ openPickerIcon: CalendarIcon }}
          slotProps={{
            textField: {
              id,
              required,
              fullWidth: true,
              error: Boolean(error),
              size: "small",
              sx: datePickerTextFieldSx,
            },
            openPickerButton: {
              "aria-label": `Choose ${label}`,
              edge: "end",
              size: "small",
            },
            desktopPaper: {
              sx: datePickerPaperSx,
            },
            mobilePaper: {
              sx: datePickerPaperSx,
            },
          }}
        />
      </Field>
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
}: {
  searchParams: Record<string, string | string[] | undefined>;
  previousSubmissionFormData?: JsonValue | null;
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
  const [agents, setAgents] = useState<TeamAgentOption[]>([]);
  const [attorneyVendors, setAttorneyVendors] = useState<SelectOption[]>([]);
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
    jcreOfficeOptions,
    jcreLeadTransactionOptions,
    plrAcknowledgementOptions,
    closingDepartmentOptions,
    hasSecondaryClientOptions,
    onTeamOptions,
    isaSetOptions,
    pastClientOptions,
    outsideReferralOptions,
    financingOptions,
    dueDiligencePeriodOptions,
    contingenciesOptions,
    multipleTransactionsOptions,
    goodFundContributionOptions,
    commissionDeliveryOptions,
  } = getPendingSelectOptions(teamFields);
  const isaOptions = agents;
  const closingAttorneyOptions = prioritizeSpecialVendorOptions(attorneyVendors);
  const mortgageCompanyOptions = prioritizeSpecialVendorOptions(mortgageVendors);
  const showClosingAttorneyOther = isOtherVendorSelection(
    formState.closingAttorney,
    closingAttorneyOptions,
  );
  const showMortgageCompanyOther = isOtherVendorSelection(
    formState.mortgageCompany,
    mortgageCompanyOptions,
  );
  const showIsaName = isYesSelection(formState.isaSet);
  const showTeamFields = isYesSelection(formState.onTeam);

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
        const [teamFieldsResponse, agentsResponse, vendorsResponse] =
          await Promise.all([
            fetch("/api/sisu/team-fields", { signal: controller.signal }),
            fetch("/api/sisu/team-agents?role_filter=ISISA", {
              signal: controller.signal,
            }),
            fetch("/api/sisu/vendors", { signal: controller.signal }),
          ]);

        if (!teamFieldsResponse.ok) {
          throw new Error(
            `Unable to load SISU team fields (HTTP ${teamFieldsResponse.status}).`,
          );
        }
        if (!agentsResponse.ok) {
          throw new Error(
            `Unable to load SISU team agents (HTTP ${agentsResponse.status}).`,
          );
        }
        if (!vendorsResponse.ok) {
          throw new Error(
            `Unable to load SISU vendors (HTTP ${vendorsResponse.status}).`,
          );
        }

        const teamFieldsPayload =
          (await teamFieldsResponse.json()) as SISUTeamFieldsCatalogResponse;
        const agentsPayload = (await agentsResponse.json()) as {
          agents: TeamAgentOption[];
        };
        const vendorsPayload = (await vendorsResponse.json()) as VendorsResponse;

        setTeamFields(teamFieldsPayload.fields ?? {});
        setAgents(agentsPayload.agents ?? []);
        setAttorneyVendors(
          normalizeSisuOptions(
            vendorsPayload.vendors.attorney ?? vendorsPayload.vendors.titleCompany,
          ),
        );
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
        if (field === "isaName" && value.trim() && !nextState.isaSet.trim()) {
          nextState.isaSet = "yes";
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
          <h1 className="page-title mb-0">Pending</h1>
        </div>

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

            <SectionCard title="Secondary Information">
              <Row>
                <TextInput
                  id="agent2"
                  label="Secondary Agent"
                  value={formState.agent2}
                  onChange={(event) => updateField("agent2", event.target.value)}
                />
                <div>
                  <TextInput
                    id="agent2Percent"
                    label="Secondary Agent %"
                    inputMode="decimal"
                    value={formState.agent2Percent}
                    onBlur={() =>
                      updateField(
                        "agent2Percent",
                        formatPercentageInput(formState.agent2Percent),
                      )
                    }
                    onChange={(event) =>
                      updateField(
                        "agent2Percent",
                        limitPercentageInputPrecision(event.target.value),
                      )
                    }
                  />
                  <FieldError message={errors.agent2Percent} />
                </div>
              </Row>
              <Row>
                <div>
                  <SelectInput
                    id="jcreOffice"
                    label="JCRE Office"
                    value={formState.jcreOffice}
                    required
                    onChange={(event) =>
                      updateField("jcreOffice", event.target.value)
                    }
                  >
                    <option value="">Select office...</option>
                    {jcreOfficeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  <FieldError message={errors.jcreOffice} />
                </div>
                <div>
                  <SelectInput
                    id="jcreLeadTransaction"
                    label="JCRE Lead Transaction"
                    value={formState.jcreLeadTransaction}
                    required
                    onChange={(event) =>
                      updateField("jcreLeadTransaction", event.target.value)
                    }
                  >
                    <option value="">Select...</option>
                    {jcreLeadTransactionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  <FieldError message={errors.jcreLeadTransaction} />
                </div>
              </Row>
              {isNoSelection(formState.jcreLeadTransaction) ? (
                <div>
                  <SelectInput
                    id="plrAcknowledgement"
                    label="Do you understand that PLR's need to be FULLY EXECUTED within 48 hours of ratification and prior to a listing going live or this will be processed as a company deal?"
                    value={formState.plrAcknowledgement}
                    required
                    onChange={(event) =>
                      updateField("plrAcknowledgement", event.target.value)
                    }
                  >
                    <option value="">Select...</option>
                    {plrAcknowledgementOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  <FieldError message={errors.plrAcknowledgement} />
                </div>
              ) : null}
              <Row>
                <SelectInput
                  id="closingDepartment"
                  label="CAP AGENTS ONLY: If personal, using the Closing Department?"
                  value={formState.closingDepartment}
                  onChange={(event) =>
                    updateField("closingDepartment", event.target.value)
                  }
                >
                  <option value="">Select...</option>
                  {closingDepartmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </Row>
              <Row>
                <div>
                  <SelectInput
                    id="onTeam"
                    label="Are you on a Team within JCRE?"
                    value={formState.onTeam}
                    required
                    onChange={(event) => updateField("onTeam", event.target.value)}
                  >
                    <option value="">Select...</option>
                    {onTeamOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  <FieldError message={errors.onTeam} />
                </div>
                {showTeamFields ? (
                  <TextInput
                    id="teamLeaderName"
                    label="Team Leader Name"
                    value={formState.teamLeaderName}
                    onChange={(event) =>
                      updateField("teamLeaderName", event.target.value)
                    }
                  />
                ) : null}
              </Row>
              {showTeamFields ? (
                <TextAreaInput
                  id="teamPayNotes"
                  label="For Teams ONLY: Any different pay than what is on the spreadsheet? or special notes to Accounting?"
                  value={formState.teamPayNotes}
                  onChange={(event) =>
                    updateField("teamPayNotes", event.target.value)
                  }
                />
              ) : null}
            </SectionCard>

            <SectionCard title="Closing Attorney & Financing">
              <div className="form-grid-three">
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
                    id="closingAttorney"
                    label="JCRE Closing Attorney"
                    value={formState.closingAttorney}
                    required
                    onChange={(event) =>
                      updateField("closingAttorney", event.target.value)
                    }
                  >
                    <option value="">Select attorney...</option>
                    {closingAttorneyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  <FieldError message={errors.closingAttorney} />
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
              </div>
              {showClosingAttorneyOther || showMortgageCompanyOther ? (
                <Row>
                  {showClosingAttorneyOther ? (
                    <div className="space-y-4 border-l-[var(--indent-border-width)] border-l-[var(--indent-border-color)] pl-[var(--indent-padding-left)]">
                      <div>
                        <TextInput
                          id="closingAttorneyOther"
                          label="Closing Attorney Other"
                          value={formState.closingAttorneyOther}
                          required
                          onChange={(event) =>
                            updateField("closingAttorneyOther", event.target.value)
                          }
                        />
                        <FieldError message={errors.closingAttorneyOther} />
                      </div>
                      <Row>
                        <div>
                          <TextInput
                            id="closingAttorneyPhone"
                            label="Closing Attorney Phone"
                            type="tel"
                            value={formState.closingAttorneyPhone}
                            onBlur={() =>
                              updateField(
                                "closingAttorneyPhone",
                                formatPendingPhoneField(formState.closingAttorneyPhone),
                              )
                            }
                            onChange={(event) =>
                              updateField("closingAttorneyPhone", event.target.value)
                            }
                          />
                          <FieldError message={errors.closingAttorneyPhone} />
                        </div>
                        <div>
                          <TextInput
                            id="closingAttorneyEmail"
                            label="Closing Attorney Email"
                            type="email"
                            value={formState.closingAttorneyEmail}
                            onChange={(event) =>
                              updateField("closingAttorneyEmail", event.target.value)
                            }
                          />
                          <FieldError message={errors.closingAttorneyEmail} />
                        </div>
                      </Row>
                    </div>
                  ) : (
                    <div />
                  )}
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
                </Row>
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
                      id="isaSet"
                      label="ISA Set"
                      value={formState.isaSet}
                      required
                      onChange={(event) => updateField("isaSet", event.target.value)}
                    >
                      <option value="">Select...</option>
                      {isaSetOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                    <FieldError message={errors.isaSet} />
                  </div>
                  <div
                    aria-hidden={!showIsaName}
                    className={showIsaName ? undefined : "form-hidden-placeholder"}
                  >
                    <SelectInput
                      id="isaName"
                      label="Call Partner/ISA Name"
                      value={formState.isaName}
                      required={showIsaName}
                      disabled={!showIsaName}
                      onChange={(event) =>
                        updateField("isaName", event.target.value)
                      }
                    >
                      <option value="">Select ISA...</option>
                      {isaOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                    <FieldError message={showIsaName ? errors.isaName : undefined} />
                  </div>
                </Row>
                <Row>
                  <div>
                    <SelectInput
                      id="pastClient"
                      label="Was this a JCRE past client?"
                      value={formState.pastClient}
                      required
                      onChange={(event) =>
                        updateField("pastClient", event.target.value)
                      }
                    >
                      <option value="">Select...</option>
                      {pastClientOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                    <FieldError message={errors.pastClient} />
                  </div>
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
                      label="Other Agent Name"
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
                      label="Other Agent Phone"
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
                      label="Other Agent Email"
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
                    label="Other Agent Company"
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

              <FieldGroup title="Commission & Notes">
                <Row>
                  <div>
                    <SelectInput
                      id="multipleTransactions"
                      label="Is the client doing multiple transactions with us?"
                      value={formState.multipleTransactions}
                      required
                      onChange={(event) =>
                        updateField("multipleTransactions", event.target.value)
                      }
                    >
                      <option value="">Select...</option>
                      {multipleTransactionsOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                    <FieldError message={errors.multipleTransactions} />
                  </div>
                  <div>
                    <SelectInput
                      id="goodFundContribution"
                      label="Contribute $30.00 to the 1% for Good Fund?"
                      value={formState.goodFundContribution}
                      required
                      onChange={(event) =>
                        updateField("goodFundContribution", event.target.value)
                      }
                    >
                      <option value="">Select...</option>
                      {goodFundContributionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                    <FieldError message={errors.goodFundContribution} />
                  </div>
                </Row>
                {isYesSelection(formState.multipleTransactions) ? (
                  <div>
                    <TextAreaInput
                      id="otherAddresses"
                      label="List the other address"
                      value={formState.otherAddresses}
                      onChange={(event) =>
                        updateField("otherAddresses", event.target.value)
                      }
                    />
                    <FieldError message={errors.otherAddresses} />
                  </div>
                ) : null}
                <Row>
                  <div>
                    <SelectInput
                      id="commissionDelivery"
                      label="How would you like the commission delivered to LPT?"
                      value={formState.commissionDelivery}
                      required
                      onChange={(event) =>
                        updateField("commissionDelivery", event.target.value)
                      }
                    >
                      <option value="">Select delivery...</option>
                      {commissionDeliveryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                    <FieldError message={errors.commissionDelivery} />
                  </div>
                  <div>
                    <TextInput
                      id="grossCommissionTotal"
                      label="JCRE Gross Commission Total ($)"
                      inputMode="decimal"
                      value={formState.grossCommissionTotal}
                      required
                      onBlur={() =>
                        updateField(
                          "grossCommissionTotal",
                          formatCurrencyInput(formState.grossCommissionTotal),
                        )
                      }
                      onChange={(event) =>
                        updateField("grossCommissionTotal", event.target.value)
                      }
                    />
                    <FieldError message={errors.grossCommissionTotal} />
                  </div>
                </Row>
                <TextAreaInput
                  id="closingDepartmentNotes"
                  label="Is there anything else the Closing/Commission Department should know about this client that would be helpful?"
                  value={formState.closingDepartmentNotes}
                  onChange={(event) =>
                    updateField("closingDepartmentNotes", event.target.value)
                  }
                />
              </FieldGroup>
            </SectionCard>
          </div>

          <div className="form-actions mt-6">
            <button type="submit" className={`${primaryButtonClassName} w-full`}>
              Submit
            </button>
          </div>
        </form>
      </main>
    </LocalizationProvider>
  );
}
