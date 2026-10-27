import { useNavigate } from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Notice,
  SectionCard,
  Spinner,
  secondaryButtonClassName,
} from "../_core/ui";
import { PrimaryButton } from "../_core/PrimaryButton";
import { FormValidationSummary } from "../_core/FormValidationSummary";
import type { FUBPerson } from "@/app/types/fub";
import type { JsonValue } from "@/app/types/storage";
import {
  applyAppointmentMetDispositionFieldClearing,
  applyAppointmentMetPersonPrefill,
  applyAppointmentMetPreviousSubmissionPrefill,
  applyAppointmentMetSisuTransactionPrefill,
  type AppointmentMetFormState,
} from "./appointmentMetFormUtils";
import { buildInitialAppointmentMetValues } from "./appointmentMetPageValues";
import {
  buildPostSubmissionHref,
  getSubmittedFubDealId,
  getSubmittedFubDealName,
  getSubmittedSisuTransactionId,
  getSubmissionErrorMessage,
  getSubmissionSummaryEmailWarning,
  getSubmissionWorkflowWarning,
  storeSubmittedDebugRecord,
} from "../_core/submissionUtils";
import {
  clearDiscardedSisuTransactionId,
  removeSisuTransactionIdFromCurrentUrl,
  readPrefilledSisuTransactionId,
  resolveSisuTransactionLookup,
  shouldClearDiscardedSisuTransactionId,
  shouldShowSisuTransactionLookupWarning,
  SISU_TRANSACTION_NOT_FOUND_WARNING,
  shouldResolveSisuTransactionLookup,
} from "../_core/sisuTransactionLookup";
import { FormRouterBackLink } from "../_core/formRouterBackLink";
import { buildFormRouterReturnUrlFromSearchParams } from "../_core/formRouterUtils";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "../_core/formDraftCache";
import { FormRuntimeProvider } from "../editor/FormRuntime";
import { PageRenderer } from "../editor/PageRenderer";
import { PageEditorButton } from "../editor/PageEditorButton";
import { buildPageSubmission } from "../editor/formPageSubmission";
import type { FieldValue, FormPageData } from "../editor/formPageTypes";

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

function toFormState(values: Record<string, string>): AppointmentMetFormState {
  return values as unknown as AppointmentMetFormState;
}

function buildRouterHref(
  state: AppointmentMetFormState,
  params: Record<string, string | string[] | undefined>,
) {
  return buildFormRouterReturnUrlFromSearchParams(params, {
    personId: state.personId,
  });
}

export function AppointmentMetPageFormClient({
  searchParams,
  previousSubmissionFormData = null,
  localDemoEnabled = false,
  pageDocument,
  canEditPage = false,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  previousSubmissionFormData?: JsonValue | null;
  localDemoEnabled?: boolean;
  pageDocument: FormPageData;
  canEditPage?: boolean;
}) {
  const navigate = useNavigate();
  const routedAgentName = getSingleSearchParam(searchParams, "agentName");
  const previousSubmissionFormDataRef = useRef<JsonValue | null>(
    previousSubmissionFormData ?? null,
  );
  const trustedPrefilledSisuTransactionIdRef = useRef(
    readPrefilledSisuTransactionId(previousSubmissionFormData),
  );

  const applyCachedPreviousSubmission = useCallback(
    (current: Record<string, string>) => {
      const next = applyAppointmentMetPreviousSubmissionPrefill(
        toFormState(current),
        previousSubmissionFormDataRef.current,
      );
      return { ...current, ...next };
    },
    [],
  );

  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitialAppointmentMetValues({
      document: pageDocument,
      personId:
        getSingleSearchParam(searchParams, "clientId") ||
        getSingleSearchParam(searchParams, "personId"),
      agentId: getSingleSearchParam(searchParams, "agentId"),
      clientName: getSingleSearchParam(searchParams, "clientName"),
      dealId: getSingleSearchParam(searchParams, "dealId"),
      sisuTransactionId: getSingleSearchParam(
        searchParams,
        "sisuTransactionId",
      ),
      previousSubmissionFormData,
    }),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loadingLead, setLoadingLead] = useState(Boolean(values.personId));
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "complete" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const documentTitle = useMemo(() => {
    const title = pageDocument.content.find(
      (block) => block.type === "PageTitle",
    )?.props.text;
    return typeof title === "string" && title.trim()
      ? title
      : "Appointment Met";
  }, [pageDocument]);

  useEffect(() => {
    const personId = values.personId?.trim() ?? "";
    if (!personId) {
      return;
    }

    setValues((current) => {
      let next = applyAppointmentMetPreviousSubmissionPrefill(
        toFormState(current),
        previousSubmissionFormData ?? undefined,
      );
      const cachedDraft = readFormDraft<Record<string, string>>(
        "appointment-met",
        personId,
      );
      if (cachedDraft) {
        next = applyAppointmentMetPreviousSubmissionPrefill(
          toFormState({ ...next }),
          cachedDraft,
        );
      }

      const nextValues = {
        ...current,
        ...(next as unknown as Record<string, string>),
      };
      const changed = Object.keys(nextValues).some(
        (field) => nextValues[field] !== current[field],
      );
      return changed ? nextValues : current;
    });
  }, [values.personId, previousSubmissionFormData]);

  const setValue = useCallback(
    (fieldId: string, value: FieldValue) => {
      const nextValue = Array.isArray(value) ? value.join(",") : value;

      setValues((current) => {
        const next = applyAppointmentMetDispositionFieldClearing(
          toFormState(current),
          fieldId as keyof AppointmentMetFormState,
          nextValue,
        );
        writeFormDraft("appointment-met", next.personId, next);
        return { ...current, ...next };
      });

      setErrors((current) => {
        const next = { ...current };
        delete next[fieldId];
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (!values.personId) {
      return;
    }

    const controller = new AbortController();

    const loadLead = async () => {
      try {
        setLoadError(null);
        const response = await fetch(`/api/fub/people/${values.personId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            `Unable to load lead details (HTTP ${response.status}).`,
          );
        }
        const person = (await response.json()) as FUBPerson;
        setValues((current) => ({
          ...current,
          ...applyAppointmentMetPersonPrefill(toFormState(current), person),
        }));
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
  }, [values.personId]);

  useEffect(() => {
    if (
      !shouldResolveSisuTransactionLookup({
        sisuTransactionId: values.sisuTransactionId ?? "",
        dealId: values.dealId ?? "",
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
          sisuTransactionId: values.sisuTransactionId ?? "",
          dealId: values.dealId ?? "",
          signal: controller.signal,
        });
        const discardedSisuTransactionId = result.discardedSisuTransactionId;

        if (
          shouldClearDiscardedSisuTransactionId(
            values.sisuTransactionId ?? "",
            discardedSisuTransactionId,
            trustedPrefilledSisuTransactionIdRef.current,
          )
        ) {
          removeSisuTransactionIdFromCurrentUrl();
          setValues((current) => ({
            ...current,
            ...clearDiscardedSisuTransactionId(
              toFormState(current),
              discardedSisuTransactionId,
            ),
          }));
        }

        if (result.error) {
          const retainedSisuTransactionId =
            trustedPrefilledSisuTransactionIdRef.current ||
            values.sisuTransactionId;
          if (shouldShowSisuTransactionLookupWarning(retainedSisuTransactionId)) {
            setTransactionError(result.error);
          }
          return;
        }

        if (result.transaction) {
          setValues((current) =>
            applyCachedPreviousSubmission({
              ...current,
              ...applyAppointmentMetSisuTransactionPrefill(
                toFormState(current),
                result.transaction!,
              ),
            }),
          );
        } else {
          setValues((current) => applyCachedPreviousSubmission(current));
        }
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setTransactionError(
          shouldShowSisuTransactionLookupWarning(
            trustedPrefilledSisuTransactionIdRef.current ||
              values.sisuTransactionId,
          )
            ? SISU_TRANSACTION_NOT_FOUND_WARNING
            : null,
        );
      } finally {
        setLoadingTransaction(false);
      }
    };

    void loadTransaction();
    return () => controller.abort();
  }, [applyCachedPreviousSubmission, values.dealId, values.sisuTransactionId]);

  const handleSubmit = useCallback(async () => {
    const submission = buildPageSubmission(pageDocument, values);
    const nextErrors = { ...submission.errors };
    if (!values.personId?.trim()) {
      nextErrors.personId = "A FUB person id is required.";
    }

    setSubmitAttempted(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitStatus("submitting");
    setSubmitMessage(null);

    const payload = {
      ...submission.values,
      personId: values.personId ?? "",
      agentId: values.agentId ?? "",
      agentSubmitting: values.agentSubmitting ?? "",
      dealId: values.dealId ?? "",
      sisuTransactionId: values.sisuTransactionId ?? "",
    };

    try {
      const response = await fetch("/api/forms/appointment-met/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = await response.json();

      if (!response.ok) {
        throw new Error(
          getSubmissionErrorMessage(
            responsePayload,
            "Unable to submit the Appointment Met form.",
          ),
        );
      }

      const debugKey = storeSubmittedDebugRecord("appointment-met", {
        deal: responsePayload.deal,
        transaction: responsePayload.transaction,
      });

      clearFormDraft("appointment-met", values.personId ?? "");
      navigate(
        buildPostSubmissionHref({
          formType: "appointment-met",
          personId: values.personId ?? "",
          agentId: values.agentSubmitting || values.agentId || "",
          dealId:
            getSubmittedFubDealId(responsePayload) || values.dealId || "",
          dealName: getSubmittedFubDealName(responsePayload),
          clientName: [values.clientFirstName, values.clientLastName]
            .filter(Boolean)
            .join(" "),
          agentName: routedAgentName,
          sisuTransactionId:
            getSubmittedSisuTransactionId(responsePayload) ||
            values.sisuTransactionId ||
            "",
          debugKey,
          emailWarning:
            getSubmissionSummaryEmailWarning(responsePayload) ?? undefined,
          workflowWarning:
            getSubmissionWorkflowWarning(responsePayload) ?? undefined,
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
  }, [pageDocument, values, routedAgentName, navigate]);

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
                href={buildRouterHref(toFormState(values), searchParams)}
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
            href={buildRouterHref(toFormState(values), searchParams)}
            className={`${secondaryButtonClassName} px-4 py-2 text-xs`}
          />
        </div>
        <title>{documentTitle}</title>

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
          <FormRuntimeProvider
            value={{
              values,
              errors,
              setValue,
            }}
          >
            <PageRenderer document={pageDocument} />
          </FormRuntimeProvider>

          <div className="form-actions mt-6">
            <PrimaryButton type="submit" className="w-full">
              Submit
            </PrimaryButton>
          </div>
        </form>

        {canEditPage ? <PageEditorButton form="appointmentMet" /> : null}
      </main>
    </LocalizationProvider>
  );
}
