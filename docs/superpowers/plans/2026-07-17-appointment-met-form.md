# Appointment Met Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a template-style Appointment Met form that mirrors jeff-cook’s fields/layout (minus JCRE Office) with mock submit.

**Architecture:** Clone the `appointment-set` scaffold (page → client → utils → mock submit route → router registration). Port field enums, disposition branching, and validation from jeff-cook’s `appointment-met`, omitting `jcreOffice`. Prefill from URL, FUB person, and SISU lookup only. Hardcode appointment outcome options.

**Tech Stack:** Next.js App Router, Bun, `@baraagency/components`, MUI date/time pickers, existing `_core` form utilities.

**Spec:** `docs/superpowers/specs/2026-07-17-appointment-met-form-design.md`

---

### Task 1: Form utils + tests

**Files:**
- Create: `app/forms/appointment-met/appointmentMetFormUtils.ts`
- Create: `app/forms/appointment-met/__tests__/appointmentMetFormUtils.test.ts`

- [x] Implement state, enums, validation, normalize, prefill helpers (no `jcreOffice`)
- [x] Add unit tests for validation branches and disposition clearing
- [x] Run: `bun test app/forms/appointment-met/__tests__/appointmentMetFormUtils.test.ts`

### Task 2: Form page + client UI

**Files:**
- Create: `app/forms/appointment-met/page.tsx`
- Create: `app/forms/appointment-met/AppointmentMetFormClient.tsx`

- [x] Server page with local demo params (mirror appointment-set)
- [x] Client UI: Client Info + Disposition Details with branch rendering
- [x] Prefill: FUB person + FUB users + SISU lookup; mock submit → `/forms/submitted`

### Task 3: Mock submit API

**Files:**
- Create: `app/api/_fixtures/appointment-met-submit-success.json`
- Create: `app/api/forms/appointment-met/submit/route.ts`
- Create: `app/api/forms/appointment-met/submit/__tests__/route.test.ts`

- [x] Fixture + route + tests
- [x] Run: `bun test app/api/forms/appointment-met/submit/__tests__/route.test.ts`

### Task 4: Register form + docs

**Files:**
- Modify: `app/forms/FormRouterClient.tsx`
- Modify: `app/forms/_core/formRouterUtils.ts`
- Modify: `app/forms/_core/submissionUtils.ts`
- Modify: `app/forms/__tests__/submissionUtils.test.ts`
- Modify: `AGENTS.md`

- [x] Wire router key/labels/paths
- [x] Document Appointment Met example in AGENTS.md
- [x] Run full related tests
