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
  applyPendingPersonPrefill,
  applyPendingSisuTransactionPrefill,
  defaultPendingIsaSetFromIsaName,
  type PendingFormState,
} from "./pendingFormUtils";
import { buildInitialPendingValues } from "./pendingPageValues";
import {
  buildPostSubmissionHref,
  buildSubmittedAddress,
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
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";
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

function toFormState(values: Record<string, string>): PendingFormState {
  return values as unknown as PendingFormState;
}

function buildRouterHref(
  state: PendingFormState,
  params: Record<string, string | string[] | undefined>,
) {
  return buildFormRouterReturnUrlFromSearchParams(params, {
    personId: state.personId,
  });
}

export function PendingPageFormClient({
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
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial = buildInitialPendingValues({
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
    });
    return {
      ...initial,
      ...defaultPendingIsaSetFromIsaName(toFormState(initial)),
    };
  });
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

  const userEditedFieldsRef = useRef(new Set<string>());
  const trustedPrefilledSisuTransactionIdRef = useRef(
    readPrefilledSisuTransactionId(previousSubmissionFormData),
  );

  const documentTitle = useMemo(() => {
    const title = pageDocument.content.find(
      (block) => block.type === "PageTitle",
    )?.props.text;
    return typeof title === "string" && title.trim() ? title : "Pending";
  }, [pageDocument]);

  useEffect(() => {
    const personId = values.personId?.trim() ?? "";
    if (!personId) {
      return;
    }

    setValues((current) => {
      let next = applyPreviousSubmissionFormData(
        current,
        previousSubmissionFormData ?? undefined,
      );
      const cachedDraft = readFormDraft<Record<string, string>>(
        "pending",
        personId,
      );
      if (cachedDraft) {
        next = applyPreviousSubmissionFormData(next, cachedDraft);
      }

      const changed = Object.keys(next).some(
        (field) => next[field] !== current[field],
      );
      return changed ? next : current;
    });
  }, [values.personId, previousSubmissionFormData]);

  const setValue = useCallback(
    (fieldId: string, value: FieldValue) => {
      const nextValue = Array.isArray(value) ? value.join(",") : value;
      userEditedFieldsRef.current.add(fieldId);

      setValues((current) => {
        const next = { ...current, [fieldId]: nextValue };
        if (fieldId === "clientType") {
          next.transactionStage =
            nextValue === "Buyer"
              ? "buyer-pending"
              : nextValue === "Seller"
                ? "seller-pending"
                : "";
        }
        writeFormDraft("pending", next.personId ?? "", next);
        return next;
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
        setLoadingLead(true);
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
          ...applyPendingPersonPrefill(toFormState(current), person),
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
        setTransactionError(null);
        setLoadingTransaction(true);
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
          setValues((current) => {
            const prefilled = applyPendingSisuTransactionPrefill(
              clearDiscardedSisuTransactionId(
                toFormState(current),
                discardedSisuTransactionId,
              ),
              result.transaction!,
            );
            for (const field of userEditedFieldsRef.current) {
              (prefilled as Record<string, string>)[field] = current[field];
            }
            return { ...current, ...prefilled };
          });
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
  }, [values.dealId, values.sisuTransactionId]);

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

    try {
      const response = await fetch("/api/forms/pending/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
      clearFormDraft("pending", values.personId ?? "");
      navigate(
        buildPostSubmissionHref({
          formType: "pending",
          personId: values.personId ?? "",
          agentId: values.agentId ?? "",
          dealId:
            getSubmittedFubDealId(payload) || values.dealId || "",
          dealName: getSubmittedFubDealName(payload),
          agentName: routedAgentName,
          clientName: [values.clientFirstName, values.clientLastName]
            .filter(Boolean)
            .join(" "),
          address: buildSubmittedAddress(
            values.addressLine1 ?? "",
            values.addressLine2 ?? "",
            values.city ?? "",
            values.state ?? "",
            values.postal ?? "",
          ),
          sisuTransactionId:
            getSubmittedSisuTransactionId(payload) ||
            values.sisuTransactionId ||
            "",
          debugKey,
          emailWarning: getSubmissionSummaryEmailWarning(payload) ?? undefined,
          workflowWarning: getSubmissionWorkflowWarning(payload) ?? undefined,
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
            Loading pending form details...
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

        {canEditPage ? <PageEditorButton form="pending" /> : null}
      </main>
    </LocalizationProvider>
  );
}
