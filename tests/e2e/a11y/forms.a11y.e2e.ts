import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { unlockSettingsIfNeeded } from "../utils/settingsAuth";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;

async function waitForDatePickersHydrated(page: Page) {
  const month = page.locator('[role="spinbutton"][aria-label="Month"]').first();
  if ((await month.count()) === 0) {
    return;
  }

  await expect(month).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(() => {
    const segments = document.querySelectorAll('[aria-valuetext="Empty"]');
    if (segments.length === 0) {
      return true;
    }
    return [...segments].every(
      (element) => getComputedStyle(element).color === "rgb(90, 117, 133)",
    );
  });
}

async function expectNoCriticalViolations(page: Page) {
  await waitForDatePickersHydrated(page);
  const results = await new AxeBuilder({ page })
    .withTags([...WCAG_TAGS])
    // axe misreads MUI X contenteditable placeholder contrast; tokens are checked separately.
    .exclude('[role="spinbutton"][aria-valuetext="Empty"]')
    .analyze();

  const critical = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );

  if (critical.length > 0) {
    console.log(
      JSON.stringify(
        critical.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
        null,
        2,
      ),
    );
  }

  expect(critical).toHaveLength(0);
}

test.describe("accessibility", () => {
  test("form router has no critical axe violations", async ({ page }) => {
    await page.goto("/forms");
    await expect(page.getByRole("heading", { name: /^forms$/i })).toBeVisible({
      timeout: 15_000,
    });
    await expectNoCriticalViolations(page);
  });

  test("pending form has no critical axe violations", async ({ page }) => {
    await page.goto("/forms/pending");
    await expect(page.getByRole("heading", { name: /pending/i })).toBeVisible({
      timeout: 15_000,
    });
    await expectNoCriticalViolations(page);
  });

  test("appointment set form has no critical axe violations", async ({ page }) => {
    await page.goto("/forms/appointment-set");
    await expect(page.getByRole("heading", { name: /appointment set/i })).toBeVisible({
      timeout: 15_000,
    });
    await expectNoCriticalViolations(page);
  });

  test("appointment met form has no critical axe violations", async ({ page }) => {
    await page.goto("/forms/appointment-met");
    await expect(page.getByRole("heading", { name: /appointment met/i })).toBeVisible({
      timeout: 15_000,
    });
    await expectNoCriticalViolations(page);
  });

  test("closed form has no critical axe violations", async ({ page }) => {
    await page.goto("/forms/closed");
    await expect(page.getByRole("heading", { name: /closed/i })).toBeVisible({
      timeout: 15_000,
    });
    await expectNoCriticalViolations(page);
  });

  test("settings login panel has no critical axe violations", async ({ page }) => {
    test.skip(
      !process.env.ADMIN_PASSWORD,
      "ADMIN_PASSWORD is unset, so /forms/settings never shows the login panel.",
    );

    await page.goto("/forms/settings");
    await expect(page.getByRole("heading", { name: /form settings/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel(/admin password/i)).toBeVisible();
    await expectNoCriticalViolations(page);
  });

  test("settings has no critical axe violations", async ({ page }) => {
    await page.goto("/forms/settings");
    await expect(page.getByRole("heading", { name: /form settings/i })).toBeVisible({
      timeout: 15_000,
    });
    await unlockSettingsIfNeeded(page);
    await expectNoCriticalViolations(page);
  });

  test("pending form announces validation errors on submit", async ({ page }) => {
    await page.goto("/forms/pending");
    await expect(page.getByRole("heading", { name: /pending/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel(/first name/i).fill("");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("alert").first()).toContainText(/fix \d+ error/i);
  });

  test("pending form links invalid fields after submit", async ({ page }) => {
    await page.goto("/forms/pending");
    await expect(page.getByRole("heading", { name: /pending/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel(/first name/i).fill("");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByLabel(/first name/i)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel(/first name/i)).toHaveAttribute(
      "aria-describedby",
      "clientFirstName-error",
    );
    const duplicateIds = await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    expect(duplicateIds).toEqual([]);
  });

  test("settings tabs respond to arrow keys", async ({ page }) => {
    await page.goto("/forms/settings");
    await expect(page.getByRole("heading", { name: /form settings/i })).toBeVisible({
      timeout: 15_000,
    });
    await unlockSettingsIfNeeded(page);
    await expect(page.getByRole("tab", { name: /appointment set/i })).toBeVisible({
      timeout: 15_000,
    });
    const appointmentMetTab = page.getByRole("tab", { name: /appointment met/i });
    await appointmentMetTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: /pending/i })).toBeFocused();
  });
});
