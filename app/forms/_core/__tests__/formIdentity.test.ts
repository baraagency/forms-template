import { describe, expect, test } from "bun:test";
import {
  formKindToSlug,
  normalizeSettingsEnvironment,
  parseFormKindParam,
  slugToFormKind,
} from "../formIdentity";

describe("formIdentity", () => {
  test("maps kebab slug to FormKind", () => {
    expect(slugToFormKind("appointment-set")).toBe("appointmentSet");
    expect(slugToFormKind("appointment-met")).toBe("appointmentMet");
    expect(slugToFormKind("pending")).toBe("pending");
    expect(slugToFormKind("unknown")).toBeNull();
  });

  test("maps FormKind to kebab slug", () => {
    expect(formKindToSlug("appointmentSet")).toBe("appointment-set");
    expect(formKindToSlug("agreementSigned")).toBeNull();
  });

  test("parseFormKindParam accepts slug or FormKind", () => {
    expect(parseFormKindParam("appointment-set")).toBe("appointmentSet");
    expect(parseFormKindParam("appointmentSet")).toBe("appointmentSet");
    expect(parseFormKindParam("")).toBeNull();
  });

  test("normalizeSettingsEnvironment buckets env names", () => {
    expect(normalizeSettingsEnvironment("PRODUCTION")).toBe("PRODUCTION");
    expect(normalizeSettingsEnvironment("prod")).toBe("PRODUCTION");
    expect(normalizeSettingsEnvironment("STAGING")).toBe("STAGING");
    expect(normalizeSettingsEnvironment("LOCAL")).toBe("LOCAL");
    expect(normalizeSettingsEnvironment(undefined)).toBe("LOCAL");
  });
});
