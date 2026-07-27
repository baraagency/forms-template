import { useNavigate } from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import { CommunicationTextInput } from "../_core/CommunicationTextInput";
import { FormSelectInput } from "../_core/formSelectInput";
import type { FUBPerson } from "@/app/types/fub";
import type { JsonValue } from "@/app/types/storage";
import { FormDatePickerField } from "../_core/formDatePickerField";
import { FormExpand } from "../_core/FormExpand";
import { FormTimePickerField } from "../_core/formTimePickerField";
import { getMaxFormDateTodayForPicker } from "../_core/formDateValidation";
import { formatPhoneInput } from "../_core/formatUtils";
import {
  APPT_DISPOSITION_OPTIONS,
  APPT_OUTCOME_OPTIONS,
  CANCELLED_NEXT_STEP_OPTIONS,
  LEAD_TYPE_OPTIONS,
  MET_NEXT_STEP_OPTIONS,
  applyAppointmentMetDispositionFieldClearing,
  applyAppointmentMetPersonPrefill,
  applyAppointmentMetPreviousSubmissionPrefill,
  applyAppointmentMetSisuTransactionPrefill,
  getInitialAppointmentMetFormState,
  isCancelledDisposition,
  isMetDisposition,
  isRescheduledDisposition,
  validateAppointmentMetForm,
  type AppointmentMetFieldErrors,
  type AppointmentMetFormState,
} from "./appointmentMetFormUtils";
import {
  buildPostSubmissionHref,
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
import { FormRouterBackLink } from "../_core/formRouterBackLink";
import { buildFormRouterReturnUrlFromSearchParams } from "../_core/formRouterUtils";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "../_core/formDraftCache";

type SelectOption = {
  value: string;
  label: string;
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

function toSelectOptions(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

function buildRouterHref(
  state: AppointmentMetFormState,
  params: Record<string, string | string[] | undefined>,
) {
  return buildFormRouterReturnUrlFromSearchParams(params, {
    personId: state.personId,
  });
}

export function AppointmentMetFormClient({
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
    (current: AppointmentMetFormState) =>
      applyAppointmentMetPreviousSubmissionPrefill(
        current,
        previousSubmissionFormDataRef.current,
      ),
    [],
  );

  const [formState, setFormState] = useState<AppointmentMetFormState>(() =>
    applyAppointmentMetPreviousSubmissionPrefill(
      getInitialAppointmentMetFormState({
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
  const [errors, setErrors] = useState<AppointmentMetFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loadingLead, setLoadingLead] = useState(Boolean(formState.personId));
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "complete" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const showMetFields = isMetDisposition(formState.apptDisposition);
  const showCancelledFields = isCancelledDisposition(formState.apptDisposition);
  const showRescheduledFields = isRescheduledDisposition(formState.apptDisposition);
  const showFollowUpNotes = formState.cancelledNextStep === "Other";
  const appointmentMetDateMax = useMemo(() => getMaxFormDateTodayForPicker(), []);

  useEffect(() => {
    const personId = formState.personId.trim();
    if (!personId) {
      return;
    }

    setFormState((current) => {
      let nextState = applyAppointmentMetPreviousSubmissionPrefill(
        current,
        previousSubmissionFormData ?? undefined,
      );
      const cachedDraft = readFormDraft<AppointmentMetFormState>(
        "appointment-met",
        personId,
      );
      if (cachedDraft) {
        nextState = applyPreviousSubmissionFormData(nextState, cachedDraft);
      }

      const changed = (
        Object.keys(nextState) as Array<keyof AppointmentMetFormState>
      ).some((field) => nextState[field] !== current[field]);

      return changed ? nextState : current;
    });
  }, [formState.personId, previousSubmissionFormData]);

  const updateField = useCallback(
    (field: keyof AppointmentMetFormState, value: string) => {
      setFormState((current) => {
        const nextState = applyAppointmentMetDispositionFieldClearing(
          current,
          field,
          value,
        );
        writeFormDraft("appointment-met", nextState.personId, nextState);
        return nextState;
      });
      setErrors((current) => {
        if (!current[field]) {
          return current;
        }
        const next = { ...current };
        delete next[field];
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
        setFormState((current) => applyAppointmentMetPersonPrefill(current, person));
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
              applyAppointmentMetSisuTransactionPrefill(current, result.transaction!),
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
    const nextErrors = validateAppointmentMetForm(formState);
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
      const response = await fetch("/api/forms/appointment-met/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getSubmissionErrorMessage(payload, "Unable to submit the Appointment Met form."),
        );
      }

      const debugKey = storeSubmittedDebugRecord("appointment-met", {
        deal: payload.deal,
        transaction: payload.transaction,
      });

      clearFormDraft("appointment-met", formState.personId);
      navigate(
        buildPostSubmissionHref({
          formType: "appointment-met",
          personId: formState.personId,
          agentId: formState.agentSubmitting || formState.agentId,
          dealId: getSubmittedFubDealId(payload) || formState.dealId,
          clientName: [formState.clientFirstName, formState.clientLastName]
            .filter(Boolean)
            .join(" "),
          agentName: routedAgentName,
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
          : "Unable to submit the Appointment Met form.",
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
                  Submitting Appointment Met form...
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
        <title>Appointment Met</title>
        <div className="mb-6">
          <h1 className="page-title mb-0 text-balance">Appointment Met</h1>
          <p className="page-intro text-pretty">
            Capture appointment disposition and next steps for this lead.
          </p>
        </div>

        {localDemoEnabled ? (
          <Notice tone="warning">
            Demo mode — fixture client/deal/SISU IDs were applied because no
            clientId was provided.
          </Notice>
        ) : null}
        {loadError ? <Notice tone="warning">{loadError}</Notice> : null}
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
            Loading appointment met details...
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
            </SectionCard>

            <SectionCard title="Disposition Details">
              <div>
                <FormSelectInput
                  id="apptDisposition"
                  label="Did the Appointment Happen?"
                  value={formState.apptDisposition}
                  required
                  onChange={(event) =>
                    updateField("apptDisposition", event.target.value)
                  }
                    error={errors.apptDisposition}
                >
                  <option value="">Select disposition...</option>
                  {toSelectOptions(APPT_DISPOSITION_OPTIONS).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelectInput>
              </div>

              {showMetFields ? (
                <FormExpand className="flex flex-col gap-4">
                  <Row>
                    <div>
                      <FormDatePickerField
                        id="appointmentMetDate"
                        label="Appointment Met Date"
                        value={formState.appointmentMetDate}
                        required
                        maxDate={appointmentMetDateMax}
                        error={errors.appointmentMetDate}
                        onChange={(value) => updateField("appointmentMetDate", value)}
                      />
                    </div>
                    <div>
                      <FormSelectInput
                        id="apptOutcome"
                        label="Appointment Outcome"
                        value={formState.apptOutcome}
                        required
                        onChange={(event) =>
                          updateField("apptOutcome", event.target.value)
                        }
                    error={errors.apptOutcome}
                      >
                        <option value="">Select outcome...</option>
                        {toSelectOptions(APPT_OUTCOME_OPTIONS).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </FormSelectInput>
                    </div>
                  </Row>
                  <Row>
                    <div>
                      <FormSelectInput
                        id="nextStep"
                        label="Next Step"
                        value={formState.nextStep}
                        required
                        onChange={(event) =>
                          updateField("nextStep", event.target.value)
                        }
                    error={errors.nextStep}
                      >
                        <option value="">Select next step...</option>
                        {toSelectOptions(MET_NEXT_STEP_OPTIONS).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </FormSelectInput>
                    </div>
                    <div>
                      <TextAreaInput
                        id="notes"
                        label="Notes"
                        value={formState.notes}
                        onChange={(event) => updateField("notes", event.target.value)}
                      />
                    </div>
                  </Row>
                </FormExpand>
              ) : null}

              {showCancelledFields ? (
                <FormExpand className="flex flex-col gap-4">
                  <div>
                    <FormSelectInput
                      id="cancelledNextStep"
                      label="Next Step for Cancelled Appointments"
                      value={formState.cancelledNextStep}
                      required
                      onChange={(event) =>
                        updateField("cancelledNextStep", event.target.value)
                      }
                    error={errors.cancelledNextStep}
                    >
                      <option value="">Select next step...</option>
                      {toSelectOptions(CANCELLED_NEXT_STEP_OPTIONS).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </FormSelectInput>
                  </div>
                  {showFollowUpNotes ? (
                    <FormExpand>
                      <TextAreaInput
                        id="followUpNotes"
                        label="Follow Up Notes"
                        value={formState.followUpNotes}
                        required
                        {...fieldA11yProps("followUpNotes", errors.followUpNotes)}
                        onChange={(event) =>
                          updateField("followUpNotes", event.target.value)
                        }
                      />
                      <FieldError id={`followUpNotes-error`} message={errors.followUpNotes} />
                    </FormExpand>
                  ) : null}
                </FormExpand>
              ) : null}

              {showRescheduledFields ? (
                <FormExpand>
                  <Row>
                    <div>
                      <FormDatePickerField
                        id="rescheduledDate"
                        label="Rescheduled Date"
                        value={formState.rescheduledDate}
                        required
                        error={errors.rescheduledDate}
                        onChange={(value) => updateField("rescheduledDate", value)}
                      />
                    </div>
                    <Row>
                      <div>
                        <FormTimePickerField
                          id="rescheduledStartTime"
                          label="Rescheduled Start Time"
                          value={formState.rescheduledStartTime}
                          required
                          error={errors.rescheduledStartTime}
                          onChange={(value) =>
                            updateField("rescheduledStartTime", value)
                          }
                        />
                      </div>
                      <div>
                        <FormTimePickerField
                          id="rescheduledEndTime"
                          label="Rescheduled End Time"
                          value={formState.rescheduledEndTime}
                          required
                          error={errors.rescheduledEndTime}
                          onChange={(value) =>
                            updateField("rescheduledEndTime", value)
                          }
                        />
                      </div>
                    </Row>
                  </Row>
                </FormExpand>
              ) : null}
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
