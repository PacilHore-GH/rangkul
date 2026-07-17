import { describe, expect, test } from "bun:test";
import { assertRole, canPerformPersonAction } from "./authorization";

describe("authorization helpers", () => {
  test("professional can review but cannot manage consent", () => {
    expect(canPerformPersonAction("professional", "review")).toBe(true);
    expect(canPerformPersonAction("professional", "manage_consent")).toBe(false);
  });
  test("rejects an unaccepted role", () => {
    expect(() => assertRole("family_member_caregiver", ["admin"])).toThrow("Forbidden");
  });
});
