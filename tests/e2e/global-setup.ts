import { chromium, type FullConfig } from "@playwright/test";

/**
 * Vite (via Bun) lazily discovers some dependencies on first use and
 * force-reloads the page once it finishes pre-bundling them (its
 * "optimized dependencies changed. reloading" behavior). Most of the
 * app's real dependency set is pinned upfront via `optimizeDeps.include`
 * in vite.config.ts, but a few (e.g. ones only reachable through a
 * route's server loader, like the Gmail integration's `googleapis`) still
 * get discovered lazily on a cold Vite cache. If that reload lands mid
 * test it looks like a flaky app bug (lost focus, aborted axe run, stale
 * DOM), even though the app itself is fine.
 *
 * Touch the routes the suite visits once here, then give Vite a single
 * window to finish any background optimization + forced reload before
 * the real tests start. This only costs meaningful time on a cold cache
 * (fresh install / changed lockfile); once `node_modules/.vite` is warm,
 * every step below resolves immediately and this adds a fraction of a
 * second per run.
 */
const WARMUP_PATHS = [
  "/forms",
  "/forms/pending",
  "/forms/appointment-set",
  "/forms/appointment-met",
  "/forms/closed",
  "/forms/submitted",
  "/forms/settings",
];

export default async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0]?.use ?? {};
  if (!baseURL) {
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const path of WARMUP_PATHS) {
      await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
    }

    // One settle window for any reload Vite still needs to force, instead
    // of waiting after every single navigation above.
    try {
      await page.waitForEvent("load", { timeout: 15_000 });
      await page.waitForLoadState("networkidle");
    } catch {
      // No forced reload was pending — nothing to settle.
    }
  } finally {
    await browser.close();
  }
}
