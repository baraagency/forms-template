# SISU `agent_id` Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Before writing a SISU transaction, resolve `agent_id` via FUB user email → `POST /v1/agent/find-agent`, and omit it (still write) when lookup fails.

**Architecture:** Add live FUB user + SISU find-agent helpers, a shared `resolveSisuAgentIdForFubAgentId` bridge, and inject `sisuPayload.agent_id` inside `runSubmissionWorkflow` only when the SISU write path runs. Appointment Met passes `agentSubmitting || agentId` as workflow `agentId`.

**Tech Stack:** React Router v8, Bun (`bun test`), existing `fubLiveClient` / `sisuLiveClient` patterns, jeff-cook reference at `/Users/nikomart/Documents/jeff-cook-app`.

**Spec:** `docs/superpowers/specs/2026-07-21-sisu-agent-id-resolution-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `app/types/sisu.ts` | Already has `SISUFindAgentRequest` / `SISUFindAgentResponse` / `SISUAgent` — verify only |
| `app/api/_services/sisuLiveClient.ts` | `findLiveSisuAgentByEmail`, `pickSisuAgentIdFromFindResponse`, `resolveLiveSisuAgentIdByEmail` |
| `app/api/_services/fubLiveClient.ts` | `fetchLiveFubUser` |
| `app/api/_services/submissionWorkflow/resolveSisuAgentId.ts` | FUB id → email → SISU agent id |
| `app/api/_services/submissionWorkflow/runSubmissionWorkflow.ts` | Call resolver + set `sisuPayload.agent_id` before write |
| `app/api/_services/submissionWorkflow/index.ts` | Re-export resolver if useful for tests |
| `app/api/forms/appointment-met/submit/route.ts` | Pass `agentSubmitting \|\| agentId` |
| `app/api/_services/sisuLiveClient/__tests__/resolveLiveSisuAgentIdByEmail.test.ts` | Pure pick + resolve tests |
| `app/api/_services/submissionWorkflow/__tests__/resolveSisuAgentId.test.ts` | Bridge tests with injectable deps |
| `app/api/forms/appointment-met/submit/__tests__/route.test.ts` | Assert workflow receives submitting agent (extend if present; else add focused assert via extracted helper or mock) |

---

### Task 1: SISU find-agent helpers (TDD)

**Files:**
- Modify: `app/api/_services/sisuLiveClient.ts`
- Create: `app/api/_services/__tests__/resolveLiveSisuAgentIdByEmail.test.ts`
- Verify (no change expected): `app/types/sisu.ts` already exports find-agent types

- [ ] **Step 1: Write the failing test for exact-match preference**

```ts
import { describe, expect, it } from "bun:test";
import { pickSisuAgentIdFromFindResponse } from "../sisuLiveClient";
import type { SISUFindAgentResponse } from "@/app/types/sisu";

describe("pickSisuAgentIdFromFindResponse", () => {
  it("prefers exact email match over the first agent", () => {
    const payload = {
      agents: [
        {
          agent_id: 1,
          email: "other@example.com",
          first_name: "Other",
          last_name: "Agent",
        },
        {
          agent_id: 244334,
          email: "agent@example.com",
          first_name: "Match",
          last_name: "Agent",
        },
      ],
      status: "ok",
      status_code: 0,
    } satisfies SISUFindAgentResponse;

    expect(pickSisuAgentIdFromFindResponse(payload, "agent@example.com")).toBe(
      244334,
    );
  });

  it("matches archived_email case-insensitively", () => {
    const payload = {
      agents: [
        {
          agent_id: 99,
          email: "new@example.com",
          archived_email: "Old@Example.com",
          first_name: "A",
          last_name: "B",
        },
      ],
      status: "ok",
      status_code: 0,
    } satisfies SISUFindAgentResponse;

    expect(pickSisuAgentIdFromFindResponse(payload, "old@example.com")).toBe(99);
  });

  it("falls back to the first agent when no email matches", () => {
    const payload = {
      agents: [
        {
          agent_id: 10,
          email: "a@example.com",
          first_name: "A",
          last_name: "A",
        },
        {
          agent_id: 20,
          email: "b@example.com",
          first_name: "B",
          last_name: "B",
        },
      ],
      status: "ok",
      status_code: 0,
    } satisfies SISUFindAgentResponse;

    expect(pickSisuAgentIdFromFindResponse(payload, "missing@example.com")).toBe(
      10,
    );
  });

  it("returns undefined when agents are empty", () => {
    const payload = {
      agents: [],
      status: "ok",
      status_code: 0,
    } satisfies SISUFindAgentResponse;

    expect(
      pickSisuAgentIdFromFindResponse(payload, "agent@example.com"),
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test app/api/_services/__tests__/resolveLiveSisuAgentIdByEmail.test.ts`

Expected: FAIL — `pickSisuAgentIdFromFindResponse` is not exported / not defined

- [ ] **Step 3: Implement pick + find + resolve helpers**

In `app/api/_services/sisuLiveClient.ts`, add imports:

```ts
import type {
  // ...existing
  SISUFindAgentRequest,
  SISUFindAgentResponse,
} from "@/app/types/sisu";
```

Add after `sisuRequest` / near `createOrUpdateLiveSisuTransaction`:

```ts
export function pickSisuAgentIdFromFindResponse(
  payload: SISUFindAgentResponse | null | undefined,
  email: string,
): number | undefined {
  const agents = payload?.agents;
  if (!agents || agents.length === 0) {
    return undefined;
  }

  const target = email.trim().toLowerCase();
  const exactMatch = agents.find((agent) => {
    const agentEmail = agent.email?.toLowerCase() || "";
    const archivedEmail = agent.archived_email?.toLowerCase() || "";
    return agentEmail === target || archivedEmail === target;
  });

  const bestAgent = exactMatch || agents[0];
  const agentId = bestAgent?.agent_id;
  return typeof agentId === "number" && Number.isFinite(agentId)
    ? agentId
    : undefined;
}

/**
 * Live POST /v1/agent/find-agent — body: { email }.
 */
export async function findLiveSisuAgentByEmail(
  email: string,
): Promise<SisuLiveResult<SISUFindAgentResponse>> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { data: null, error: "Agent email is required.", status: 400 };
  }

  const body = { email: trimmed } satisfies SISUFindAgentRequest;
  return sisuRequest<SISUFindAgentResponse>("POST", "/v1/agent/find-agent", body);
}

/**
 * Resolve best SISU agent_id for an email (exact / archived match, else first).
 */
export async function resolveLiveSisuAgentIdByEmail(
  email: string,
): Promise<SisuLiveResult<number>> {
  const result = await findLiveSisuAgentByEmail(email);
  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ?? "Failed to find SISU agent.",
      status: result.status,
    };
  }

  const agentId = pickSisuAgentIdFromFindResponse(result.data, email);
  if (agentId === undefined) {
    return {
      data: null,
      error: `No SISU agent found for email: ${email.trim()}`,
      status: 404,
    };
  }

  return { data: agentId, error: null };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test app/api/_services/__tests__/resolveLiveSisuAgentIdByEmail.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/_services/sisuLiveClient.ts app/api/_services/__tests__/resolveLiveSisuAgentIdByEmail.test.ts
git commit -m "$(cat <<'EOF'
feat: add SISU find-agent email resolution helpers

EOF
)"
```

---

### Task 2: FUB `fetchLiveFubUser`

**Files:**
- Modify: `app/api/_services/fubLiveClient.ts`
- Create: `app/api/_services/__tests__/fetchLiveFubUser.test.ts`

- [ ] **Step 1: Write the failing test (empty id short-circuit)**

```ts
import { describe, expect, it } from "bun:test";
import { fetchLiveFubUser } from "../fubLiveClient";

describe("fetchLiveFubUser", () => {
  it("returns 400 when userId is blank without calling FUB", async () => {
    const result = await fetchLiveFubUser("   ");
    expect(result.data).toBeNull();
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/user id/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test app/api/_services/__tests__/fetchLiveFubUser.test.ts`

Expected: FAIL — `fetchLiveFubUser` not exported

- [ ] **Step 3: Implement `fetchLiveFubUser`**

In `app/api/_services/fubLiveClient.ts`, ensure `FUBUser` is imported from `@/app/types/fub`, then add:

```ts
/**
 * Live GET /users/{id}.
 */
export async function fetchLiveFubUser(
  userId: string,
): Promise<FubLiveResult<FUBUser>> {
  const trimmed = userId.trim();
  if (!trimmed) {
    return { data: null, error: "FUB user id is required.", status: 400 };
  }

  return fubRequest<FUBUser>("GET", `/users/${encodeURIComponent(trimmed)}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test app/api/_services/__tests__/fetchLiveFubUser.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/_services/fubLiveClient.ts app/api/_services/__tests__/fetchLiveFubUser.test.ts
git commit -m "$(cat <<'EOF'
feat: add live FUB user fetch for SISU agent resolution

EOF
)"
```

---

### Task 3: Shared `resolveSisuAgentIdForFubAgentId` bridge

**Files:**
- Create: `app/api/_services/submissionWorkflow/resolveSisuAgentId.ts`
- Create: `app/api/_services/submissionWorkflow/__tests__/resolveSisuAgentId.test.ts`
- Modify: `app/api/_services/submissionWorkflow/index.ts` (re-export)

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it, mock } from "bun:test";
import { resolveSisuAgentIdForFubAgentId } from "../resolveSisuAgentId";

describe("resolveSisuAgentIdForFubAgentId", () => {
  it("resolves a FUB user email to a SISU agent id", async () => {
    const fetchLiveFubUser = mock(async () => ({
      data: { id: "456", email: "agent@example.com" },
      error: null as null,
    }));
    const resolveLiveSisuAgentIdByEmail = mock(async () => ({
      data: 244334,
      error: null as null,
    }));

    await expect(
      resolveSisuAgentIdForFubAgentId("456", {
        fetchLiveFubUser,
        resolveLiveSisuAgentIdByEmail,
      }),
    ).resolves.toBe(244334);

    expect(fetchLiveFubUser).toHaveBeenCalledWith("456");
    expect(resolveLiveSisuAgentIdByEmail).toHaveBeenCalledWith(
      "agent@example.com",
    );
  });

  it("returns undefined when the FUB user cannot be resolved", async () => {
    const fetchLiveFubUser = mock(async () => ({
      data: null,
      error: "Missing",
      status: 404,
    }));
    const resolveLiveSisuAgentIdByEmail = mock(async () => ({
      data: 244334,
      error: null as null,
    }));

    await expect(
      resolveSisuAgentIdForFubAgentId("456", {
        fetchLiveFubUser,
        resolveLiveSisuAgentIdByEmail,
      }),
    ).resolves.toBeUndefined();

    expect(resolveLiveSisuAgentIdByEmail).not.toHaveBeenCalled();
  });

  it("returns undefined when FUB user has no email", async () => {
    const fetchLiveFubUser = mock(async () => ({
      data: { id: "456" },
      error: null as null,
    }));
    const resolveLiveSisuAgentIdByEmail = mock(async () => ({
      data: 244334,
      error: null as null,
    }));

    await expect(
      resolveSisuAgentIdForFubAgentId("456", {
        fetchLiveFubUser,
        resolveLiveSisuAgentIdByEmail,
      }),
    ).resolves.toBeUndefined();

    expect(resolveLiveSisuAgentIdByEmail).not.toHaveBeenCalled();
  });

  it("returns undefined for blank FUB agent id", async () => {
    const fetchLiveFubUser = mock(async () => ({
      data: { id: "456", email: "a@b.com" },
      error: null as null,
    }));

    await expect(
      resolveSisuAgentIdForFubAgentId("  ", { fetchLiveFubUser }),
    ).resolves.toBeUndefined();

    expect(fetchLiveFubUser).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test app/api/_services/submissionWorkflow/__tests__/resolveSisuAgentId.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement the bridge**

Create `app/api/_services/submissionWorkflow/resolveSisuAgentId.ts`:

```ts
import { fetchLiveFubUser } from "@/app/api/_services/fubLiveClient";
import { resolveLiveSisuAgentIdByEmail } from "@/app/api/_services/sisuLiveClient";
import type { FUBUser } from "@/app/types/fub";
import type { FubLiveResult } from "@/app/api/_services/fubLiveClient";
import type { SisuLiveResult } from "@/app/api/_services/sisuLiveClient";

type ResolveSisuAgentIdDependencies = {
  fetchLiveFubUser?: (
    userId: string,
  ) => Promise<FubLiveResult<FUBUser>>;
  resolveLiveSisuAgentIdByEmail?: (
    email: string,
  ) => Promise<SisuLiveResult<number>>;
};

/**
 * Map a FUB user id to a SISU agent_id via user email + find-agent.
 * Soft-fails to undefined when FUB/SISU lookup cannot resolve an id.
 */
export async function resolveSisuAgentIdForFubAgentId(
  fubAgentId: string,
  dependencies: ResolveSisuAgentIdDependencies = {},
): Promise<number | undefined> {
  const trimmedAgentId = fubAgentId.trim();
  if (!trimmedAgentId) {
    return undefined;
  }

  const getUser = dependencies.fetchLiveFubUser ?? fetchLiveFubUser;
  const resolveByEmail =
    dependencies.resolveLiveSisuAgentIdByEmail ?? resolveLiveSisuAgentIdByEmail;

  const userResult = await getUser(trimmedAgentId);
  const email = userResult.data?.email?.trim();

  if (userResult.error || !email) {
    return undefined;
  }

  const sisuAgentResult = await resolveByEmail(email);
  return sisuAgentResult.data ?? undefined;
}
```

Re-export from `app/api/_services/submissionWorkflow/index.ts`:

```ts
export { resolveSisuAgentIdForFubAgentId } from "./resolveSisuAgentId";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test app/api/_services/submissionWorkflow/__tests__/resolveSisuAgentId.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/_services/submissionWorkflow/resolveSisuAgentId.ts \
  app/api/_services/submissionWorkflow/__tests__/resolveSisuAgentId.test.ts \
  app/api/_services/submissionWorkflow/index.ts
git commit -m "$(cat <<'EOF'
feat: bridge FUB user id to SISU agent_id via email

EOF
)"
```

---

### Task 4: Inject `agent_id` in `runSubmissionWorkflow`

**Files:**
- Modify: `app/api/_services/submissionWorkflow/runSubmissionWorkflow.ts`
- Create: `app/api/_services/submissionWorkflow/__tests__/sisuAgentIdInjection.test.ts`

Note: Full workflow integration needs DB. Prefer a small exported helper used by the workflow so TDD stays focused:

- [ ] **Step 1: Write failing tests for injection helper**

```ts
import { describe, expect, it } from "bun:test";
import { applyResolvedSisuAgentId } from "../applyResolvedSisuAgentId";

describe("applyResolvedSisuAgentId", () => {
  it("sets agent_id when resolved", () => {
    const payload = { fub_id: "123" };
    applyResolvedSisuAgentId(payload, 244334);
    expect(payload).toEqual({ fub_id: "123", agent_id: 244334 });
  });

  it("leaves payload unchanged when agent id is undefined", () => {
    const payload = { fub_id: "123" };
    applyResolvedSisuAgentId(payload, undefined);
    expect(payload).toEqual({ fub_id: "123" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test app/api/_services/submissionWorkflow/__tests__/sisuAgentIdInjection.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement helper + wire into workflow**

Create `app/api/_services/submissionWorkflow/applyResolvedSisuAgentId.ts`:

```ts
import type { SISUCreateTransactionRequest } from "@/app/types/sisu";

export function applyResolvedSisuAgentId(
  sisuPayload: SISUCreateTransactionRequest,
  sisuAgentId: number | undefined,
): void {
  if (sisuAgentId === undefined) {
    return;
  }
  sisuPayload.agent_id = sisuAgentId;
}
```

In `runSubmissionWorkflow.ts`:

1. Import:

```ts
import { resolveSisuAgentIdForFubAgentId } from "./resolveSisuAgentId";
import { applyResolvedSisuAgentId } from "./applyResolvedSisuAgentId";
```

2. Inside the SISU write `else` branch, **before** `createOrUpdateLiveSisuTransaction`, after `fub_deal_id` injection:

```ts
      if (ctx.dealId && !ctx.sisuPayload.fub_deal_id) {
        ctx.sisuPayload.fub_deal_id = String(ctx.dealId);
      }

      if (ctx.agentId) {
        const sisuAgentId = await resolveSisuAgentIdForFubAgentId(ctx.agentId);
        applyResolvedSisuAgentId(ctx.sisuPayload, sisuAgentId);
      }

      const result = await createOrUpdateLiveSisuTransaction(
        ctx.sisuPayload,
        ctx.sisuTransactionId ?? undefined,
      );
```

Do **not** resolve when SISU is skipped (missing key / no mappings / budget). Soft-fail is already in the resolver (`undefined` → omit `agent_id`).

- [ ] **Step 4: Run injection + bridge tests**

Run:

```bash
bun test app/api/_services/submissionWorkflow/__tests__/sisuAgentIdInjection.test.ts \
  app/api/_services/submissionWorkflow/__tests__/resolveSisuAgentId.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/_services/submissionWorkflow/applyResolvedSisuAgentId.ts \
  app/api/_services/submissionWorkflow/__tests__/sisuAgentIdInjection.test.ts \
  app/api/_services/submissionWorkflow/runSubmissionWorkflow.ts
git commit -m "$(cat <<'EOF'
feat: inject resolved SISU agent_id into submission payload

EOF
)"
```

---

### Task 5: Appointment Met submit uses submitting agent

**Files:**
- Modify: `app/api/forms/appointment-met/submit/route.ts`
- Create or modify: `app/api/forms/appointment-met/submit/__tests__/agentIdForSisu.test.ts`

- [ ] **Step 1: Write failing test for source selection helper**

Add a tiny pure helper in the route file’s sibling module to keep the route thin and testable — create `app/api/forms/appointment-met/appointmentMetSubmittingAgentId.ts`:

Test file:

```ts
import { describe, expect, it } from "bun:test";
import { resolveAppointmentMetSubmittingAgentId } from "../../appointmentMetSubmittingAgentId";

describe("resolveAppointmentMetSubmittingAgentId", () => {
  it("prefers agentSubmitting over agentId", () => {
    expect(
      resolveAppointmentMetSubmittingAgentId({
        agentSubmitting: "789",
        agentId: "456",
      }),
    ).toBe("789");
  });

  it("falls back to agentId", () => {
    expect(
      resolveAppointmentMetSubmittingAgentId({
        agentSubmitting: "",
        agentId: "456",
      }),
    ).toBe("456");
  });

  it("returns null when both empty", () => {
    expect(
      resolveAppointmentMetSubmittingAgentId({
        agentSubmitting: "",
        agentId: "",
      }),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test app/api/forms/appointment-met/submit/__tests__/agentIdForSisu.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement helper and wire route**

Create `app/api/forms/appointment-met/appointmentMetSubmittingAgentId.ts`:

```ts
export function resolveAppointmentMetSubmittingAgentId(input: {
  agentSubmitting?: string | null;
  agentId?: string | null;
}): string | null {
  const submitting = (input.agentSubmitting ?? "").trim();
  if (submitting) {
    return submitting;
  }
  const agentId = (input.agentId ?? "").trim();
  return agentId || null;
}
```

In `app/api/forms/appointment-met/submit/route.ts`, import and change:

```ts
import { resolveAppointmentMetSubmittingAgentId } from "@/app/api/forms/appointment-met/appointmentMetSubmittingAgentId";

// ...

  const result = await runSubmissionWorkflow({
    form: "appointmentMet",
    formLabel: formKindLabel("appointmentMet"),
    formState: formState as unknown as Record<string, unknown>,
    personId: formState.personId,
    dealId: formState.dealId || null,
    sisuTransactionId: formState.sisuTransactionId || null,
    agentId: resolveAppointmentMetSubmittingAgentId({
      agentSubmitting: formState.agentSubmitting,
      agentId: formState.agentId,
    }),
    leadType: formState.leadType || null,
    hooks: {
      extraSideEffects: runAppointmentMetFubAppointmentSideEffect,
    },
  });
```

- [ ] **Step 4: Run tests**

Run: `bun test app/api/forms/appointment-met/submit/__tests__/agentIdForSisu.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/forms/appointment-met/appointmentMetSubmittingAgentId.ts \
  app/api/forms/appointment-met/submit/route.ts \
  app/api/forms/appointment-met/submit/__tests__/agentIdForSisu.test.ts
git commit -m "$(cat <<'EOF'
feat: resolve appointment-met SISU agent from agentSubmitting

EOF
)"
```

---

### Task 6: Docs touch-up + full related test pass

**Files:**
- Modify: `AGENTS.md` (one line under Settings / SISU submit behavior if needed)
- Modify: `docs/template-overview.md` only if it documents SISU payload fields

- [ ] **Step 1: Add a short AGENTS.md note**

Under Learned Workspace Facts or Template Conventions Settings bullet, add:

> SISU write sets `agent_id` by resolving the submitting FUB user’s email via `POST /v1/agent/find-agent` (omit on failure; appointment-met uses `agentSubmitting || agentId`).

- [ ] **Step 2: Run the related test suite**

```bash
bun test \
  app/api/_services/__tests__/resolveLiveSisuAgentIdByEmail.test.ts \
  app/api/_services/__tests__/fetchLiveFubUser.test.ts \
  app/api/_services/submissionWorkflow/__tests__/resolveSisuAgentId.test.ts \
  app/api/_services/submissionWorkflow/__tests__/sisuAgentIdInjection.test.ts \
  app/api/forms/appointment-met/submit/__tests__/agentIdForSisu.test.ts
```

Expected: all PASS

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "$(cat <<'EOF'
docs: note SISU agent_id email resolution on submit

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| FUB user → email → find-agent | Tasks 1–3 |
| Exact / archived / first-agent pick | Task 1 |
| Soft-fail omit `agent_id`, still write | Tasks 3–4 |
| Inject in shared workflow before write | Task 4 |
| Only when SISU write path runs | Task 4 |
| Appointment Met `agentSubmitting \|\| agentId` | Task 5 |
| Keep settings `agent_id` reserved | No change (already reserved) |
| Types for find-agent | Already present; Task 1 verify |
| Unit tests | Tasks 1–5 |

## Out of scope (do not implement)

- Settings UI mapping for `agent_id`
- Skipping/failing SISU when agent lookup fails
- ISA/OSA → `appt_set_by_agent_id` auto-resolution
- Using embedded FUB context user id as agent
