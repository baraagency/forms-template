import { describe, expect, it } from "bun:test";
import { applyPreviousSubmissionFormData } from "../_core/previousSubmissionPrefill";

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
