import { describe, expect, test } from "bun:test";
import { getSelectOptions } from "../getSelectOptions";

describe("getSelectOptions", () => {
  test("treats empty option values as the placeholder", () => {
    const { options, placeholder } = getSelectOptions([
      <option key="placeholder" value="">
        Select agent
      </option>,
      <option key="1" value="1">
        Ada
      </option>,
      <option key="2" value="2" disabled>
        Skip
      </option>,
    ]);

    expect(placeholder).toBe("Select agent");
    expect(options).toEqual([
      { value: "1", label: "Ada", isDisabled: false },
      { value: "2", label: "Skip", isDisabled: true },
    ]);
  });
});
