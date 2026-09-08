import { describe, expect, it } from "bun:test";
import {
  buildPostSubmissionHref,
  buildSubmittedAddress,
  buildSubmittedFormHref,
  buildSubmittedRouterHref,
  FORM_SUBMIT_CLIENT_TIMEOUT_MESSAGE,
  FORM_SUBMIT_GATEWAY_TIMEOUT_MESSAGE,
  FORM_SUBMIT_REQUEST_TIMEOUT_MS,
  getFormSubmitFailureMessage,
  getSubmittedFubDealId,
  getSubmittedFubDealName,
  getSubmittedSisuTransactionId,
  getSubmissionErrorMessage,
  getSubmissionSummaryEmailWarning,
  getSubmissionWorkflowWarning,
  isFormSubmitClientTimeoutError,
  isFormSubmitGatewayTimeoutStatus,
  isSubmissionDebugEnvironment,
  storeSubmittedDebugRecord,
  submissionFormLabels,
} from "../_core/submissionUtils";

describe("submissionUtils", () => {
  it("builds a shared post-submission route with form and routed context", () => {
    expect(
      buildPostSubmissionHref({
        formType: "pending",
        personId: "218562",
        agentId: "123",
        dealId: "456",
        clientName: "Jane Client",
        agentName: "Alex Agent",
        address: "123 Main St, Charleston, SC 29401",
        sisuTransactionId: "789",
        debugKey: "debug-123",
      }),
    ).toBe(
      "/forms/submitted?form=pending&personId=218562&agentId=123&dealId=456&clientName=Jane+Client&agentName=Alex+Agent&address=123+Main+St%2C+Charleston%2C+SC+29401&sisuTransactionId=789&debugKey=debug-123",
    );
  });

  it("includes summary email warnings on the submitted confirmation page link", () => {
    expect(
      buildPostSubmissionHref({
        formType: "pending",
        personId: "218562",
        emailWarning: "Summary email failed to send.",
      }),
    ).toBe(
      "/forms/submitted?form=pending&personId=218562&emailWarning=Summary+email+failed+to+send.",
    );
  });

  it("detects client and gateway submission timeouts", () => {
    expect(isFormSubmitClientTimeoutError(new DOMException("Timed out", "TimeoutError"))).toBe(
      true,
    );
    expect(isFormSubmitGatewayTimeoutStatus(503)).toBe(true);
    expect(
      getFormSubmitFailureMessage(
        { status: 503 } as Response,
        {},
        "Unable to submit the Pending form.",
      ),
    ).toBe(FORM_SUBMIT_GATEWAY_TIMEOUT_MESSAGE);
    expect(FORM_SUBMIT_CLIENT_TIMEOUT_MESSAGE).toContain("30 seconds");
    expect(FORM_SUBMIT_REQUEST_TIMEOUT_MS).toBe(30_000);
  });

  it("builds restart and router links without empty query params", () => {
    expect(
      buildSubmittedFormHref({
        formType: "pending",
        personId: "218562",
      }),
    ).toBe("/forms/pending?personId=218562");
    expect(buildSubmittedRouterHref({ personId: "218562" })).toBe("/forms?clientId=218562");
  });

  it("formats submitted addresses and reads returned FUB and SISU ids", () => {
    expect(buildSubmittedAddress("123 Main St", "", "Charleston", "SC", "29401")).toBe(
      "123 Main St, Charleston, SC, 29401",
    );
    expect(getSubmittedSisuTransactionId({ transaction: { client_id: 6495593 } })).toBe(
      "6495593",
    );
    expect(getSubmittedFubDealId({ dealId: "456" })).toBe("456");
    expect(
      getSubmittedFubDealName({ dealName: "John TestLead - Buyer consultation" }),
    ).toBe("John TestLead - Buyer consultation");
    expect(getSubmittedFubDealName({ deal: { name: "Listing deal" } })).toBe(
      "Listing deal",
    );
  });

  it("detects submission debug environments", () => {
    expect(isSubmissionDebugEnvironment("LOCAL")).toBe(true);
    expect(isSubmissionDebugEnvironment("PRODUCTION")).toBe(false);
  });

  it("exposes display labels for supported forms", () => {
    expect(submissionFormLabels).toEqual({
      pending: "Pending",
      "appointment-set": "Appointment Set",
      "appointment-met": "Appointment Met",
      closed: "Closed",
    });
  });

  it("prefers returned workflow error details over generic response messages", () => {
    expect(
      getSubmissionErrorMessage(
        { message: "Pending workflow failed.", error: "SISU rejected the transaction." },
        "Pending submission failed (HTTP 502).",
      ),
    ).toBe("SISU rejected the transaction.");
  });

  it("reads summary email warnings from submit payloads", () => {
    expect(
      getSubmissionSummaryEmailWarning({
        email: { sent: false, message: "Summary email failed to send." },
      }),
    ).toBe("Summary email failed to send.");
    expect(storeSubmittedDebugRecord("pending", {})).toBe("");
  });

  it("reads workflow warnings from submit payloads", () => {
    expect(
      getSubmissionWorkflowWarning({
        warnings: [
          "SISU transaction was not written: SISU_API_KEY is not configured.",
        ],
      }),
    ).toBe("SISU transaction was not written: SISU_API_KEY is not configured.");
  });
});
