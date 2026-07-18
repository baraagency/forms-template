<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Template Conventions

- Bun is the runtime and package manager; use `bun run` for scripts.
- Core reusable code lives in `app/forms/_core/` — do not import from example forms into `_core`.
- New forms: copy `pending/` pattern; register in `formRouterFormRegistry.ts` (+ seed `router_forms`); wire settings field catalog when adding mappable fields.
- Settings: `/forms/settings` — public; Gmail is env-scoped; per-form tabs for visibility, recipients (`form_type`), and SISU/FUB mappings. Only router visibility is live; submits stay mocked.
- Mutually exclusive fields share one layout slot.
- Conditional fields: hide when controlling answer empty or "No"; require only when "Yes".
- `formLabel` must not include "Form" (email subjects append " Form Summary").
- On success: `router.push('/forms/submitted')` — never set local complete state after navigate.
- Summary email: skip when no recipients; failures show warning on submitted page, not raw errors.
- Past event dates: today or earlier in America/New_York (`app/forms/_core/formDateValidation.ts`).
- FUB embedded context: `GET /api/fub/context` (server verifies via `app/forms/_core/fubContextVerify.ts`); agent from manual/URL/client `assignedUserId` — never embedded context user id.
- Form router return URLs omit `agentId`.
- Mock APIs: fixtures in `app/api/_fixtures/`; stable IDs in `app/api/_fixtures/constants.ts`.
- Branding: replace `public/form-banner.svg`; shared header via `app/forms/_core/FormBanner.tsx`.

## Pending Example

- Multi-section intake; SISU prefill via `app/forms/_core/sisuTransactionLookup.ts`.
- Submit: `POST /api/forms/pending/submit` returns mock success JSON.
- Resubmission prefill: disabled in template (`previousSubmissionFormData={null}`).

## Appointment Set Example

- Client Info + Appointment Information sections (layout from jeff-cook appointment-set).
- ISA options from `GET /api/sisu/team-agents?role_filter=ISISA`; OSA from `GET /api/fub/users` — placeholders when unavailable.
- Submit: `POST /api/forms/appointment-set/submit` returns mock success JSON.

## Appointment Met Example

- Client Info + Disposition Details sections (layout from jeff-cook appointment-met; no JCRE Office field).
- Disposition branches: Met with Customer, Customer Cancelled / No Show, Rescheduled.
- Agent Submitting from `GET /api/fub/users`; appointment outcomes hardcoded.
- Submit: `POST /api/forms/appointment-met/submit` returns mock success JSON.
- Resubmission prefill: disabled in template (`previousSubmissionFormData={null}`).

## Closed Example

- Transaction Data + Transaction Dates sections (layout from usaj-app closed; no client-specific notice).
- Conditional Security Deposit / Monthly Rent when transaction type is lease or rental.
- Transaction type options from `GET /api/sisu/team-fields` with hardcoded fallbacks.
- Closed Date (past/today only) + optional Notes.
- Submit: `POST /api/forms/closed/submit` returns mock success JSON.

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
- New example forms should use template-style mock submit APIs (fixture success JSON), not full production integrations.
- Keep shared form controls and section/divider spacing visually consistent with the Pending form reference (e.g. submit button size, FieldGroup spacing).
- Shared date picker should fit fully in its viewport without scrolling, especially on mobile.
- Settings mapping tables: show form field labels; SISU/FUB target fields are clearable Selects where cleared means disabled (no Enabled column).
- Email recipients: no Active toggle—remove a row to disable; editable emails; add-email input above the list.
- Prefer paginated settings mapping tables (5 rows/page), matching the usaj-app pattern.
- Keep local Docker/Postgres test database setup out of the repo; use it only for local testing.

## Learned Workspace Facts

- This repo is the reusable forms template (GitHub slug `forms-template`) for future form projects.
- Production form layouts are often referenced from sibling apps such as `jeff-cook-app` and `usaj-app`; implement against this template's patterns and styling.
- Settings SISU team-fields and FUB person/deal field option catalogs use live APIs when the corresponding API keys are set; otherwise fixtures.
- FUB form settings split into Person (stage, tags, mappings) and Deal (stage, mappings; no tags); person stages from `/api/fub/stages`, deal stages from `/api/fub/pipelines`.
- Email recipients are per-form via `form_type` and need not be unique across forms.
