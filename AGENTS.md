<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Template Conventions

- Bun is the runtime and package manager; use `bun run` for scripts.
- Core reusable code lives in `app/forms/_core/` — do not import from example forms into `_core`.
- New forms: copy `pending/` pattern; register in `FormRouterClient.tsx`.
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

## Pages

- `/forms` — form router (pending, appointment-set)
- `/forms/pending` — pending reference form
- `/forms/appointment-set` — appointment set reference form
- `/forms/submitted` — confirmation
