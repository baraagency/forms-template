# Puck Page Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship a Puck-based, admin-only page editor for the Closed form, with drafts and publishing in Postgres, and render/submit the published page without loading Puck on public routes.

**Architecture:** Puck is the editing surface only. The stored document is a flat list of five block types (`PageTitle`, `SectionHeader`, `Divider`, `TextBlock`, `FieldBlock`) with field identity in `props.id`. A pure parser/validator guards the document; a plain `PageRenderer` renders it on public pages; the editor writes drafts with optimistic concurrency and snapshots SISU options on publish. Phase 1 migrates only Closed.

**Tech Stack:** React 19.2, React Router 8 (framework mode), MUI 9, Bun, Postgres, `@puckeditor/core@^0.23.0`.

**Spec:** `docs/superpowers/specs/2026-10-27-puck-page-editor-design.md`

## Global Constraints

- Node 22.22+, Bun for install/test, React 19.2.7, React Router 8, MUI 9.
- Add only `@puckeditor/core@^0.23.0`; no other runtime dependency.
- No S3 or hosted CMS. Page documents live in Postgres `jsonb`.
- Phase 1 changes only Closed. Do not migrate Appointment Set, Appointment Met, or Pending.
- Editor pages and write APIs require `ADMIN_PASSWORD` configured **and** a valid admin cookie. No password means no editor.
- Preserve Closed behavior: URL prefill, `formDraftCache`, SISU transaction prefill, past-only settlement date, lease/rental conditional fields, submitted redirect.
- Use `_core` a11y helpers (`FieldError`, `fieldA11yProps`, `FormValidationSummary`) and WCAG 2.1 AA.
- Never render user text as HTML.
- Finish with `bun test app`, `bun run typecheck`, `bun run lint`.

## Review Focus

- Hidden required fields must not block submit or appear in the payload.
- A field added in the editor must reach submit; if not, publish must reject it.
- A stale autosave must not overwrite a newer version.
- The editor must be inaccessible when `ADMIN_PASSWORD` is unset or the cookie is invalid.
- Choice values must validate against the SISU snapshot from publish, not a live catalog or client options.

---

## File Structure

```
app/forms/editor/
  formPageTypes.ts        formPageData.ts        formPageVisibility.ts
  formPageValidation.ts   formPageSubmission.ts  formPagePublish.ts
  fieldOptions.ts         formPageConfig.tsx     FormRuntime.tsx
  PageRenderer.tsx        PageEditorButton.tsx
  blocks/                 PageTitleBlock, SectionHeaderBlock, DividerBlock,
                          TextBlock, FieldBlock, FieldTooltip, VisibilityRulesField
  PuckPageEditor.tsx      usePageAutosave.ts     createSaveQueue.ts
app/forms/closed/
  closedPageDocument.ts   closedPageValues.ts    ClosedPageFormClient.tsx
  closedPageSubmit.ts
app/api/_services/
  formPageQueries.ts      formPageService.ts     sisuTeamFieldsService.ts
app/api/forms/page/[form]/
  draft/route.ts          publish/route.ts
app/routes/forms.$slug.edit.tsx
db/migrations/021_create_form_pages.sql
```

---

### Task 1: Document types and parser

**Files:**
- Modify: `package.json`, `bun.lock`
- Create: `app/forms/editor/formPageTypes.ts`, `app/forms/editor/formPageData.ts`
- Test: `app/forms/editor/__tests__/formPageData.test.ts`

**Interfaces:**
- Produces: `FieldKind`, `FieldOption`, `FieldValue = string | string[]`, `VisibilityRule`, `FieldBlockProps`, `PageBlockType`, `FormPageData`, `ParseResult`
- Produces: `parseFormPageData(value, options?: { forPublish?: boolean }): ParseResult`
- Produces: `collectPageFields(data): FieldBlockProps[]`
- Constants: `MAX_PAGE_BLOCKS = 200`, `MAX_PAGE_BYTES = 262_144`

- [x] **Step 1: Install Puck**

Run: `bun add @puckeditor/core@^0.23.0`
Expected: only `package.json` and `bun.lock` change.

- [x] **Step 2: Write the failing parser tests**

Cases: accepts a valid flat page and collects fields in order; rejects duplicate ids, unknown block types, non-empty `zones`, missing/self/cyclic visibility references, and >200 blocks; allows a choice with no options as a draft but rejects it with `{ forPublish: true }`.

```ts
const validField = { id: "clientType", label: "Client Type", kind: "choice", required: true,
  options: [{ label: "Buyer", value: "Buyer" }] };
const page = (content: unknown[]) => ({ content, root: { props: {} } });

it("collects fields in order", () => {
  const result = parseFormPageData(page([
    { type: "PageTitle", props: { id: "title", text: "Closed" } },
    { type: "FieldBlock", props: validField },
  ]));
  expect(result.ok).toBe(true);
  if (result.ok) expect(collectPageFields(result.data).map((f) => f.id)).toEqual(["clientType"]);
});

it("rejects duplicate ids and bad visibility references", () => {
  const duplicate = parseFormPageData(page([
    { type: "PageTitle", props: { id: "x", text: "A" } },
    { type: "PageTitle", props: { id: "x", text: "B" } },
  ]));
  expect(duplicate.ok).toBe(false);
  const missing = parseFormPageData(page([
    { type: "FieldBlock", props: { ...validField, visibleWhen: [{ fieldId: "nope", operator: "isFilled" }] } },
  ]));
  expect(missing.ok).toBe(false);
});

it("requires options on publish but not on draft", () => {
  const doc = page([{ type: "FieldBlock", props: { ...validField, options: [] } }]);
  expect(parseFormPageData(doc).ok).toBe(true);
  expect(parseFormPageData(doc, { forPublish: true }).ok).toBe(false);
});
```

- [x] **Step 3: Run and expect failure**

Run: `bun test app/forms/editor/__tests__/formPageData.test.ts`
Expected: FAIL — module not found.

- [x] **Step 4: Implement**

Validate object shape, block count, allowed types, string/unique `props.id`, empty `zones`, field kind, non-empty label, boolean required, option source, SISU key, option shape, and visibility references (no self, no cycles). On publish, require options for `choice`/`multiChoice` unless `optionSource` is `usStates` (preset). Return `{ ok: true, data }` or `{ ok: false, error }`.

- [x] **Step 5: Verify and commit**

Run: `bun test app/forms/editor/__tests__/formPageData.test.ts` → PASS.

```bash
git add package.json bun.lock app/forms/editor/formPageTypes.ts app/forms/editor/formPageData.ts app/forms/editor/__tests__/formPageData.test.ts
git commit -m "feat(editor): add page document types and parser"
```

---

### Task 2: Visibility and field validation

**Files:**
- Create: `app/forms/editor/formPageVisibility.ts`, `app/forms/editor/formPageValidation.ts`, `app/forms/editor/fieldOptions.ts`
- Create: `app/forms/_core/usStates.ts`
- Test: `app/forms/editor/__tests__/formPageVisibility.test.ts`, `.../formPageValidation.test.ts`, `.../fieldOptions.test.ts`

**Interfaces:**
- Produces: `isPageFieldVisible(field, fieldsById, values, stack?): boolean`
- Produces: `getVisiblePageFields(fields, values): FieldBlockProps[]`
- Produces: `validatePageValues(fields, values): Record<string, string>`
- Produces: `resolveFieldOptions(field): FieldOption[]`

- [x] **Step 1: Write failing tests**

Visibility: `in` matches option value or label; a hidden controller hides dependants; only visible fields return in order.

Validation: required visible fields error; optional empties pass; choice values outside the snapshot error; `$1,234.56` passes currency; `abc` fails; future dates fail `dateConstraint: "past"`; older dates pass. Options: manual returns stored options; `usStates` returns 50 with `{ label: "AL", value: "AL" }` first; SISU returns the stored snapshot.

```ts
it("matches labels and values", () => {
  const fields = new Map([[deposit.id, deposit], [transactionType.id, transactionType]]);
  expect(isPageFieldVisible(deposit, fields, { transactionType: "lease" })).toBe(true);
  expect(isPageFieldVisible(deposit, fields, { transactionType: "none" })).toBe(false);
});

it("skips hidden required fields and resolves the state preset", () => {
  expect(validatePageValues([optional], {})).toEqual({});
  expect(validatePageValues([choice], { state: "GA" }).state).toBeTruthy();
  expect(resolveFieldOptions({ id: "state", label: "State", kind: "choice", required: true, optionSource: "usStates" })).toHaveLength(50);
});
```

- [x] **Step 2: Run and expect failure**

Run: `bun test app/forms/editor/__tests__/formPageVisibility.test.ts app/forms/editor/__tests__/formPageValidation.test.ts app/forms/editor/__tests__/fieldOptions.test.ts`
Expected: FAIL — modules not found.

- [x] **Step 3: Implement**

Rules are ANDed; compare case-insensitively against the selected value or the selected option's label (resolve controller options with `resolveFieldOptions`); `in` matches any; `isFilled`/`isEmpty` handle strings and arrays. A hidden controller makes dependants hidden; guard cycles.

`resolveFieldOptions` returns `US_STATE_OPTIONS` for `usStates`, the stored snapshot for `sisu`, and `options ?? []` for manual. Validation uses it, so a `usStates` field with no stored `options` still validates.

Validation only sees visible fields. Required checks trimmed strings/arrays. Choice values must be in `resolveFieldOptions(field)`. Numbers/currency parse finite numbers. Dates use `isFormDateOnOrBeforeToday` / `isFormDateOnOrAfterToday` for `past`/`future`. Email is a minimal regex; phone needs 7 digits.

- [x] **Step 4: Verify and commit**

Run all three test files → PASS.

```bash
git add app/forms/_core/usStates.ts app/forms/editor/formPageVisibility.ts app/forms/editor/formPageValidation.ts app/forms/editor/fieldOptions.ts app/forms/editor/__tests__/formPageVisibility.test.ts app/forms/editor/__tests__/formPageValidation.test.ts app/forms/editor/__tests__/fieldOptions.test.ts
git commit -m "feat(editor): add visibility, options, and field validation"
```

---

### Task 3: Postgres table, queries, auth, and page APIs

**Files:**
- Create: `db/migrations/021_create_form_pages.sql`, `app/api/_services/formPageQueries.ts`
- Modify: `app/types/storage.ts`, `app/api/_services/settingsAdminAuth.ts`
- Create: `app/api/forms/page/[form]/draft/route.ts`, `.../publish/route.ts`
- Modify: `app/routes.ts`
- Test: `app/api/_services/__tests__/settingsAdminAuth.test.ts`, `app/api/forms/page/__tests__/draftRoute.test.ts`, `.../publishRoute.test.ts`

**Interfaces:**
- Produces: `FormPageRow` (`form`, `draft: JsonValue`, `published: JsonValue | null`, `schema_version`, `version`, `updated_at`, `published_at`)
- Produces: `getFormPage(form): Promise<StorageResult<FormPageRow | null>>`
- Produces: `saveFormPageDraft(form, draft, expectedVersion): Promise<FormPageWriteResult>`
- Produces: `publishFormPage(form, draft, expectedVersion): Promise<FormPageWriteResult>`
- `FormPageWriteResult = { ok: true; version: number } | { ok: false; conflict: true } | { ok: false; error: string }`
- Produces: `canEditFormPages(request): boolean`, `enforcePageEditorAdmin(request): Response | null`

- [x] **Step 1: Write the migration and storage type**

```sql
CREATE TABLE IF NOT EXISTS form_pages (
  form TEXT PRIMARY KEY,
  draft JSONB NOT NULL,
  published JSONB,
  schema_version INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
```

Add `FormPageRow` to `app/types/storage.ts` and `form_pages` to `DatabaseTables` (Row/Insert/Update). Insert requires `form` and `draft`; `published` optional.

- [x] **Step 2: Write failing auth and route tests**

Auth: no password → `enforcePageEditorAdmin` 401 and `canEditFormPages` false; valid cookie → null/true.

Routes: 401 without cookie; 400 for invalid docs; 409 on stale version; 200 returns the new version. Mock `formPageQueries` with `mock.module` before importing the route (follow the existing `sisu` route tests).

```ts
const saveDraft = mock(async () => ({ ok: true, version: 2 }));
mock.module("@/app/api/_services/formPageQueries", () => ({
  getFormPage: mock(async () => ({ data: null, error: null })),
  saveFormPageDraft: saveDraft,
  publishFormPage: mock(async () => ({ ok: true, version: 2 })),
}));
const { action } = await import("../[form]/draft/route");

it("returns 409 on a stale version", async () => {
  saveDraft.mockResolvedValueOnce({ ok: false, conflict: true });
  const response = await action({ request: authedRequest(emptyDoc, 1), params: { form: "closed" } });
  expect(response.status).toBe(409);
});
```

- [x] **Step 3: Run and expect failure**

Run: `bun test app/api/_services/__tests__/settingsAdminAuth.test.ts app/api/forms/page`
Expected: FAIL — missing exports/routes.

- [x] **Step 4: Implement queries and routes**

Draft SQL:

```sql
INSERT INTO form_pages (form, draft, version) VALUES ($1, $2, 1)
ON CONFLICT (form) DO UPDATE
SET draft = EXCLUDED.draft, version = form_pages.version + 1, updated_at = NOW()
WHERE form_pages.version = $3
RETURNING version;
```

Publish sets `published = EXCLUDED.draft` and `published_at = NOW()`. Empty `RETURNING` = conflict; DB errors return `{ ok: false, error }`.

Auth helpers use `isSettingsAdminPasswordConfigured() && isSettingsAdminAuthenticated(request)`. Routes validate the form kind, enforce a 256 KB body, parse with `parseFormPageData`, and map 200/400/401/409/500. Register both routes.

- [x] **Step 5: Apply the migration and run tests**

Run: `bun run db:migrations` → migration applied.
Run: `bun test app/api/_services/__tests__/settingsAdminAuth.test.ts app/api/forms/page` → PASS.

- [x] **Step 6: Commit**

```bash
git add db/migrations/021_create_form_pages.sql app/types/storage.ts app/api/_services/formPageQueries.ts app/api/_services/settingsAdminAuth.ts app/api/_services/__tests__/settingsAdminAuth.test.ts app/api/forms/page app/routes.ts
git commit -m "feat(editor): persist page drafts and publishes"
```

---

### Task 4: SISU option snapshots on publish

**Files:**
- Create: `app/api/_services/sisuTeamFieldsService.ts`, `app/forms/editor/formPagePublish.ts`
- Modify: `app/api/sisu/team-fields/route.ts`, `app/api/forms/page/[form]/publish/route.ts`
- Test: `app/forms/editor/__tests__/formPagePublish.test.ts`, `app/api/forms/page/__tests__/publishRoute.test.ts`

**Interfaces:**
- Produces: `loadSisuTeamFieldCatalog(): Promise<StorageResult<TeamFieldCatalog>>`
- Produces: `resolvePublishedPageOptions(data, loadCatalog): Promise<{ data; warnings: string[] }>`

- [x] **Step 1: Write the failing test**

SISU field options are replaced from the catalog; manual options are untouched; a catalog failure keeps the old snapshot and returns a warning.

```ts
it("snapshots SISU options and preserves manual ones", async () => {
  const result = await resolvePublishedPageOptions(doc, async () => ({ data: catalog, error: null }));
  expect(result.data.content[0].props.options).toEqual([
    { value: "lease", label: "Lease Listing" }, { value: "none", label: "None" },
  ]);
  expect(result.data.content[1].props.options).toEqual([{ label: "A", value: "a" }]);
});
```

- [x] **Step 2: Run and expect failure**

Run: `bun test app/forms/editor/__tests__/formPagePublish.test.ts`
Expected: FAIL — module not found.

- [x] **Step 3: Implement and wire publish**

Extract the live/fixture branch from `/api/sisu/team-fields` into the service; the route becomes a wrapper. The resolver clones the document, loads the catalog once, and calls `getTeamFieldOptions(catalog, [sisuFieldKey], existingOptions)` per SISU field. Missing key or catalog failure → warning + keep snapshot.

Publish route order: parse with `{ forPublish: false }` → resolve options → parse resolved with `{ forPublish: true }` → `publishFormPage`. Return `{ version, warnings }`; catalog failure does not block publish.

- [x] **Step 4: Verify and commit**

Run `bun test app/forms/editor/__tests__/formPagePublish.test.ts app/api/forms/page` → PASS.

```bash
git add app/api/_services/sisuTeamFieldsService.ts app/api/sisu/team-fields/route.ts app/forms/editor/formPagePublish.ts app/forms/editor/__tests__/formPagePublish.test.ts app/api/forms/page/[form]/publish/route.ts app/api/forms/page/__tests__/publishRoute.test.ts
git commit -m "feat(editor): snapshot SISU options on publish"
```

---

### Task 5: Blocks, tooltip, runtime context, and Puck config

**Files:**
- Create: `app/forms/editor/FormRuntime.tsx`, `formPageConfig.tsx`
- Create: `blocks/PageTitleBlock.tsx`, `SectionHeaderBlock.tsx`, `DividerBlock.tsx`, `TextBlock.tsx`, `FieldBlock.tsx`, `FieldTooltip.tsx`, `VisibilityRulesField.tsx`

**Interfaces:**
- Consumes: `resolveFieldOptions` from Task 2
- Produces: `FormRuntimeProvider`, `useFormRuntime(): FormRuntimeValue | null`
- Produces: `FormRuntimeValue = { values; errors; setValue(id, value); disabled? }`
- Produces: `formPageConfig: Config<{ PageTitle; SectionHeader; Divider; TextBlock; FieldBlock }>`

- [x] **Step 1: Build the runtime context**

`FormRuntime.tsx` is a plain React context with no Puck import; `useFormRuntime` returns `null` outside the provider.

- [x] **Step 2: Build the blocks**

- Title, section header (with divider underneath), divider, text (`white-space: pre-line`).
- `FieldTooltip`: MUI `Tooltip` on an info button plus a visually hidden `<span id>`; merge that id into the control's `aria-describedby` alongside any `FieldError` id.
- `FieldBlock`: edit mode (or no runtime provider) renders a disabled preview; runtime mode binds `useFormRuntime`. Use `useFieldIds`/`fieldA11yProps`, `FieldError`, `TextInput`/`TextAreaInput`, `FormSelectInput`, `FormDatePickerField`. Resolve choice options with `resolveFieldOptions`. Radio/checkbox groups use `fieldset` + `legend`. Currency uses `formatCurrencyInput`; date uses `dateConstraint`.
- `VisibilityRulesField`: `createUsePuck()` reads `appState.data`, lists other `FieldBlock`s, edits `{ fieldId, operator, values }` rows.

- [x] **Step 3: Build the config**

Five components with labels, defaults, fields, and render. Field inspector fields: label, kind, display, required (radio Yes/No), multiline, tooltip, placeholder, optionSource, options array, SISU key, dateConstraint, visibleWhen custom. Keep `Divider` fieldless.

- [x] **Step 4: Verify and commit**

Run `bun run typecheck` → PASS.

```bash
git add app/forms/editor/FormRuntime.tsx app/forms/editor/blocks app/forms/editor/formPageConfig.tsx
git commit -m "feat(editor): add page blocks and Puck config"
```

---

### Task 6: Public renderer and submission builder

**Files:**
- Create: `app/forms/editor/PageRenderer.tsx`, `app/forms/editor/formPageSubmission.ts`
- Test: `app/forms/editor/__tests__/formPageSubmission.test.ts`

**Interfaces:**
- Consumes: `FormRuntimeProvider`, `useFormRuntime` (Task 5)
- Produces: `PageRenderer({ document })`
- Produces: `buildPageSubmission(document, raw): { fields; values; errors }`

- [x] **Step 1: Write the failing tests**

Cases: hidden values and their validation are dropped; a visible conditional field is validated; an editor-added field is kept; multi-select arrays normalize and reject unknown options.

```ts
it("drops hidden values and validates visible conditionals", () => {
  const hidden = buildPageSubmission(doc, {
    clientType: "Buyer", transactionType: "none", deposit: "100", extra: "x",
  });
  expect(hidden.values).toEqual({ clientType: "Buyer", transactionType: "none", extra: "x" });
  expect(hidden.errors).toEqual({});

  const visible = buildPageSubmission(doc, { clientType: "Buyer", transactionType: "lease" });
  expect(visible.errors.deposit).toBeTruthy();
});
```

- [x] **Step 2: Implement**

`PageRenderer` maps `content` to block components and imports no Puck code. `buildPageSubmission` normalizes by kind, gets visible fields, drops hidden values, validates, and returns `{ fields, values, errors }`. Missing optional values become `""` or `[]`.

- [x] **Step 3: Verify and commit**

Run the test and `bun run typecheck` → PASS.

```bash
git add app/forms/editor/PageRenderer.tsx app/forms/editor/formPageSubmission.ts app/forms/editor/__tests__/formPageSubmission.test.ts
git commit -m "feat(editor): add public renderer and submission builder"
```

---

### Task 7: Seeded Closed page document

**Files:**
- Create: `app/forms/closed/closedPageDocument.ts`
- Test: `app/forms/closed/__tests__/closedPageDocument.test.ts`

**Interfaces:**
- Produces: `CLOSED_PAGE_DOCUMENT: FormPageData`

- [x] **Step 1: Write the failing tests**

Field ids equal `getInitialClosedFormState({})` minus routing keys, in order; required ids include the current required set; `securityDeposit`/`monthlyRent` use `visibleWhen` on `transactionType` with `["Lease Listing", "Rental/Tenant"]`; `settlementDate` has `dateConstraint: "past"`.

- [x] **Step 2: Implement**

Blocks: title "Closed"; section "Transaction Data"; `clientType` (manual Buyer/Seller options, matching the current normalized values), `transactionType` (SISU `transactionType`, `CLOSED_TRANSACTION_TYPE_OPTIONS` fallback), `addressLine1`, `city`, `state` (`usStates`), `postal`, `transactionAmount` (currency, required), `securityDeposit`/`monthlyRent` (currency, required, lease/tenant visible), `totalCommissionGci` (currency, required); section "Transaction Dates"; `settlementDate` (date, required, past); `tcMarketingNotes` (multiline, optional). Include fallback snapshots so the first draft renders.

- [x] **Step 3: Verify and commit**

Run `bun test app/forms/closed/__tests__/closedPageDocument.test.ts` → PASS.

```bash
git add app/forms/closed/closedPageDocument.ts app/forms/closed/__tests__/closedPageDocument.test.ts
git commit -m "feat(closed): seed the page document"
```

---

### Task 8: Data-driven Closed page and editor button

**Files:**
- Create: `app/api/_services/formPageService.ts`, `app/forms/closed/closedPageValues.ts`, `app/forms/closed/ClosedPageFormClient.tsx`, `app/forms/editor/PageEditorButton.tsx`
- Modify: `app/routes/forms.closed.tsx`, `app/globals.css`
- Test: `app/forms/closed/__tests__/closedPageValues.test.ts`

**Interfaces:**
- Produces: `loadDraftFormPage(form, fallback): Promise<{ data; version }>`
- Produces: `loadPublishedFormPage(form, fallback): Promise<FormPageData>`
- Produces: `buildInitialClosedValues(input: { document: FormPageData; personId: string; agentId: string; dealId: string; sisuTransactionId: string; previousSubmissionFormData: JsonValue | null }): Record<string, FieldValue>`
- Produces: `PageEditorButton({ form })` — fixed bottom-right link `/forms/:slug/edit`, hidden for unknown slugs

- [x] **Step 1: Write the failing value test**

Every field seeds to `""` (or `[]`); routing keys are not in the map; previous submission values apply by field id; unknown keys are ignored.

- [x] **Step 2: Implement the service and values**

`formPageService` reads `getFormPage`, parses draft/published, and falls back to the code document on missing/error/invalid data. `closedPageValues` is pure: seed from `collectPageFields`, then overlay previous submission values by id.

- [x] **Step 3: Build the client**

Keep the banner, back link, submit button, status card, `LocalizationProvider`, and submitted redirect. Replace the hardcoded sections with `FormRuntimeProvider` + `PageRenderer`. Apply SISU transaction prefill by converting `ClosedFormState` keys to field values. Keep the draft cache for string fields. Submit via `buildPageSubmission`; POST `{ ...values, personId, agentId, dealId, sisuTransactionId }`; reuse `buildPostSubmissionHref` and `storeSubmittedDebugRecord`. Render `<PageEditorButton form="closed" />` when `canEditPage`.

- [x] **Step 4: Update the loader and delete the old client**

Loader returns `{ ...base, pageDocument: await loadPublishedFormPage("closed", CLOSED_PAGE_DOCUMENT), canEditPage: canEditFormPages(request) }`. Point the route at `ClosedPageFormClient`; delete `ClosedFormClient.tsx` once it typechecks; keep `closedFormUtils.ts`.

- [x] **Step 5: Verify and commit**

Run `bun test app/forms/closed` and `bun run typecheck` → PASS.

```bash
git add app/api/_services/formPageService.ts app/forms/closed/closedPageValues.ts app/forms/closed/ClosedPageFormClient.tsx app/forms/closed/ClosedFormClient.tsx app/forms/editor/PageEditorButton.tsx app/forms/closed/__tests__/closedPageValues.test.ts app/routes/forms.closed.tsx app/globals.css
git commit -m "feat(closed): render the page from the published document"
```

---

### Task 9: Document-aware Closed submit

**Files:**
- Create: `app/forms/closed/closedPageSubmit.ts`
- Modify: `app/api/forms/closed/submit/route.ts`
- Test: `app/forms/closed/__tests__/closedPageSubmit.test.ts`, `app/api/forms/closed/submit/__tests__/route.test.ts`

**Interfaces:**
- Produces: `buildClosedSubmission(document, payload): { errors; formState }`

- [x] **Step 1: Write the failing tests**

Editor-added fields stay in `formState`; unknown payload keys are dropped; hidden lease fields are not required for `none`; lease type requires both amounts; routing keys survive.

```ts
it("keeps added fields and applies the lease rule", () => {
  const added = { ...CLOSED_PAGE_DOCUMENT, content: [...CLOSED_PAGE_DOCUMENT.content,
    { type: "FieldBlock" as const, props: { id: "extra", label: "Extra", kind: "text" as const, required: false } }] };
  expect(buildClosedSubmission(added, { ...base, extra: "kept" }).formState.extra).toBe("kept");
  expect(buildClosedSubmission(CLOSED_PAGE_DOCUMENT, { ...base, transactionType: "none" }).errors).toEqual({});
  expect(buildClosedSubmission(CLOSED_PAGE_DOCUMENT, { ...base, transactionType: "lease" }).errors.securityDeposit).toBeTruthy();
});
```

- [x] **Step 2: Implement**

`buildClosedSubmission` calls `buildPageSubmission`, merges the four routing keys, and adds the `personId` required error. The route loads the published document with `loadPublishedFormPage("closed", CLOSED_PAGE_DOCUMENT)`, returns 400 with errors, otherwise calls `runSubmissionWorkflow` with the merged `formState`, `leadType` from `clientType`/`leadType`, and `hooks: {}`.

- [x] **Step 3: Update route tests**

Keep the existing invalid-JSON, incomplete, valid, and lease cases. Add no-row fallback and invalid-published fallback.

- [x] **Step 4: Verify and commit**

Run `bun test app/forms/closed app/api/forms/closed/submit` → PASS.

```bash
git add app/forms/closed/closedPageSubmit.ts app/forms/closed/__tests__/closedPageSubmit.test.ts app/api/forms/closed/submit/route.ts app/api/forms/closed/submit/__tests__/route.test.ts
git commit -m "feat(closed): validate submissions against the published page"
```

---

### Task 10: Editor route, autosave, and publish

**Files:**
- Create: `app/forms/editor/createSaveQueue.ts`, `usePageAutosave.ts`, `PuckPageEditor.tsx`, `app/routes/forms.$slug.edit.tsx`
- Modify: `app/routes.ts`
- Test: `app/forms/editor/__tests__/saveQueue.test.ts`, `app/routes/__tests__/pageEditorRoute.test.ts`

**Interfaces:**
- Produces: `createSaveQueue<T>(save: (data: T) => Promise<number>): (data: T) => Promise<number>`
- Produces: `usePageAutosave({ form, initialVersion }): { schedule(data: FormPageData): void; publish(data: FormPageData): Promise<{ version: number; warnings: string[] }>; status: "idle" | "saving" | "saved" | "conflict" | "error"; version: number }`
- Loader returns `{ form, formLabel, document, version }`

- [x] **Step 1: Write the failing tests**

Queue: two concurrent saves run serially and return versions 1 then 2. Loader: 404 when `ADMIN_PASSWORD` is unset or the slug is unsupported; returns the fallback draft and version 0 for an authenticated admin.

- [x] **Step 2: Implement the route**

Loader parses `params.slug` with `parseFormKindParam`, allows `closed` only, returns 404 unless `canEditFormPages`, and uses `loadDraftFormPage`. Register `route("forms/:slug/edit", "routes/forms.$slug.edit.tsx")`.

- [x] **Step 3: Implement autosave and the editor**

Queue saves on a promise chain, catching per save so one failure does not poison later saves; debounce 1 s; track `idle/saving/saved/conflict/error`. Publish cancels the pending debounce, awaits any in-flight save, posts the current data and version to `/api/forms/page/closed/publish`, returns `{ version, warnings }`, and sets `conflict` on 409.

`PuckPageEditor` uses `Puck`, `formPageConfig`, `height="100dvh"`, `iframe={{ enabled: false }}`, and `headerActions` with "Back to form", "Manage mappings" (`/forms/settings`), status text, and Puck's publish action. Lazy-load it from the route with `React.lazy` + `Suspense`, mounting only after `useIsMounted`.

- [x] **Step 4: Verify manually**

`ADMIN_PASSWORD=secret bun run dev`, sign in at `/forms/settings`, open `/forms/closed`. Check: button hidden signed out/visible signed in; edit title → `Saving…` → `Saved`; reload persists; publish updates the page; a second tab gets a conflict instead of overwriting.

- [x] **Step 5: Verify and commit**

Run both test files and `bun run typecheck` → PASS.

```bash
git add app/forms/editor/createSaveQueue.ts app/forms/editor/usePageAutosave.ts app/forms/editor/PuckPageEditor.tsx app/routes/forms.\$slug.edit.tsx app/routes.ts app/forms/editor/__tests__/saveQueue.test.ts app/routes/__tests__/pageEditorRoute.test.ts
git commit -m "feat(editor): add the admin Puck editor"
```

---

### Task 11: Documentation and full verification

**Files:**
- Modify: `AGENTS.md`, `docs/adding-a-form.md`, the spec (status), this plan (checkboxes)

- [x] **Step 1: Document the editor**

Add `/forms/closed/edit` to Pages; note `form_pages`, field id = mapping key, SISU snapshot on publish, `ADMIN_PASSWORD` requirement, and that the other three forms remain JSX. Update `docs/adding-a-form.md` with the Phase 1 workflow. Set the spec status to `Implemented (Phase 1)`.

- [x] **Step 2: Run the full checks**

```bash
bun test app
bun run typecheck
bun run lint
bun run build
```

Expected: all PASS. Then `grep -R "@puckeditor/core" build/client/assets` — matches only in the lazy editor chunk. If not, move the `Puck` import behind `React.lazy` before shipping.

- [x] **Step 3: Run a11y**

Run: `bun run test:a11y`
Expected: PASS (or the documented advisory result when `STRICT_A11Y` is unset).

- [x] **Step 4: Commit**

```bash
git add AGENTS.md docs/adding-a-form.md docs/superpowers/specs/2026-10-27-puck-page-editor-design.md docs/superpowers/plans/2026-10-27-puck-page-editor.md
git commit -m "docs(editor): document the Puck page editor"
```

---

## Phase 2+

**Phase 2 — remaining forms.** Appointment Set, then Appointment Met, then Pending. Each gets a page document using existing field keys, a page client that keeps prefill/compute logic in code, and its own plan. Pending last.

**Phase 3 — mappings in the editor.** Per-field panel reading the selected id and writing the existing mapping tables; prune or warn on publish when a field disappears; remove the mapping tabs from Settings once all forms are page-driven.

**Phase 4 — create form.** `forms/$slug`, `router_forms` row, wider `FormKind`/`SubmissionFormType`, generic submit route. Start only after all four forms use documents.

**Phase 5 — layout.** Optional columns/rows if stacked fields are not acceptable.
