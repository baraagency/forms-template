import { readFileSync } from "fs";
import { join } from "path";

const fixturesDir = join(process.cwd(), "app/api/_fixtures");

export function loadFixture<T>(filename: string): T {
  const contents = readFileSync(join(fixturesDir, filename), "utf8");
  return JSON.parse(contents) as T;
}
