import { describe, expect, test } from "bun:test";
import { matchAid } from "./aid-rule-engine";

describe("deterministic aid matching", () => {
  test("returns version-independent explainable results", () => {
    const matches = matchAid({ age: 10, has_disability_flag: true, dtks_or_low_income: true });
    expect(matches.length).toBeGreaterThanOrEqual(6);
    expect(matches.some((match) => match.status === "cocok_awal")).toBe(true);
  });
});
