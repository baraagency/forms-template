import { expect, test } from "@playwright/test";

test.describe("Settings admin password gate", () => {
  test.skip(
    !process.env.ADMIN_PASSWORD,
    "ADMIN_PASSWORD is unset, so /forms/settings never shows the login panel.",
  );

  test("rejects an incorrect admin password", async ({ page }) => {
    await page.goto("/forms/settings");

    await expect(page.getByRole("heading", { name: /form settings/i })).toBeVisible({
      timeout: 15_000,
    });
    const passwordField = page.getByLabel(/admin password/i);
    await expect(passwordField).toBeVisible();

    await passwordField.fill("definitely-not-the-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.locator(".bara-notice")).toContainText(/invalid password/i);
    await expect(passwordField).toBeVisible();
  });

  test("unlocks the settings tabs with the correct admin password", async ({ page }) => {
    await page.goto("/forms/settings");

    const passwordField = page.getByLabel(/admin password/i);
    await expect(passwordField).toBeVisible({ timeout: 15_000 });

    await passwordField.fill(process.env.ADMIN_PASSWORD ?? "");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(passwordField).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole("tab", { name: /appointment set/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
