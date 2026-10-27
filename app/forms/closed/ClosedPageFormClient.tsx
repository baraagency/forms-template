import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
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
import { FormRouterBackLink } from "../_core/formRouterBackLink";
import { buildFormRouterReturnUrlFromSearchParams } from "../_core/formRouterUtils";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "../_core/formDraftCache";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";
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
  shouldResolveSisuTransactionLookup,
  shouldShowSisuTransactionLookupWarning,
  SISU_TRANSACTION_NOT_FOUND_WARNING,
} from "../_core/sisuTransactionLookup";
import { collectPageFields } from "../editor/formPageData";
import { resolveFieldOptions } from "../editor/fieldOptions";
import { FormRuntimeProvider } from "../editor/FormRuntime";
import { PageRenderer } from "../editor/PageRenderer";
import { PageEditorButton } from "../editor/PageEditorButton";
import { buildPageSubmission } from "../editor/formPageSubmission";
import type { FieldValue, FormPageData } from "../editor/formPageTypes";
import type { JsonValue } from "@/app/types/storage";
import {
  isLeaseOrRentalSelection,
  type ClosedFormState,
} from "./closedFormUtils";
import { applyClosedSisuTransactionPrefill } from "./closedSisuTransactionPrefill";
import { buildInitialClosedValues } from "./closedPageValues";

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

function buildRouterHref(
  state: ClosedFormState,
  params: Record<string, string | string[] | undefined>,
) {
  return buildFormRouterReturnUrlFromSearchParams(params, {
    personId: state.personId,
  });
}

function toClosedFormState(values: Record<string, string>): ClosedFormState {
  return values as unknown as ClosedFormState;
}

export function ClosedPageFormClient({
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
  const trustedPrefilledSisuTransactionIdRef = useRef(
    readPrefilledSisuTransactionId(previousSubmissionFormData),
  );
  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitialClosedValues({
      document: pageDocument,
      personId:
        getSingleSearchParam(searchParams, "clientId") ||
        getSingleSearchParam(searchParams, "personId"),
      agentId: getSingleSearchParam(searchParams, "agentId"),
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
  const [loadingTransaction, setLoadingTransaction] = useState(
    shouldResolveSisuTransactionLookup({
      sisuTransactionId: getSingleSearchParam(
        searchParams,
        "sisuTransactionId",
      ),
      dealId: getSingleSearchParam(searchParams, "dealId"),
    }),
  );
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const transactionTypeOptions = useMemo(() => {
    const field = collectPageFields(pageDocument).find(
      (candidate) => candidate.id === "transactionType",
    );
    return field ? resolveFieldOptions(field) : [];
  }, [pageDocument]);

  const documentTitle = useMemo(() => {
    const title = pageDocument.content.find(
      (block) => block.type === "PageTitle",
    )?.props.text;
    return typeof title === "string" && title.trim() ? title : "Closed";
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
        "closed",
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

  useEffect(() => {
    if (
      !shouldResolveSisuTransactionLookup({
        sisuTransactionId: values.sisuTransactionId ?? "",
        dealId: values.dealId ?? "",
      })
    ) {
      setLoadingTransaction(false);
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
          setValues((current) => {
            const next = clearDiscardedSisuTransactionId(
              toClosedFormState(current),
              discardedSisuTransactionId,
            );
            return { ...current, ...next };
          });
        }

        if (result.error) {
          const retainedSisuTransactionId =
            trustedPrefilledSisuTransactionIdRef.current ||
            values.sisuTransactionId;
          if (
            shouldShowSisuTransactionLookupWarning(retainedSisuTransactionId)
          ) {
            setTransactionError(result.error);
          }
          return;
        }

        if (result.transaction) {
          setValues((current) => {
            const next = applyClosedSisuTransactionPrefill(
              toClosedFormState(current),
              result.transaction!,
            );
            return { ...current, ...next };
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

  const setValue = useCallback(
    (fieldId: string, value: FieldValue) => {
      // shortcut: Closed has no multi-select fields, so values stay strings.
      const nextValue = Array.isArray(value) ? value.join(",") : value;

      setValues((current) => {
        const next = { ...current, [fieldId]: nextValue };
        if (
          fieldId === "transactionType" &&
          !isLeaseOrRentalSelection(nextValue, transactionTypeOptions)
        ) {
          next.securityDeposit = "";
          next.monthlyRent = "";
        }
        writeFormDraft("closed", next.personId ?? "", next);
        return next;
      });

      setErrors((current) => {
        const next = { ...current };
        delete next[fieldId];
        if (fieldId === "transactionType") {
          delete next.securityDeposit;
          delete next.monthlyRent;
        }
        return next;
      });
    },
    [transactionTypeOptions],
  );

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
      dealId: values.dealId ?? "",
      sisuTransactionId: values.sisuTransactionId ?? "",
    };

    try {
      const response = await fetch("/api/forms/closed/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = await response.json();

      if (!response.ok) {
        throw new Error(
          getSubmissionErrorMessage(
            responsePayload,
            "Unable to submit the Closed form.",
          ),
        );
      }

      const debugKey = storeSubmittedDebugRecord("closed", {
        deal: responsePayload.deal,
        transaction: responsePayload.transaction,
      });

      clearFormDraft("closed", values.personId ?? "");
      navigate(
        buildPostSubmissionHref({
          formType: "closed",
          personId: values.personId ?? "",
          agentId: values.agentId ?? "",
          dealId:
            getSubmittedFubDealId(responsePayload) || values.dealId || "",
          dealName: getSubmittedFubDealName(responsePayload),
          address: buildSubmittedAddress(
            values.addressLine1 ?? "",
            values.city ?? "",
            values.state ?? "",
            values.postal ?? "",
          ),
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
          : "Unable to submit the Closed form.",
      );
    }
  }, [pageDocument, values, navigate]);

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
              href={buildRouterHref(toClosedFormState(values), searchParams)}
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
            href={buildRouterHref(toClosedFormState(values), searchParams)}
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

        {canEditPage ? <PageEditorButton form="closed" /> : null}
      </main>
    </LocalizationProvider>
  );
}
