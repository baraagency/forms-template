import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { loadFubUserOptions } from "../fubUserOptionsService";
import { loadFubAppointmentTypeOptions } from "../fubAppointmentTypeOptionsService";
import { loadSisuTeamAgentOptions } from "../sisuTeamAgentOptionsService";
import { loadSisuVendorOptions } from "../sisuVendorOptionsService";

describe("phase 2 option catalogs", () => {
  const originalFubKey = process.env.FUB_API_KEY;

  beforeEach(() => {
    delete process.env.FUB_API_KEY;
  });

  afterEach(() => {
    if (originalFubKey === undefined) {
      delete process.env.FUB_API_KEY;
    } else {
      process.env.FUB_API_KEY = originalFubKey;
    }
  });

  it("loads FUB users as value/label options", async () => {
    const result = await loadFubUserOptions();
    expect(result.error).toBeNull();
    expect(result.data?.[0]).toMatchObject({ value: expect.any(String), label: expect.any(String) });
  });

  it("loads FUB appointment types", async () => {
    const result = await loadFubAppointmentTypeOptions();
    expect(result.error).toBeNull();
    expect(result.data?.length).toBeGreaterThan(0);
    expect(result.data?.[0]).toMatchObject({ value: expect.any(String), label: expect.any(String) });
  });

  it("filters SISU agents to ISAs", async () => {
    const result = await loadSisuTeamAgentOptions("ISISA");
    expect(result.error).toBeNull();
    expect(result.data).toEqual([{ value: "501", label: "Taylor ISA" }]);
  });

  it("loads mortgage vendor options", async () => {
    const result = await loadSisuVendorOptions("mortgageCompany");
    expect(result.error).toBeNull();
    expect(result.data?.map((option) => option.label)).toContain("Other");
  });
});
