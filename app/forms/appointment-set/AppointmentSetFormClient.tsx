import { useNavigate } from "react-router";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Divider,
  Notice,
  Row,
  SectionCard,
  Spinner,
  TextAreaInput,
  TextInput,
  secondaryButtonClassName,
} from "../_core/ui";
import { PrimaryButton } from "../_core/PrimaryButton";
import { FieldError } from "../_core/FieldError";
import { FormValidationSummary } from "../_core/FormValidationSummary";
import { fieldA11yProps } from "../_core/useFieldIds";

import { CommunicationTextInput } from "../_core/CommunicationTextInput";
import { FormSelectInput } from "../_core/formSelectInput";
import type { FUBPerson } from "@/app/types/fub";
import type { JsonValue } from "@/app/types/storage";
import { FormDatePickerField } from "../_core/formDatePickerField";
import { FormExpand } from "../_core/FormExpand";
import { FormTimePickerField } from "../_core/formTimePickerField";
import { formatPhoneInput } from "../_core/formatUtils";
import {
  APPOINTMENT_LOCATION_OPTIONS,
  APPT_SET_BY_OPTIONS,
  DEFAULT_APPOINTMENT_TYPE_OPTIONS,
  LEAD_TYPE_OPTIONS,
  applyAppointmentSetPersonPrefill,
  applyAppointmentSetPreviousSubmissionPrefill,
  applyAppointmentSetSisuTransactionPrefill,
  addHoursToFormTime,
  isIsaApptSetBy,
  isOtherAddressLocation,
  isOsaApptSetBy,
  getInitialAppointmentSetFormState,
  resolveAppointmentSetLocation,
  validateAppointmentSetForm,
  type AppointmentSetFieldErrors,
  type AppointmentSetFormState,
  type FubAppointmentTypeOption,
} from "./appointmentSetFormUtils";
import {
  buildPostSubmissionHref,
  getSubmittedFubDealId,
  getSubmittedFubDealName,
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
import { FormRouterBackLink } from "../_core/formRouterBackLink";
import {
  buildFormRouterReturnUrlFromSearchParams,
  type AgentOption,
} from "../_core/formRouterUtils";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "../_core/formDraftCache";

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

type SelectOption = {
  value: string;
  label: string;
};

type TeamAgentOption = SelectOption & {
  email: string;
  isIsa: boolean;
};

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

function toSelectOptions(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

function buildRouterHref(
  state: AppointmentSetFormState,
  params: Record<string, string | string[] | undefined>,
) {
  return buildFormRouterReturnUrlFromSearchParams(params, {
    personId: state.personId,
  });
}

export function AppointmentSetFormClient({
  searchParams,
  previousSubmissionFormData = null,
  localDemoEnabled = false,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  previousSubmissionFormData?: JsonValue | null;
  localDemoEnabled?: boolean;
}) {
  const navigate = useNavigate();
  const routedAgentName = getSingleSearchParam(searchParams, "agentName");
  const previousSubmissionFormDataRef = useRef<JsonValue | null>(
    previousSubmissionFormData ?? null,
  );

  const applyCachedPreviousSubmission = useCallback(
    (current: AppointmentSetFormState) =>
      applyAppointmentSetPreviousSubmissionPrefill(
        current,
        previousSubmissionFormDataRef.current,
      ),
    [],
  );

  const [formState, setFormState] = useState<AppointmentSetFormState>(() =>
    applyAppointmentSetPreviousSubmissionPrefill(
      getInitialAppointmentSetFormState({
        personId:
          getSingleSearchParam(searchParams, "clientId") ||
          getSingleSearchParam(searchParams, "personId"),
        agentId: getSingleSearchParam(searchParams, "agentId"),
        clientName: getSingleSearchParam(searchParams, "clientName"),
        dealId: getSingleSearchParam(searchParams, "dealId"),
        sisuTransactionId: getSingleSearchParam(searchParams, "sisuTransactionId"),
      }),
      previousSubmissionFormData,
    ),
  );
  const [errors, setErrors] = useState<AppointmentSetFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isaOptions, setIsaOptions] = useState<SelectOption[]>([]);
  const [osaOptions, setOsaOptions] = useState<SelectOption[]>([]);
  const [appointmentTypeOptions, setAppointmentTypeOptions] = useState<
    FubAppointmentTypeOption[]
  >([...DEFAULT_APPOINTMENT_TYPE_OPTIONS]);
  const [isaOptionsUnavailable, setIsaOptionsUnavailable] = useState(false);
  const [osaOptionsUnavailable, setOsaOptionsUnavailable] = useState(false);
  const [loadingLead, setLoadingLead] = useState(Boolean(formState.personId));
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "complete" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const showAssignedIsa = isIsaApptSetBy(formState.apptSetBy);
  const showAssignedOsa = isOsaApptSetBy(formState.apptSetBy);
  const showOtherAddress = isOtherAddressLocation(formState.appointmentLocation);

  useEffect(() => {
    const personId = formState.personId.trim();
    if (!personId) {
      return;
    }

    setFormState((current) => {
      let nextState = applyAppointmentSetPreviousSubmissionPrefill(
        current,
        previousSubmissionFormData ?? undefined,
      );
      const cachedDraft = readFormDraft<AppointmentSetFormState>(
        "appointment-set",
        personId,
      );
      if (cachedDraft) {
        nextState = applyPreviousSubmissionFormData(nextState, cachedDraft);
      }

      const changed = (
        Object.keys(nextState) as Array<keyof AppointmentSetFormState>
      ).some((field) => nextState[field] !== current[field]);

      return changed ? nextState : current;
    });
  }, [formState.personId, previousSubmissionFormData]);

  const updateField = useCallback(
    (field: keyof AppointmentSetFormState, value: string) => {
      setFormState((current) => {
        const nextState = { ...current, [field]: value };
        if (field === "apptSetBy") {
          if (!isIsaApptSetBy(value)) {
            nextState.assignedIsa = "";
          }
          if (!isOsaApptSetBy(value)) {
            nextState.assignedOsa = "";
          }
        }
        if (field === "appointmentLocation" && !isOtherAddressLocation(value)) {
          nextState.streetAddress = "";
          nextState.addressLine2 = "";
          nextState.city = "";
          nextState.state = "";
          nextState.postalCode = "";
        }
        if (field === "appointmentStartTime" && value) {
          nextState.appointmentEndTime = addHoursToFormTime(value, 1);
        }
        writeFormDraft("appointment-set", nextState.personId, nextState);
        return nextState;
      });
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        if (field === "appointmentLocation" && !isOtherAddressLocation(value)) {
          delete next.streetAddress;
          delete next.addressLine2;
          delete next.city;
          delete next.state;
          delete next.postalCode;
        }
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (!formState.personId) {
      return;
    }

    const controller = new AbortController();

    const loadLead = async () => {
      try {
        setLoadError(null);
        const response = await fetch(`/api/fub/people/${formState.personId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Unable to load lead details (HTTP ${response.status}).`);
        }
        const person = (await response.json()) as FUBPerson;
        setFormState((current) => applyAppointmentSetPersonPrefill(current, person));
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
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
        setIsaOptionsUnavailable(false);
        setOsaOptionsUnavailable(false);

        const [agentsResponse, usersResponse, appointmentTypesResponse] =
          await Promise.all([
            fetch("/api/sisu/team-agents?role_filter=ISISA", {
              signal: controller.signal,
            }),
            fetch("/api/fub/users", { signal: controller.signal }),
            fetch("/api/fub/appointment-types", { signal: controller.signal }),
          ]);

        if (agentsResponse.ok) {
          const agentsPayload = (await agentsResponse.json()) as {
            agents: TeamAgentOption[];
          };
          const agents = agentsPayload.agents ?? [];
          if (agents.length > 0) {
            setIsaOptions(agents);
          } else {
            setIsaOptionsUnavailable(true);
            setIsaOptions([]);
          }
        } else {
          setIsaOptionsUnavailable(true);
          setIsaOptions([]);
          setOptionsError(
            `Unable to load SISU ISA agents (HTTP ${agentsResponse.status}). Using placeholders.`,
          );
        }

        if (usersResponse.ok) {
          const usersPayload = (await usersResponse.json()) as {
            users: AgentOption[];
          };
          const users = usersPayload.users ?? [];
          if (users.length > 0) {
            setOsaOptions(
              users.map((user) => ({
                value: String(user.id),
                label: user.name,
              })),
            );
          } else {
            setOsaOptionsUnavailable(true);
            setOsaOptions([]);
          }
        } else {
          setOsaOptionsUnavailable(true);
          setOsaOptions([]);
          setOptionsError((current) =>
            current
              ? `${current} FUB users also unavailable.`
              : `Unable to load FUB users (HTTP ${usersResponse.status}). Using placeholders.`,
          );
        }

        if (appointmentTypesResponse.ok) {
          const typesPayload = (await appointmentTypesResponse.json()) as {
            appointmentTypes: FubAppointmentTypeOption[];
          };
          const types = typesPayload.appointmentTypes ?? [];
          if (types.length > 0) {
            setAppointmentTypeOptions(types);
          } else {
            setAppointmentTypeOptions([...DEFAULT_APPOINTMENT_TYPE_OPTIONS]);
          }
        } else {
          setAppointmentTypeOptions([...DEFAULT_APPOINTMENT_TYPE_OPTIONS]);
          setOptionsError((current) =>
            current
              ? `${current} Appointment types also unavailable.`
              : `Unable to load FUB appointment types (HTTP ${appointmentTypesResponse.status}). Using placeholders.`,
          );
        }
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setIsaOptionsUnavailable(true);
        setOsaOptionsUnavailable(true);
        setIsaOptions([]);
        setOsaOptions([]);
        setAppointmentTypeOptions([...DEFAULT_APPOINTMENT_TYPE_OPTIONS]);
        setOptionsError(
          requestError instanceof Error
            ? `${requestError.message} Using placeholder options for ISA/OSA/types.`
            : "Unable to load dropdown options. Using placeholders.",
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
            applyCachedPreviousSubmission(
              applyAppointmentSetSisuTransactionPrefill(current, result.transaction!),
            ),
          );
        } else {
          setFormState((current) => applyCachedPreviousSubmission(current));
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
  }, [applyCachedPreviousSubmission, formState.dealId, formState.sisuTransactionId]);

  const handleSubmit = useCallback(async () => {
    const nextErrors = validateAppointmentSetForm(formState);
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
      const response = await fetch("/api/forms/appointment-set/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getSubmissionErrorMessage(payload, "Unable to submit the Appointment Set form."),
        );
      }

      const debugKey = storeSubmittedDebugRecord("appointment-set", {
        deal: payload.deal,
        transaction: payload.transaction,
      });

      clearFormDraft("appointment-set", formState.personId);
      navigate(
        buildPostSubmissionHref({
          formType: "appointment-set",
          personId: formState.personId,
          agentId: formState.agentId,
          dealId: getSubmittedFubDealId(payload) || formState.dealId,
          dealName: getSubmittedFubDealName(payload),
          clientName: [formState.clientFirstName, formState.clientLastName]
            .filter(Boolean)
            .join(" "),
          agentName: routedAgentName,
          address: resolveAppointmentSetLocation(formState),
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
          : "Unable to submit the Appointment Set form.",
      );
    }
  }, [formState, routedAgentName, navigate]);

  if (submitStatus === "submitting" || submitStatus === "complete") {
    return (
      <main id="main-content" className="page-form">
        <SectionCard title="Submission Status">
          <div className="space-y-4">
            {submitStatus === "submitting" ? (
              <Notice tone="warning">
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Submitting Appointment Set form...
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
      <main id="main-content" className="page-form">
        <div className="mb-4">
          <FormRouterBackLink
            href={buildRouterHref(formState, searchParams)}
            className={`${secondaryButtonClassName} px-4 py-2 text-xs`}
          />
        </div>
        <title>Appointment Set</title>
        <div className="mb-6">
          <h1 className="page-title mb-0 text-balance">Appointment Set</h1>
          <p className="page-intro">
            Schedule the client appointment and capture intake details for this lead.
          </p>
        </div>

        {localDemoEnabled ? (
          <Notice tone="warning">
            Demo mode — fixture client/deal/SISU IDs were applied because no
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
            Loading appointment set details...
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
            <SectionCard title="Client Info">
              <Row>
                <div>
                  <TextInput
                    id="clientFirstName"
                      {...fieldA11yProps('clientFirstName', errors.clientFirstName)}
                    label="Client First Name"
                    value={formState.clientFirstName}
                    required
                    onChange={(event) =>
                      updateField("clientFirstName", event.target.value)
                    }
                  />
                  <FieldError id={`clientFirstName-error`} message={errors.clientFirstName} />
                </div>
                <div>
                  <TextInput
                    id="clientLastName"
                      {...fieldA11yProps('clientLastName', errors.clientLastName)}
                    label="Client Last Name"
                    value={formState.clientLastName}
                    required
                    onChange={(event) =>
                      updateField("clientLastName", event.target.value)
                    }
                  />
                  <FieldError id={`clientLastName-error`} message={errors.clientLastName} />
                </div>
              </Row>
              <Row>
                <div>
                  <CommunicationTextInput
                    id="clientPhone"
                    label="Client Phone Number"
                    type="tel"
                    value={formState.clientPhone}
                    required
                    onBlur={() =>
                      updateField(
                        "clientPhone",
                        formatPhoneInput(formState.clientPhone),
                      )
                    }
                    onChange={(event) =>
                      updateField("clientPhone", event.target.value)
                    }
                    error={errors.clientPhone}
                  />
                </div>
                <div>
                  <CommunicationTextInput
                    id="clientEmail"
                    label="Client Email"
                    type="email"
                    value={formState.clientEmail}
                    required
                    onChange={(event) =>
                      updateField("clientEmail", event.target.value)
                    }
                    error={errors.clientEmail}
                  />
                </div>
              </Row>
              <Row>
                <div>
                  <FormSelectInput
                    id="leadType"
                    label="Client Type"
                    value={formState.leadType}
                    required
                    onChange={(event) => updateField("leadType", event.target.value)}
                    error={errors.leadType}
                  >
                    <option value="">Select lead type...</option>
                    {toSelectOptions(LEAD_TYPE_OPTIONS).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FormSelectInput>
                </div>
              </Row>
            </SectionCard>

            <SectionCard title="Appointment Information">
              <FieldGroup>
                <Row>
                  <div>
                    <FormSelectInput
                      id="apptSetBy"
                      label="Appointment Set By"
                      value={formState.apptSetBy}
                      required
                      onChange={(event) => updateField("apptSetBy", event.target.value)}
                    error={errors.apptSetBy}
                    >
                      <option value="">Select who set the appointment...</option>
                      {toSelectOptions(APPT_SET_BY_OPTIONS).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormSelectInput>
                  </div>
                  <div>
                    <FormSelectInput
                      id="appointmentType"
                      label="Appointment Type"
                      value={formState.appointmentType}
                      required
                      onChange={(event) =>
                        updateField("appointmentType", event.target.value)
                      }
                    error={errors.appointmentType}
                    >
                      <option value="">Select appointment type...</option>
                      {appointmentTypeOptions.map((option) => (
                        <option key={option.id} value={String(option.id)}>
                          {option.name}
                        </option>
                      ))}
                    </FormSelectInput>
                  </div>
                </Row>

                {showAssignedIsa || showAssignedOsa ? (
                  <FormExpand>
                    <Row>
                      <div>
                        {showAssignedIsa ? (
                          <>
                            <FormSelectInput
                              id="assignedIsa"
                              label="Assigned ISA"
                              value={formState.assignedIsa}
                              required
                              disabled={isaOptionsUnavailable}
                              onChange={(event) =>
                                updateField("assignedIsa", event.target.value)
                              }
                    error={errors.assignedIsa}
                            >
                              <option value="">
                                {isaOptionsUnavailable
                                  ? "SISU ISA options unavailable"
                                  : "Select ISA..."}
                              </option>
                              {!isaOptionsUnavailable
                                ? isaOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))
                                : null}
                            </FormSelectInput>
                          </>
                        ) : (
                          <>
                            <FormSelectInput
                              id="assignedOsa"
                              label="Assigned OSA"
                              value={formState.assignedOsa}
                              required
                              disabled={osaOptionsUnavailable}
                              onChange={(event) =>
                                updateField("assignedOsa", event.target.value)
                              }
                    error={errors.assignedOsa}
                            >
                              <option value="">
                                {osaOptionsUnavailable
                                  ? "FUB user options unavailable"
                                  : "Select OSA..."}
                              </option>
                              {!osaOptionsUnavailable
                                ? osaOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))
                                : null}
                            </FormSelectInput>
                          </>
                        )}
                      </div>
                    </Row>
                  </FormExpand>
                ) : null}
              </FieldGroup>

              <FieldGroup>
                <Row>
                  <div>
                    <FormDatePickerField
                      id="appointmentDate"
                      label="Appointment Date"
                      value={formState.appointmentDate}
                      required
                      error={errors.appointmentDate}
                      onChange={(value) => updateField("appointmentDate", value)}
                    />
                  </div>
                </Row>

                <Row>
                  <div>
                    <FormTimePickerField
                      id="appointmentStartTime"
                      label="Start Time"
                      value={formState.appointmentStartTime}
                      required
                      error={errors.appointmentStartTime}
                      onChange={(value) => updateField("appointmentStartTime", value)}
                    />
                  </div>
                  <div>
                    <FormTimePickerField
                      id="appointmentEndTime"
                      label="End Time"
                      value={formState.appointmentEndTime}
                      required
                      error={errors.appointmentEndTime}
                      onChange={(value) => updateField("appointmentEndTime", value)}
                    />
                  </div>
                </Row>

                <Row>
                  <div>
                    <FormSelectInput
                      id="appointmentLocation"
                      label="Appointment Location"
                      value={formState.appointmentLocation}
                      required
                      onChange={(event) =>
                        updateField("appointmentLocation", event.target.value)
                      }
                    error={errors.appointmentLocation}
                    >
                      <option value="">Select location...</option>
                      {toSelectOptions(APPOINTMENT_LOCATION_OPTIONS).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormSelectInput>
                  </div>
                </Row>

                {showOtherAddress ? (
                  <FormExpand className="flex flex-col gap-4">
                    <Divider />
                    <div className="form-address-grid">
                      <div>
                        <TextInput
                          id="streetAddress"
                      {...fieldA11yProps('streetAddress', errors.streetAddress)}
                          label="Street Address"
                          value={formState.streetAddress}
                          required
                          onChange={(event) =>
                            updateField("streetAddress", event.target.value)
                          }
                        />
                        <FieldError id={`streetAddress-error`} message={errors.streetAddress} />
                      </div>
                      <div>
                        <TextInput
                          id="addressLine2"
                      {...fieldA11yProps('addressLine2', errors.addressLine2)}
                          label="Address Line 2"
                          value={formState.addressLine2}
                          onChange={(event) =>
                            updateField("addressLine2", event.target.value)
                          }
                        />
                      </div>
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
                          label="State/Province/Region"
                          value={formState.state}
                          required
                          onChange={(event) =>
                            updateField("state", event.target.value)
                          }
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
                          id="postalCode"
                      {...fieldA11yProps('postalCode', errors.postalCode)}
                          label="Postal Code"
                          value={formState.postalCode}
                          required
                          onChange={(event) =>
                            updateField("postalCode", event.target.value)
                          }
                        />
                        <FieldError id={`postalCode-error`} message={errors.postalCode} />
                      </div>
                    </div>
                  </FormExpand>
                ) : null}
              </FieldGroup>

              <FieldGroup>
                <div>
                  <TextAreaInput
                    id="notes"
                    label="Notes (Location, Timeframe, Motivation, Price, etc.)"
                    value={formState.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                  />
                </div>
              </FieldGroup>
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
