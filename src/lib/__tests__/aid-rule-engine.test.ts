import { describe, expect, it } from "vitest";
import { matchAid } from "../aid-rule-engine";

describe("matchAid", () => {
  it("is deterministic and returns every program once", () => {
    const first = matchAid({ age: 10, has_disability_flag: true, dtks_or_low_income: true });
    const second = matchAid({ age: 10, has_disability_flag: true, dtks_or_low_income: true });
    expect(first).toEqual(second);
    expect(new Set(first.map((match) => match.program.id)).size).toBe(first.length);
  });

  it("requests missing economic data instead of assuming eligibility", () => {
    const matches = matchAid({ age: 10, has_disability_flag: true });
    expect(matches.some((match) => match.status === "perlu_data_tambahan")).toBe(true);
  });
});
