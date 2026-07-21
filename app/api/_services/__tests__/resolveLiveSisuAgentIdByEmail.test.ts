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
