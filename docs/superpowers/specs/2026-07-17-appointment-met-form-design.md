# Appointment Met Form — Design Spec

**Date:** 2026-07-17  
**Status:** Approved / implemented  
**Approach:** Clone `appointment-set` scaffold; reshape fields/sections to match jeff-cook Appointment Met (minus JCRE fields); mock submit like other template forms.

## Goal

Add an **Appointment Met** form template at `/forms/appointment-met` that replicates the layout and fields of jeff-cook’s Appointment Met form, while keeping this project’s visual design and mock-API patterns.

## Non-goals

- Real FUB appointment outcome/stage updates
- SISU custom-field sync
- Follow-up task creation / background jobs
- DB persistence of submissions
- Changing branding or introducing a new visual system
- Touching the pending form’s existing `jcreOffice` field

## Constraints (from product decisions)

- **Submit:** template-style mock (`POST` returns fixture JSON)
- **JCRE:** omit `jcreOffice` / any field whose label contains “JCRE”
- **Visual:** reuse `page-form`, `SectionCard`, `Row`, `@baraagency/components`, existing CSS tokens
- **Resubmission:** `previousSubmissionFormData={null}` (same as other template forms)
- **Success:** `router.push` to `/forms/submitted` via `buildPostSubmissionHref` — never set local complete state after navigate
- **`formLabel`:** `Appointment Met` (no “Form” suffix)

## Form structure

### Route & registration

| Item | Value |
|------|--------|
| Path | `/forms/appointment-met` |
| Router key | `appointment-met` |
| Title | Appointment Met |
| Description | Capture appointment disposition and next steps for a met (or missed) appointment. |
| Submission form type | `appointment-met` |
| Label on submitted page | Appointment Met |

Wire into:

- `FormRouterClient.tsx` → `availableForms`
- `_core/formRouterUtils.ts` → `FormRouterFormKey`
- `_core/submissionUtils.ts` → `SubmissionFormType`, labels, paths
- `AGENTS.md` → short Appointment Met example section

### Sections & layout

Visual order matches jeff-cook; styling matches appointment-set.

**Section 1 — Client Info** (two-column `Row`s)

1. Client First Name | Client Last Name  
2. Client Phone Number | Client Email  
3. Client Type | Agent Submitting  

**Section 2 — Disposition Details**

Always:

1. Did the Appointment Happen? — single full-width select (no partner field; JCRE Office removed)

**Branch — Met with Customer**

2. Appointment Met Date | Appointment Outcome  
3. Next Step | Notes  

**Branch — Customer Cancelled or Customer No Show**

2. Next Step for Cancelled Appointments (full-width)  
3. Follow Up Notes (full-width single field) — only when cancelled next step is `Other`

**Branch — Rescheduled**

2. Rescheduled Date | Rescheduled Start Time + Rescheduled End Time (nested row on the right)

Submit: full-width primary button in `.form-actions`.

### Fields

#### Hidden / context

| ID | Source | Required on submit |
|----|--------|--------------------|
| `personId` | URL / FUB / SISU | Yes |
| `agentId` | URL / FUB | No |
| `dealId` | URL / SISU | No |
| `sisuTransactionId` | URL / SISU | No |

#### Always visible

| ID | Label | Type | Required | Options / notes |
|----|-------|------|----------|-----------------|
| `clientFirstName` | Client First Name | text | Yes | |
| `clientLastName` | Client Last Name | text | Yes | |
| `clientPhone` | Client Phone Number | tel | Yes | Format on blur via `_core/formatUtils` |
| `clientEmail` | Client Email | email | Yes | `isValidEmail` |
| `leadType` | Client Type | select | Yes | `Buyer`, `Seller` |
| `agentSubmitting` | Agent Submitting | select | Yes | Options from `GET /api/fub/users` (`{ id, name }`) |
| `apptDisposition` | Did the Appointment Happen? | select | Yes | See enums below |

#### Met branch (`apptDisposition === "Met with Customer"`)

| ID | Label | Type | Required | Notes |
|----|-------|------|----------|-------|
| `appointmentMetDate` | Appointment Met Date | date | Yes | Max = today `America/New_York` via `formDateValidation` |
| `apptOutcome` | Appointment Outcome | select | Yes | Hardcoded SISU labels (no outcomes API in template) |
| `nextStep` | Next Step | select | Yes | |
| `notes` | Notes | textarea | No | |

#### Cancelled / No Show branch

| ID | Label | Type | Required | Notes |
|----|-------|------|----------|-------|
| `cancelledNextStep` | Next Step for Cancelled Appointments | select | Yes | |
| `followUpNotes` | Follow Up Notes | textarea | Yes if next step is `Other` | Hidden otherwise |

#### Rescheduled branch

| ID | Label | Type | Required | Notes |
|----|-------|------|----------|-------|
| `rescheduledDate` | Rescheduled Date | date | Yes | No max-date rule |
| `rescheduledStartTime` | Rescheduled Start Time | time | Yes | 30-min steps; changing start sets end to start + 1 hour |
| `rescheduledEndTime` | Rescheduled End Time | time | Yes | 30-min steps |

#### Explicitly omitted

- `jcreOffice` / **JCRE Office** (and any other JCRE-labeled field)
- `whyApptDidntHappen` / **Why Didn't Appointment Happen?**

### Enums

```ts
APPT_DISPOSITION_OPTIONS = [
  "Met with Customer",
  "Customer Cancelled",
  "Rescheduled",
  "Customer No Show",
]

APPT_OUTCOME_OPTIONS = [
  "Thinking it Over",
  "Interviewing Other Brokerages",
  "Needs 2nd Appointment",
  "Signed Buyer Agency",
  "Listing Obtained",
]

MET_NEXT_STEP_OPTIONS = [
  "Create Follow Up Task",
  "Set Up Additional Appointment",
  "Send to Lender",
  "Set Up MLS Search",
  "Schedule Showings",
  "Start Paperwork",
  "Other",
]

CANCELLED_NEXT_STEP_OPTIONS = [
  "Create Follow Up Task",
  "Attempt Another Appointment",
  "Throw Back to the Pond",
  "Throw Back to ISA",
  "Other",
]

```

### Conditional behavior

- Changing `apptDisposition` clears fields belonging to other branches (mutually exclusive groups share layout slots by branch).
- Clearing cancelled next step away from `Other` clears `followUpNotes`.
- Conditional fields: hide when controlling answer empty / wrong branch; require only when visible (and Notes remain optional when Met).
- Past-event date: `appointmentMetDate` must be today or earlier in `America/New_York`.

## Prefill

Same pattern as appointment-set:

1. Seed from search params (`clientId`/`personId`, `agentId`, names, `dealId`, `sisuTransactionId`)
2. FUB person: `GET /api/fub/people/{id}` → name, phone, email, `personId`, default `agentSubmitting` from `assignedUserId` (never embedded FUB context user id)
3. SISU: `resolveSisuTransactionLookup` when transaction or deal id present → client/agent/deal fields where applicable
4. Local demo: `applyLocalDemoSearchParams` when `ENVIRONMENT=LOCAL` and no client id
5. Previous submission: always `null` in template page

Agent Submitting options load from mock `GET /api/fub/users`. Appointment outcomes stay hardcoded (template has no appointment-outcomes API).

## Submit API

`POST /api/forms/appointment-met/submit`

1. Parse JSON (400 on invalid)
2. `normalizeAppointmentMetPayload` → `validateAppointmentMetForm`
3. Require `personId`
4. On invalid: `{ message, errors }` with 400
5. On valid: return fixture from `app/api/_fixtures/appointment-met-submit-success.json`

Fixture shape (aligned with appointment-set):

```json
{
  "formType": "appointmentMet",
  "message": "Appointment Met workflow complete (mock).",
  "dealId": 456,
  "transaction": { "...": "stable fixture ids" },
  "email": {
    "sent": false,
    "reason": "no_recipients",
    "message": "Summary email skipped in template mock mode."
  }
}
```

Client stores debug record when present, then navigates with `buildPostSubmissionHref`. Email skip/failure surfaces as warning query param on submitted page.

## Files to create

| Path | Role |
|------|------|
| `app/forms/appointment-met/page.tsx` | Server page + local demo params |
| `app/forms/appointment-met/AppointmentMetFormClient.tsx` | UI, prefill, submit |
| `app/forms/appointment-met/appointmentMetFormUtils.ts` | State, enums, validate, normalize, prefill helpers |
| `app/forms/appointment-met/__tests__/appointmentMetFormUtils.test.ts` | Validation / branch clearing / normalize |
| `app/api/forms/appointment-met/submit/route.ts` | Mock submit |
| `app/api/forms/appointment-met/submit/__tests__/route.test.ts` | Route tests |
| `app/api/_fixtures/appointment-met-submit-success.json` | Success fixture |

## Files to modify

| Path | Change |
|------|--------|
| `app/forms/FormRouterClient.tsx` | Register form |
| `app/forms/_core/formRouterUtils.ts` | Add key to union |
| `app/forms/_core/submissionUtils.ts` | Type, label, path |
| Related submission/router tests if present | Cover new key |
| `AGENTS.md` | Document Appointment Met example |

## Design / a11y / performance notes

- **frontend-design:** Keep existing form aesthetic; no new font/palette; one primary CTA (Submit).
- **baseline-ui:** Reuse project primitives; `text-balance` on title; no new animation; no gradients; errors beside fields; no `h-screen`.
- **react-best-practices:** Prefer parallel prefill fetches (`Promise`-style independent loads); avoid barrel imports of heavy modules; derive branch booleans during render; put disposition-clearing in field update handlers (not effects); keep Client Component scoped to the form island.

## Verification

1. `/forms` lists Appointment Met and routes with client/deal params  
2. Fill Met / Cancelled / Rescheduled paths; confirm branch clearing and validation  
3. Submit → `/forms/submitted?form=appointment-met`  
4. `bun test` for new utils + route tests  

## Open questions

None — decisions locked: mock submit, omit JCRE fields, template visual system.
