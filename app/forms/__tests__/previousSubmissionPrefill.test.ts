import { describe, expect, it } from "bun:test";
import {
  applyPreviousSubmissionFormData,
  buildPreviousSubmissionFormDataFromRecord,
} from "../_core/previousSubmissionPrefill";
import type { FormSubmission } from "@/app/types/storage";
import { parseDealFubIdFromSearchParams } from "../../routes/formLoaderUtils";

describe("applyPreviousSubmissionFormData", () => {
  it("populates matching string form fields from a previous submission", () => {
    const current = {
      personId: "218562",
      dealId: "456",
      clientFirstName: "",
      clientLastName: "",
      signedDate: "",
    };

    const result = applyPreviousSubmissionFormData(current, {
      clientFirstName: "Jane",
      clientLastName: "Client",
      signedDate: "2026-05-15",
      ignoredField: "not in the current form",
    });

    expect(result).toEqual({
      personId: "218562",
      dealId: "456",
      clientFirstName: "Jane",
      clientLastName: "Client",
      signedDate: "2026-05-15",
    });
  });

  it("keeps present routed context ids instead of stale stored ids", () => {
    const current = {
      personId: "218562",
      agentId: "240614",
      dealId: "456",
      sisuTransactionId: "999",
      clientFirstName: "",
    };

    const result = applyPreviousSubmissionFormData(current, {
      personId: "old-person",
      agentId: "old-agent",
      dealId: "create-new",
      sisuTransactionId: "",
      clientFirstName: "Jane",
    });

    expect(result).toEqual({
      personId: "218562",
      agentId: "240614",
      dealId: "456",
      sisuTransactionId: "999",
      clientFirstName: "Jane",
    });
  });

  it("does not overwrite fields the user already filled in", () => {
    const result = applyPreviousSubmissionFormData(
      {
        appointmentDate: "2027-01-14",
        notes: "",
      },
      {
        appointmentDate: "2026-06-03",
        notes: "Previous notes",
      },
    );

    expect(result).toEqual({
      appointmentDate: "2027-01-14",
      notes: "Previous notes",
    });
  });
});

describe("buildPreviousSubmissionFormDataFromRecord", () => {
  it("adds dealId from the submission row when form_data omitted it", () => {
    const submission: FormSubmission = {
      id: 24,
      created_at: new Date("2026-09-08T16:54:55.796Z"),
      form: "appointmentSet",
      lead_fub_id: 143,
      deal_fub_id: 41,
      form_data: {
        clientFirstName: "Tom",
        clientLastName: "Hanks",
        dealId: "",
        sisuTransactionId: "6747355",
      },
      lead_type: "Buyer",
      appointment_id: "15732",
      successful: true,
    };

    expect(buildPreviousSubmissionFormDataFromRecord(submission)).toEqual({
      clientFirstName: "Tom",
      clientLastName: "Hanks",
      dealId: "41",
      sisuTransactionId: "6747355",
    });
  });
});

describe("parseDealFubIdFromSearchParams", () => {
  it("parses a positive deal id and ignores create-new", () => {
    expect(parseDealFubIdFromSearchParams({ dealId: "41" })).toBe(41);
    expect(parseDealFubIdFromSearchParams({ dealId: "create-new" })).toBeNull();
    expect(parseDealFubIdFromSearchParams({})).toBeNull();
  });
});
