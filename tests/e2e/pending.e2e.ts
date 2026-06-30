import { test, expect } from "@playwright/test";
import {
  MOCK_AGENT_ID,
  MOCK_DEAL_ID,
  MOCK_PERSON_ID,
  MOCK_TRANSACTION_ID,
} from "../../app/api/_fixtures/constants";

const pendingUrl = `/forms/pending?clientId=${MOCK_PERSON_ID}&agentId=${MOCK_AGENT_ID}&dealId=${MOCK_DEAL_ID}&sisuTransactionId=${MOCK_TRANSACTION_ID}&clientName=Jane+Client`;

test.describe("Pending form template", () => {
  test("loads pending form with fixture-backed dropdowns", async ({ page }) => {
    await page.goto(pendingUrl);

    await expect(page.getByRole("heading", { name: /pending/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel(/first name/i)).toHaveValue("Jane");
    await expect(page.getByLabel(/last name/i)).toHaveValue("Client");
  });

  test("form router lists the pending form", async ({ page }) => {
    await page.goto(`/forms?clientId=${MOCK_PERSON_ID}&agentId=${MOCK_AGENT_ID}`);

    await expect(page.getByRole("button", { name: "Pending" })).toBeVisible();
  });
});
