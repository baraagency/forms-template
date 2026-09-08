import { describe, expect, it } from "bun:test";
import { buildFormSubmissionSummary } from "../buildFormSubmissionSummary";
import {
  createEmptyFormSubmissionDisplayContext,
  formatFormSubmissionFieldValue,
} from "@/app/forms/_core/formSubmissionDisplayValues";

describe("buildFormSubmissionSummary", () => {
  it("builds a plain-text body and an HTML table body for FUB notes", async () => {
    const summary = await buildFormSubmissionSummary({
      form: "appointmentSet",
      formLabel: "Appointment Set",
      formState: {
        personId: "143",
        dealId: "41",
        clientFirstName: "Tom",
        clientLastName: "Hanks",
        notes: "Line one\nLine two",
      },
    });

    expect(summary.subject).toBe("Appointment Set Form Summary");
    expect(summary.body).toContain("Client First Name: Tom");
    expect(summary.body).toContain("Client Last Name: Hanks");
    expect(summary.htmlBody).toContain("<table");
    expect(summary.htmlBody).toContain("<th");
    expect(summary.htmlBody).toContain("background-color:#d4ecf7");
    expect(summary.htmlBody).toContain("border:1px solid #b8d4e3");
    expect(summary.htmlBody).toContain("Client First Name");
    expect(summary.htmlBody).toContain("Tom");
    expect(summary.htmlBody).toContain("Line one<br>Line two");
    expect(summary.htmlBody).not.toContain("personId");
    expect(summary.htmlBody).not.toContain("dealId");
  });

  it("formats values the same way they appear in the form", async () => {
    const summary = await buildFormSubmissionSummary({
      form: "appointmentSet",
      formLabel: "Appointment Set",
      formState: {
        personId: "143",
        clientPhone: "1231231234",
        leadType: "Buyer",
        appointmentDate: "2027-04-20",
        appointmentStartTime: "00:00",
        appointmentEndTime: "01:00",
        appointmentType: "1",
        assignedIsa: "501",
        assignedOsa: "1",
        apptSetBy: "ISA",
        appointmentLocation: "Phone",
      },
    });

    expect(summary.body).toContain("Client Phone Number: (123) 123-1234");
    expect(summary.body).toContain("Appointment Date: 04/20/2027");
    expect(summary.body).toContain("Start Time: 12:00 AM");
    expect(summary.body).toContain("End Time: 01:00 AM");
    expect(summary.body).toMatch(/Appointment Type: Buyer consultation/i);
    expect(summary.body).toContain("Assigned ISA: Taylor ISA");
    expect(summary.body).not.toContain("Assigned OSA: 1");
    expect(summary.body).toMatch(/Assigned OSA: .+/);
  });

  it("escapes HTML in field labels and values", async () => {
    const summary = await buildFormSubmissionSummary({
      form: "closed",
      formLabel: "Closed",
      formState: {
        personId: "1",
        clientType: "Buyer",
        transactionType: "none",
        addressLine1: "123 Main",
        city: "Charleston",
        state: "SC",
        postal: "29401",
        transactionAmount: "100000",
        totalCommissionGci: "3000",
        settlementDate: "2026-04-01",
        tcMarketingNotes: "<script>alert(1)</script>",
      },
    });

    expect(summary.htmlBody).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(summary.htmlBody).not.toContain("<script>");
  });

  it("handles empty submissions in both formats", async () => {
    const summary = await buildFormSubmissionSummary({
      form: "closed",
      formLabel: "Closed",
      formState: {
        personId: "1",
      },
    });

    expect(summary.body).toContain("(No field values submitted.)");
    expect(summary.htmlBody).toContain("(No field values submitted.)");
    expect(summary.htmlBody).not.toContain("<table");
  });
});

describe("formatFormSubmissionFieldValue", () => {
  it("formats pending yes/no and currency fields", () => {
    const context = createEmptyFormSubmissionDisplayContext();

    expect(
      formatFormSubmissionFieldValue(
        "pending",
        "hasSecondaryClient",
        "yes",
        context,
      ),
    ).toBe("Yes");
    expect(
      formatFormSubmissionFieldValue(
        "pending",
        "transactionAmount",
        "250000",
        context,
      ),
    ).toBe("$250,000.00");
    expect(
      formatFormSubmissionFieldValue(
        "pending",
        "referralPercent",
        "2.5",
        context,
      ),
    ).toBe("2.50%");
  });
});
