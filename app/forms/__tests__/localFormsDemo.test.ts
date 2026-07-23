import { describe, expect, it } from "bun:test";
import {
  applyDemoSearchParams,
  getDemoFixtureIds,
  isFormsDemoMode,
} from "../_core/localFormsDemo";

describe("isFormsDemoMode", () => {
  it("enables only when DEMO_MODE is true", () => {
    expect(isFormsDemoMode("true")).toBe(true);
    expect(isFormsDemoMode("TRUE")).toBe(true);
    expect(isFormsDemoMode(" True ")).toBe(true);
  });

  it("disables for other values", () => {
    expect(isFormsDemoMode("")).toBe(false);
    expect(isFormsDemoMode("false")).toBe(false);
    expect(isFormsDemoMode("1")).toBe(false);
    expect(isFormsDemoMode("LOCAL")).toBe(false);
  });
});

describe("applyDemoSearchParams", () => {
  it("returns the same object when demo is disabled", () => {
    const params = { foo: "bar" };
    expect(applyDemoSearchParams(params, false)).toBe(params);
  });

  it("leaves explicit clientId alone", () => {
    const params = { clientId: "999", agentId: "2" };
    expect(applyDemoSearchParams(params, true)).toEqual(params);
  });

  it("fills fixture ids when no client is present", () => {
    const fixtures = getDemoFixtureIds();
    expect(applyDemoSearchParams({}, true)).toEqual({
      clientId: fixtures.personId,
      agentId: fixtures.agentId,
      dealId: fixtures.dealId,
      sisuTransactionId: fixtures.sisuTransactionId,
      clientName: fixtures.clientName,
      agentName: fixtures.agentName,
    });
  });
});
