import { describe, expect, it } from "bun:test";
import { createSaveQueue } from "../createSaveQueue";

describe("createSaveQueue", () => {
  it("serializes writes and returns each version", async () => {
    const calls: string[] = [];
    const save = async (value: string) => {
      calls.push(`start:${value}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
      calls.push(`end:${value}`);
      return Number(value);
    };

    const queue = createSaveQueue(save);
    const [first, second] = await Promise.all([queue("1"), queue("2")]);

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(calls).toEqual(["start:1", "end:1", "start:2", "end:2"]);
  });

  it("continues after a failed write", async () => {
    let calls = 0;
    const queue = createSaveQueue(async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("offline");
      }
      return 2;
    });

    await expect(queue("first")).rejects.toThrow("offline");
    await expect(queue("second")).resolves.toBe(2);
  });
});
