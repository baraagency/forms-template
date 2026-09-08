import { expect, type Page } from "@playwright/test";

/**
 * /forms/settings is gated behind an admin password login panel whenever
 * ADMIN_PASSWORD is set on the dev server (see app/api/_services/settingsAdminAuth.ts).
 * It's unset by default (per .env.example), but may be configured locally or in CI.
 *
 * Call this right after navigating to /forms/settings and before interacting
 * with the settings tabs/panels; it's a no-op when the login panel isn't shown.
 */
export async function unlockSettingsIfNeeded(page: Page) {
  const passwordField = page.getByLabel(/admin password/i);
  if ((await passwordField.count()) === 0) {
    return;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "The settings page is showing an admin password prompt, but no " +
        "ADMIN_PASSWORD env var is available to the Playwright test runner " +
        "to log in with.",
    );
  }

  await passwordField.fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(passwordField).toHaveCount(0, { timeout: 15_000 });
}
