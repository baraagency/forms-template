<!-- BEGIN:react-router-agent-rules -->
# This is React Router v8 Framework mode

APIs, conventions, and file structure may differ from Next.js or older React Router. Prefer docs under https://reactrouter.com and `node_modules/react-router/` / `@react-router/dev` over training-data assumptions about Next.js App Router.
<!-- END:react-router-agent-rules -->

## Template Conventions

- Bun is the local package manager and test runner (`bun run`, `bun test`); production on Heroku uses Node 22.22+ with `@react-router/serve`.
- Core reusable code lives in `app/forms/_core/` — do not import from example forms into `_core`.
- New forms: copy `pending/` pattern; add a UI route in `app/routes/` + register in `app/routes.ts`; register in `formRouterFormRegistry.ts` (+ seed `router_forms`); wire settings field catalog when adding mappable fields; add a resource route under `app/api/forms/<slug>/submit/route.ts` and register it in `app/routes.ts`.
- Settings: `/forms/settings` — password-protected when `ADMIN_PASSWORD` is set; appearance colors and hosted branding; Gmail is env-scoped; per-form tabs for visibility, recipients (`form_type`), and FUB stages/tags. SISU/FUB field mappings live in the page editor. Submit uses shared hybrid orchestrator (`app/api/_services/submissionWorkflow/`); live FUB/SISU/Gmail when keys/settings allow, otherwise skip.
- Mutually exclusive fields share one layout slot.
- Conditional fields: hide when controlling answer empty or "No"; require only when "Yes".
- `formLabel` must not include "Form" (email subjects append " Form Summary").
- On success: `navigate('/forms/submitted?...')` — never set local complete state after navigate.
- Summary email: skip when no recipients; failures show warning on submitted page, not raw errors.
- Past event dates: today or earlier in America/New_York (`app/forms/_core/formDateValidation.ts`).
- FUB embedded context: `GET /api/fub/context` (server verifies via `app/forms/_core/fubContextVerify.ts`); agent from manual/URL/client `assignedUserId` — never embedded context user id.
- Form router return URLs omit `agentId`.
- Mock APIs: fixtures in `app/api/_fixtures/`; stable IDs in `app/api/_fixtures/constants.ts`.
- Branding: built-in banner is `public/logo-banner.png`; shared header via `app/forms/_core/FormBanner.tsx`. A hosted logo URL + alt text is editable at `/forms/settings` → Branding and is also used in summary emails/FUB notes; blank uses the built-in banner in the app and omits the logo from emails/notes.
- Visual design (canonical): [Interface Design System](https://app.notion.com/p/3d8a4516f72b81ffaff9cfdf161072f7) — palette, type, elevation, CTAs, motion, layout/render rules, and anti-patterns for agents adapting this template. Primitive colors/dimensions live in `tokens/primitives.json` (`bun run tokens:build` → `app/generated/`). When you change colors, typography, shadows, motion, or primary CTA chrome, update tokens + Notion + `.interface-design/system.md`.
- Framework: React Router v8 Framework mode (Vite). UI routes live in `app/routes/*.tsx`; HTTP APIs are resource routes (`loader`/`action`, no default component) under `app/api/**/route.ts`, registered in `app/routes.ts`.

## Pending Example

- Multi-section intake; SISU prefill via `app/forms/_core/sisuTransactionLookup.ts`.
- Submit: `POST /api/forms/pending/submit` → shared submission workflow.
- Resubmission prefill: when a form opens with a `dealId`, the loader loads the latest successful `form_submissions` row for that deal into `previousSubmissionFormData` (including `sisuTransactionId` when stored).

## Appointment Set Example

- Client Info + Appointment Information sections (layout from the reference appointment-set form).
- ISA options from `GET /api/sisu/team-agents?role_filter=ISISA`; OSA from `GET /api/fub/users`; Appointment Type from `GET /api/fub/appointment-types` (live FUB `/appointmentTypes` when keyed, else fixture) — placeholders when unavailable.
- Submit: `POST /api/forms/appointment-set/submit` → shared submission workflow + FUB appointment create (hook).

## Appointment Met Example

- Client Info + Disposition Details sections (layout from the reference appointment-met form; no client-specific office field).
- Disposition branches: Met with Customer, Customer Cancelled / No Show, Rescheduled.
- Agent Submitting from `GET /api/fub/users`; appointment outcomes hardcoded.
- Submit: `POST /api/forms/appointment-met/submit` → shared submission workflow + FUB appointment update (outcome / reschedule).
- Resubmission prefill: when a form opens with a `dealId`, the loader loads the latest successful `form_submissions` row for that deal into `previousSubmissionFormData` (including `sisuTransactionId` when stored).

## Closed Example

- Transaction Data + Transaction Dates sections (layout from usaj-app closed; no client-specific notice).
- Conditional Security Deposit / Monthly Rent when transaction type is lease or rental.
- Transaction type options from `GET /api/sisu/team-fields` with hardcoded fallbacks.
- Closed Date (past/today only) + optional Notes.
- Submit: `POST /api/forms/closed/submit` → shared submission workflow.
- Phase 1 page-editor migration: rendered from the published `form_pages` document (`app/forms/closed/closedPageDocument.ts`) via `PageRenderer`; the submit route validates against that same document.

## Pages

- `/forms` — form router (pending, appointment-set, appointment-met, closed); visibility from `router_forms`
- `/forms/settings` — Appearance (primary/secondary colors), Branding (hosted logo URL/alt), Gmail (shared), and per-form settings (recipients, FUB stages/tags)
- `/forms/pending` — pending reference form (data-driven page)
- `/forms/appointment-set` — appointment set reference form (data-driven page)
- `/forms/appointment-met` — appointment met reference form (data-driven page)
- `/forms/closed` — closed reference form (data-driven page)
- `/forms/pending/edit` — admin-only Puck page editor for Pending
- `/forms/appointment-set/edit` — admin-only Puck page editor for Appointment Set
- `/forms/appointment-met/edit` — admin-only Puck page editor for Appointment Met
- `/forms/closed/edit` — admin-only Puck page editor for Closed
- `/forms/submitted` — confirmation

## Learned User Preferences

- When adapting forms from client apps, strip client-specific branding, labels, and notices; keep this project's visual design.
- New example forms should call the shared submission workflow after validate/normalize; put form-specific side effects in workflow hooks.
- Keep shared form controls, section/divider spacing, and date picker sizing visually consistent with the Pending form reference (picker must fit its viewport without scrolling, especially on mobile).
- When opening the form router in a new tab, include only `clientId` in the URL—not FUB embedded `context`/`signature` params.
- Settings mapping tables: labels only (hide field slugs); rows sorted by form appearance order; SISU / FUB Person / FUB Deal in tabs in one container; target fields are clearable Selects where cleared means disabled (no Enabled column); Save belongs outside the table (not in an Actions column); fixed-height scroll viewport with infinite scroll (10 rows per batch).
- Email recipients: no Active toggle—remove a row to disable; editable emails; add-email input above the list.
- FUB Person tag settings: Beui multi-select per Buyer/Seller; options from FUB tag catalog; allow custom tags; auto-save on change.
- Submitted confirmation page: no separate Form row in the summary (page title carries the form name); workflow/integration warnings on the page, not raw API errors.
- Keep local Docker/Postgres test database setup out of the repo; use it only for local testing.
- Form display order on `/forms` and `/forms/settings`: Appointment Set, Appointment Met, Pending, Closed.
- Brand colors use navy/sky with a near-black primary accent (`--palette-1` `#1E1E1E`); primary CTAs share solid black fill + border with centered text; page/section titles use DM Serif Display (settings page titles only), font-weight 500; form sections get a divider under the section header before fields, not above the section.
- New form fields and controls: use shared `_core` a11y helpers (`FieldError`, `fieldA11yProps`, `FormValidationSummary`, `SkipToMain`) and `error`/`disabled`/`readOnly` state props; target WCAG 2.1 AA—see `docs/a11y.md`.

## Learned Workspace Facts

- Reusable forms template (GitHub slug `forms-template`); visual design reference in Notion: [Interface Design System](https://app.notion.com/p/3d8a4516f72b81ffaff9cfdf161072f7) (update when tokens or CTA chrome change).
- Accessibility: WCAG 2.1 AA target; canonical guide `docs/a11y.md`; `test:a11y` and CI a11y workflow are advisory until `STRICT_A11Y=1` or the workflow gate is enabled.
- Form prefill: draft cache (`formDraftCache.ts`) uses `localStorage` by `personId` + form type (fill-only merge, clear on submit); with `dealId` in URL, `buildFormLoaderData` loads latest successful `form_submissions` into `previousSubmissionFormData` (including `sisuTransactionId`); successful workflow patches stored `form_data` with resolved `dealId` and `sisuTransactionId`.
- Settings SISU team-fields and FUB person/deal field option catalogs use live APIs when the corresponding API keys are set; otherwise fixtures.
- `/api/fub/users`, `/api/fub/people`, `/api/fub/deals`, `/api/fub/appointment-types`, and `/api/fub/tags` use live FUB when `FUB_API_KEY` is set; otherwise fixtures. Appointment Type values use FUB `/appointmentTypes` element `id`. Tag catalog aggregates unique tags from live people (`fields=tags`). Deals stay on fixtures when `DEMO_MODE=true` even if a FUB key is present (form deal pickers show live deals only when Demo Mode is off). Demo mode (UI label, not "Local demo mode") is active only when `DEMO_MODE=true`. FUB deal create requires `name`, `stageId`, and `peopleIds`; do not send `personId` or a string `stage` field.
- FUB submission notes (`buildFormSubmissionSummary`): bordered HTML tables themed with the resolved appearance colors and hosted logo; labels from the field catalog; values formatted with the same display rules as the forms.
- SISU writes require enabled mappings with non-empty `sisu_field_name`; the Client Type field (`clientType`/`leadType`) is locked to SISU's `type_id`, normalized Buyer/Seller → `b`/`s` (see `normalizeSisuClientTypeFields.ts`); set `agent_id` by resolving submitting FUB user email via `POST /v1/agent/find-agent` (omit on failure; appointment-met uses `agentSubmitting || agentId`).
- FUB form settings split into Person (Buyer/Seller `client_type` stages, tags) and Deal (Buyer/Seller stages; no tags); person stages from `/api/fub/stages`, deal stages from `/api/fub/pipelines`; person tags via Beui multi-select (catalog `GET /api/fub/tags`, custom tags allowed, bulk save `PUT /api/forms/settings/fub/tags`). Field mappings are edited per field in the page editor.
- When `ADMIN_PASSWORD` is set, settings auth uses `settings_admin_auth` HttpOnly session cookie via `POST /api/forms/settings/auth`; all `/api/forms/settings/*` routes enforce it.
- Page editor Phase 2: Puck (`@puckeditor/core`) edits all four example forms. Page documents live in `form_pages.draft/published` JSONB; field identity is `props.id` and is the key used by SISU/FUB mapping rows. Publishing snapshots SISU team fields, SISU agents, SISU vendors, FUB users, and FUB appointment types into the document. Editor pages and `/api/forms/page/*` require `ADMIN_PASSWORD` **and** a valid admin cookie (unlike Settings, no password means no editor). Public pages render with `PageRenderer` and never import Puck. Hidden legacy Pending keys (e.g. `agent2`, `office`, `commissionDelivery`) still submit through the legacy state merge.
- Phase 3 mappings: per-field SISU/FUB Person/FUB Deal mapping controls live in the editor inspector (auto-save, clear = unmapped, Client Type locked to SISU `type_id`). `PUT /api/forms/page/:form/mappings` upserts all three tables. Publishing prunes mapping rows for fields present in the previous published document but removed now; Pending's hidden legacy keys are never in the document, so their mappings are untouched. Summary emails/FUB notes use published document labels first, then legacy catalog entries. Creating new forms is Phase 4.
- Phase 2 field model: `time` and `percentage` kinds; option sources `sisu`, `sisuAgents`, `sisuVendors`, `fubUsers`, `fubAppointmentTypes`, `usStates`; `optionFilter` selects the agent role or vendor group; `disableWhenEmpty` disables a dynamic select until options exist. Phone/email render with communication icons.
- Appearance settings (`/forms/settings`): **primary = structure** (headings, labels, page wash, body text; maps to `--palette-2`) and **secondary = actions** (primary CTAs, selected states, focus accents; maps to `--palette-1`). `app/theme/appTheme.ts` derives AA-safe tokens; `app/root.tsx` injects them as `:root:root` CSS variables and feeds MUI; defaults stay in `tokens/primitives.json`. Summary emails and FUB notes use the same resolved colors; the summary email is `multipart/alternative` (HTML + plain text).
- Branding settings: hosted logo URL + alt stored in `app_theme_settings.logo_url/logo_alt`; `FormBanner` uses it with an on-error fallback to `/logo-banner.png`; the same logo is embedded in summary-email/FUB-note HTML. The URL is validated as absolute http(s) and never fetched server-side.
- Submitted page (`/forms/submitted`): FUB Deal card shows deal name when created (deal ID as caption); hides when no deal; workflow passes `dealName` through redirect query params; skipped/failed workflow steps surface via `workflowWarning` (same pattern as `emailWarning`).
- Global footer (`AppFooter` in root layout): "Created by Bara Agency" linking to https://baraagency.com/.
- Deploy target is Heroku (Node 22.22+, `Procfile` → `release: npm run db:migrations` then `web: npm run start` / `@react-router/serve`); `scripts/db/migrate.ts` and local dev (`loadProjectEnv.ts`, Vite `.env` merge, `npm run dev` with `--env-file=.env`) load integration keys from `.env` without requiring a server restart.
