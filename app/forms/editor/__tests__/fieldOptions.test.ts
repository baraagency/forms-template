import { describe, expect, it } from "bun:test";
import { resolveFieldOptions } from "../fieldOptions";

describe("resolveFieldOptions", () => {
  it("returns manual options for manual fields", () => {
    expect(
      resolveFieldOptions({
        id: "a",
        label: "A",
        kind: "choice",
        required: false,
        optionSource: "manual",
        options: [{ label: "A", value: "a" }],
      }),
    ).toEqual([{ label: "A", value: "a" }]);
  });

  it("returns the 50 US states for the preset", () => {
    const options = resolveFieldOptions({
      id: "state",
      label: "State",
      kind: "choice",
      required: true,
      optionSource: "usStates",
    });

    expect(options).toHaveLength(50);
    expect(options[0]).toEqual({ label: "AL", value: "AL" });
  });

  it("returns the SISU snapshot, never a live call", () => {
    expect(
      resolveFieldOptions({
        id: "t",
        label: "T",
        kind: "choice",
        required: true,
        optionSource: "sisu",
        sisuFieldKey: "transactionType",
        options: [{ label: "Lease", value: "lease" }],
      }),
    ).toEqual([{ label: "Lease", value: "lease" }]);
  });
});
