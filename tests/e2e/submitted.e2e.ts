import { expect, test } from "@playwright/test";
import { MOCK_DEAL_ID } from "../../app/api/_fixtures/constants";

test.describe("Submitted confirmation page", () => {
  test("shows the FUB deal name (not just the id) when provided", async ({ page }) => {
    await page.goto(
      `/forms/submitted?form=pending&clientName=Jane+Client&dealId=${MOCK_DEAL_ID}&dealName=Jane+Client+-+Buyer+consultation`,
    );

    await expect(page.getByText("FUB Deal", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText("Jane Client - Buyer consultation"),
    ).toBeVisible();
    await expect(page.getByText(`FUB deal ID: ${MOCK_DEAL_ID}`)).toBeVisible();
    await expect(page.getByText("Form", { exact: true })).toHaveCount(0);
  });

  test("hides the FUB deal row entirely when no deal was created", async ({ page }) => {
    await page.goto("/forms/submitted?form=pending&clientName=Jane+Client");

    await expect(page.getByRole("heading", { name: /submitted/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("FUB Deal", { exact: true })).toHaveCount(0);
  });

  test("renders the shared app footer", async ({ page }) => {
    await page.goto("/forms/submitted?form=pending&clientName=Jane+Client");

    const footerLink = page.getByRole("link", { name: /bara agency/i });
    await expect(footerLink).toBeVisible({ timeout: 15_000 });
    await expect(footerLink).toHaveAttribute("href", "https://baraagency.com/");
  });
});
