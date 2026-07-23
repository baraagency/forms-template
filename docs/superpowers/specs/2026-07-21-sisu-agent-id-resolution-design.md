# SISU `agent_id` resolution via find-agent

**Date:** 2026-07-21  
**Status:** Approved design (pending implementation plan)  
**Reference:** `/Users/nikomart/Documents/jeff-cook-app` (`agentResolution.ts`, `sisuService.findAgentByEmail` / `resolveAgentIdByEmail`)

## Problem

Form submissions build the SISU transaction payload from DB mappings plus hardcoded `fub_id` / `fub_deal_id`. Workflow `agentId` (FUB user id) is never written as SISU `agent_id`. Settings UI also reserves `agent_id` so it cannot be mapped.

SISU expects its own numeric `agent_id`, resolved by looking up the submitting FUB user’s email via `POST /v1/agent/find-agent`.

## Goals

- On every form submit that reaches the SISU write step, resolve SISU `agent_id` from the submitting FUB user’s email.
- If resolution fails, still write the SISU transaction **without** `agent_id` (best-effort).
- Keep resolution shared in the submission workflow (template architecture), not duplicated across form routes.
- Match jeff-cook lookup semantics (exact email / archived email, else first agent).

## Non-goals

- Allowing settings UI to map `agent_id`
- Failing or skipping the SISU write when agent lookup fails
- Changing ISA/OSA → `appt_set_by_agent_id` (or other mapped agent-like fields)
- Using embedded FUB context user id as the submitting agent

## Decisions

| Topic | Decision |
|-------|----------|
| Architecture | Resolve inside shared `runSubmissionWorkflow` before create/update |
| Failure mode | Omit `agent_id`, continue SISU write |
| Appointment Met source | `agentSubmitting \|\| agentId` passed as workflow `agentId` |
| Other forms | `formState.agentId` |
| Direct FUB id → SISU id | Never; always email → find-agent |

## Behavior

```
FUB user id (workflow agentId)
  → GET FUB /users/{id} → email
  → POST SISU /v1/agent/find-agent { email }
  → prefer exact email or archived_email match; else first agent
  → if agent_id found: set sisuPayload.agent_id (number)
  → else: leave agent_id unset; proceed with write
```

Agent source by form:

| Form | FUB user id used for resolution |
|------|----------------------------------|
| pending | `formState.agentId` |
| appointment-set | `formState.agentId` |
| appointment-met | `formState.agentSubmitting \|\| formState.agentId` |
| closed | `formState.agentId` |

Skip gates for the SISU step (API key / enabled mappings) are unchanged. Agent resolution runs only when the SISU write is about to execute (not when SISU is skipped for missing key/mappings). If FUB or SISU agent lookup fails mid-resolution, omit `agent_id` only—do not change the skip/fail outcome of the SISU step for that reason.

## Implementation outline

### Types (`app/types/sisu.ts`)

Add (from jeff-cook):

- `SISUFindAgentRequest` — `{ email: string }`
- Ensure `SISUAgent` / response shape supports `agents[]` with `agent_id`, `email`, `archived_email` as needed for find-agent (reuse or extend existing types)

### FUB live client (`app/api/_services/fubLiveClient.ts`)

- Add `fetchLiveFubUser(userId: string)` → `GET /users/{id}`
- Return same `FubLiveResult<FUBUser>` pattern as other live helpers

### SISU live client (`app/api/_services/sisuLiveClient.ts`)

- `findLiveSisuAgentByEmail(email)` → `POST /v1/agent/find-agent` with `{ email }`
- `resolveLiveSisuAgentIdByEmail(email)` → exact email / `archived_email` match, else first agent’s `agent_id`; error/empty → no id

### Shared resolver

- New helper (e.g. `app/api/_services/submissionWorkflow/resolveSisuAgentId.ts` or adjacent module):
  - `resolveSisuAgentIdForFubAgentId(fubAgentId, deps?)`
  - FUB get user → email → SISU resolve by email
  - Returns `number | undefined`
  - Injectable deps for unit tests (jeff-cook pattern)

### Workflow (`runSubmissionWorkflow.ts`)

Immediately before `createOrUpdateLiveSisuTransaction` (after `fub_id` / `fub_deal_id` injection):

1. If `ctx.agentId` is non-empty, call resolver
2. If a number is returned, set `ctx.sisuPayload.agent_id`
3. Proceed with create/update as today

Do not overwrite an existing `agent_id` from mappings (mappings cannot set it today because it is reserved; defensive: only set when unset, or always overwrite from resolver—prefer **always set from resolver when resolved**, since workflow owns this field).

### Appointment Met submit route

Pass:

```ts
agentId: formState.agentSubmitting || formState.agentId || null
```

into `runSubmissionWorkflow`.

### Settings

No change required to reserved field list (`agent_id` remains reserved).

## Tests

- Unit: resolver success path (FUB email → SISU id)
- Unit: resolver returns undefined when FUB user missing / no email (SISU not called)
- Unit: `resolveLiveSisuAgentIdByEmail` prefers exact match over first agent
- Workflow (or focused unit with mocked resolver): when resolver returns id, payload includes `agent_id`; when undefined, write still called without `agent_id`
- Appointment-met route: workflow receives `agentSubmitting || agentId`

## Error / observability

- Soft-fail only: no new hard error for agent resolution
- Optional: record a short message on the SISU step when write succeeds but agent was omitted due to lookup failure (nice-to-have; not required for v1)

## Open questions

None — decisions captured above.
