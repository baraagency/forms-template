import { describe, expect, it } from "bun:test";
import {
  applyLocalDemoSearchParams,
  getLocalDemoFixtureIds,
  isLocalFormsDemoEnvironment,
} from "../_core/localFormsDemo";

describe("isLocalFormsDemoEnvironment", () => {
  it("enables for LOCAL", () => {
    expect(isLocalFormsDemoEnvironment("LOCAL", "production")).toBe(true);
  });

  it("disables for PRODUCTION and STAGING", () => {
    expect(isLocalFormsDemoEnvironment("PRODUCTION", "development")).toBe(false);
    expect(isLocalFormsDemoEnvironment("STAGING", "development")).toBe(false);
  });

  it("falls back to development NODE_ENV when ENVIRONMENT unset", () => {
    expect(isLocalFormsDemoEnvironment(undefined, "development")).toBe(true);
    expect(isLocalFormsDemoEnvironment(undefined, "production")).toBe(false);
  });
});

describe("applyLocalDemoSearchParams", () => {
  it("returns the same object when demo is disabled", () => {
    const params = { foo: "bar" };
    expect(applyLocalDemoSearchParams(params, false)).toBe(params);
  });

  it("leaves explicit clientId alone", () => {
    const params = { clientId: "999", agentId: "2" };
    expect(applyLocalDemoSearchParams(params, true)).toEqual(params);
  });

  it("fills fixture ids when no client is present", () => {
    const fixtures = getLocalDemoFixtureIds();
    expect(applyLocalDemoSearchParams({}, true)).toEqual({
      clientId: fixtures.personId,
      agentId: fixtures.agentId,
      dealId: fixtures.dealId,
      sisuTransactionId: fixtures.sisuTransactionId,
      clientName: fixtures.clientName,
      agentName: fixtures.agentName,
    });
  });
});
