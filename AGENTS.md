<!-- BEGIN:react-router-agent-rules -->
# This is React Router v8 Framework mode

APIs, conventions, and file structure may differ from Next.js or older React Router. Prefer docs under https://reactrouter.com and `node_modules/react-router/` / `@react-router/dev` over training-data assumptions about Next.js App Router.
<!-- END:react-router-agent-rules -->

## Template Conventions

- Bun is the local package manager and test runner (`bun run`, `bun test`); production on Heroku uses Node 22.22+ with `@react-router/serve`.
- Core reusable code lives in `app/forms/_core/` — do not import from example forms into `_core`.
- New forms: copy `pending/` pattern; add a UI route in `app/routes/` + register in `app/routes.ts`; register in `formRouterFormRegistry.ts` (+ seed `router_forms`); wire settings field catalog when adding mappable fields; add a resource route under `app/api/forms/<slug>/submit/route.ts` and register it in `app/routes.ts`.
- Settings: `/forms/settings` — public; Gmail is env-scoped; per-form tabs for visibility, recipients (`form_type`), and SISU/FUB mappings. Submit uses shared hybrid orchestrator (`app/api/_services/submissionWorkflow/`); live FUB/SISU/Gmail when keys/settings allow, otherwise skip.
- Mutually exclusive fields share one layout slot.
- Conditional fields: hide when controlling answer empty or "No"; require only when "Yes".
- `formLabel` must not include "Form" (email subjects append " Form Summary").
- On success: `navigate('/forms/submitted?...')` — never set local complete state after navigate.
- Summary email: skip when no recipients; failures show warning on submitted page, not raw errors.
- Past event dates: today or earlier in America/New_York (`app/forms/_core/formDateValidation.ts`).
- FUB embedded context: `GET /api/fub/context` (server verifies via `app/forms/_core/fubContextVerify.ts`); agent from manual/URL/client `assignedUserId` — never embedded context user id.
- Form router return URLs omit `agentId`.
- Mock APIs: fixtures in `app/api/_fixtures/`; stable IDs in `app/api/_fixtures/constants.ts`.
- Branding: replace `public/form-banner.svg`; shared header via `app/forms/_core/FormBanner.tsx`.
- Visual design (canonical): [Forms Template — Visual Design System](https://app.notion.com/p/3a6a4516f72b814caff0cc286f33e2bd) — palette, type, elevation, CTAs, motion, and anti-patterns for agents adapting this template. When you change colors, typography, shadows, motion, or primary CTA chrome, update that Notion page (and keep `app/globals.css`, `app/AppTheme.tsx`, and `.interface-design/system.md` in sync).
- Framework: React Router v8 Framework mode (Vite). UI routes live in `app/routes/*.tsx`; HTTP APIs are resource routes (`loader`/`action`, no default component) under `app/api/**/route.ts`, registered in `app/routes.ts`.

## Pending Example

- Multi-section intake; SISU prefill via `app/forms/_core/sisuTransactionLookup.ts`.
- Submit: `POST /api/forms/pending/submit` → shared submission workflow.
- Resubmission prefill: disabled in template (`previousSubmissionFormData={null}`).

## Appointment Set Example

- Client Info + Appointment Information sections (layout from jeff-cook appointment-set).
- ISA options from `GET /api/sisu/team-agents?role_filter=ISISA`; OSA from `GET /api/fub/users`; Appointment Type from `GET /api/fub/appointment-types` (live FUB `/appointmentTypes` when keyed, else fixture) — placeholders when unavailable.
- Submit: `POST /api/forms/appointment-set/submit` → shared submission workflow + FUB appointment create (hook).

## Appointment Met Example

- Client Info + Disposition Details sections (layout from jeff-cook appointment-met; no JCRE Office field).
- Disposition branches: Met with Customer, Customer Cancelled / No Show, Rescheduled.
- Agent Submitting from `GET /api/fub/users`; appointment outcomes hardcoded.
- Submit: `POST /api/forms/appointment-met/submit` → shared submission workflow + FUB appointment update (outcome / reschedule).
- Resubmission prefill: disabled in template (`previousSubmissionFormData={null}`).

## Closed Example

- Transaction Data + Transaction Dates sections (layout from usaj-app closed; no client-specific notice).
- Conditional Security Deposit / Monthly Rent when transaction type is lease or rental.
- Transaction type options from `GET /api/sisu/team-fields` with hardcoded fallbacks.
- Closed Date (past/today only) + optional Notes.
- Submit: `POST /api/forms/closed/submit` → shared submission workflow.

## Pages

- `/forms` — form router (pending, appointment-set, appointment-met, closed); visibility from `router_forms`
- `/forms/settings` — Gmail (shared), and per-form settings (recipients, SISU / FUB mappings)
- `/forms/pending` — pending reference form
- `/forms/appointment-set` — appointment set reference form
- `/forms/appointment-met` — appointment met reference form
- `/forms/closed` — closed reference form
- `/forms/submitted` — confirmation

## Learned User Preferences

- When adapting forms from client apps, strip client-specific branding, labels, and notices (e.g. Jeff Cook, JCRE, Usaj); keep this project's visual design.
- New example forms should call the shared submission workflow after validate/normalize; put form-specific side effects in workflow hooks.
- Keep shared form controls and section/divider spacing visually consistent with the Pending form reference (e.g. submit button size, FieldGroup spacing).
- Shared date picker should fit fully in its viewport without scrolling, especially on mobile.
- Settings mapping tables: labels only (hide field slugs); rows sorted by form appearance order; SISU / FUB Person / FUB Deal in tabs in one container; target fields are clearable Selects where cleared means disabled (no Enabled column); Save belongs outside the table (not in an Actions column).
- Email recipients: no Active toggle—remove a row to disable; editable emails; add-email input above the list.
- Prefer paginated settings mapping tables (5 rows/page), matching the usaj-app pattern.
- Keep local Docker/Postgres test database setup out of the repo; use it only for local testing.
- Form display order on `/forms` and `/forms/settings`: Appointment Set, Appointment Met, Pending, Closed.
- Brand colors use navy/sky with a near-black primary accent (`--palette-1` `#1E1E1E`); primary CTAs share solid black fill + border with centered text.
- New form fields and controls: use shared `_core` a11y helpers (`FieldError`, `fieldA11yProps`, `FormValidationSummary`, `SkipToMain`) and `error`/`disabled`/`readOnly` state props; target WCAG 2.1 AA—see `docs/a11y.md`.
- Page titles and container/section headers use DM Serif Display (on settings, reserve it for those only); page titles at font-weight 500; form sections get a divider under the section header before fields, not above the section.

## Learned Workspace Facts

- Reusable forms template (GitHub slug `forms-template`); visual design reference in Notion: [Forms Template — Visual Design System](https://app.notion.com/p/3a6a4516f72b814caff0cc286f33e2bd) (update when tokens or CTA chrome change).
- Accessibility: WCAG 2.1 AA target; canonical guide `docs/a11y.md`; `test:a11y` and CI a11y workflow are advisory until `STRICT_A11Y=1` or the workflow gate is enabled.
- Form draft cache (`formDraftCache.ts`): `localStorage` keyed by `personId` + form type; save on field change, restore on load (fill-only merge), clear on successful submit.
- Production form layouts are often referenced from sibling apps such as `jeff-cook-app` and `usaj-app`; implement against this template's patterns and styling.
- Settings SISU team-fields and FUB person/deal field option catalogs use live APIs when the corresponding API keys are set; otherwise fixtures.
- `/api/fub/users`, `/api/fub/people`, `/api/fub/deals`, and `/api/fub/appointment-types` use live FUB when `FUB_API_KEY` is set; otherwise fixtures. Appointment Type values use FUB `/appointmentTypes` element `id`. Deals stay on fixtures when `DEMO_MODE=true` even if a FUB key is present (form deal pickers show live deals only when Demo Mode is off). Demo mode (UI label, not "Local demo mode") is active only when `DEMO_MODE=true`.
- Appointment Set Appointment Location options are Phone, Video Call, and Other Address only (address fields required when Other Address).
- FUB deal create requires `name` and `stageId` (plus `peopleIds`); do not send `personId` or a string `stage` field.
- SISU writes require enabled mappings with non-empty `sisu_field_name`; normalize Buyer/Seller to `client_type` `0`/`1` and `type_id` `b`/`s`; set `agent_id` by resolving submitting FUB user email via `POST /v1/agent/find-agent` (omit on failure; appointment-met uses `agentSubmitting || agentId`).
- FUB form settings split into Person (stage, tags, mappings) and Deal (stage, mappings; no tags); person stages from `/api/fub/stages`, deal stages from `/api/fub/pipelines`.
- Email recipients are per-form via `form_type` and need not be unique across forms.
- Deploy target is Heroku (Node 22.22+, `Procfile` → `npm run start` / `@react-router/serve`).
