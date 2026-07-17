import { describe, expect, it } from "vitest";
import {
  aidInputSchema,
  authInputSchema,
  chatInputSchema,
  journalInputSchema,
  personProfileInputSchema,
  roadmapItemInputSchema,
  setActiveProfileInputSchema,
} from "../validation";

describe("authInputSchema", () => {
  it("normalizes a valid email and display name", () => {
    const value = authInputSchema.parse({
      email: "  USER@Example.COM ",
      password: "SecurePass1",
      displayName: "  Bunda Alya  ",
    });
    expect(value).toEqual({
      email: "user@example.com",
      password: "SecurePass1",
      displayName: "Bunda Alya",
    });
  });

  it.each(["short1A", "alllowercase1", "ALLUPPERCASE1", "NoNumbersHere"])(
    "rejects a weak password: %s",
    (password) => {
      expect(
        authInputSchema.safeParse({ email: "user@example.com", password, displayName: "" }).success,
      ).toBe(false);
    },
  );

  it("rejects malformed and oversized emails", () => {
    expect(authInputSchema.safeParse({ email: "invalid", password: "SecurePass1" }).success).toBe(false);
    expect(
      authInputSchema.safeParse({
        email: `${"a".repeat(250)}@example.com`,
        password: "SecurePass1",
      }).success,
    ).toBe(false);
  });
});

describe("personProfileInputSchema", () => {
  const valid = {
    display_name: " Alya ",
    age: 6,
    support_summary: " Fokus komunikasi ",
    support_needs: ["Terapi wicara", "Terapi wicara"],
    emergency_contact_name: " Ibu ",
    emergency_contact_phone: "+62 812-3456-7890",
  };

  it("trims text and removes duplicate needs", () => {
    expect(personProfileInputSchema.parse(valid)).toMatchObject({
      display_name: "Alya",
      support_summary: "Fokus komunikasi",
      support_needs: ["Terapi wicara"],
      emergency_contact_name: "Ibu",
    });
  });

  it.each([-1, 121, 4.5, Number.NaN])("rejects invalid age %s", (age) => {
    expect(personProfileInputSchema.safeParse({ ...valid, age }).success).toBe(false);
  });

  it("rejects invalid phone numbers and oversized fields", () => {
    expect(
      personProfileInputSchema.safeParse({ ...valid, emergency_contact_phone: "call-me" }).success,
    ).toBe(false);
    expect(
      personProfileInputSchema.safeParse({ ...valid, support_summary: "x".repeat(1001) }).success,
    ).toBe(false);
  });
});

describe("mutation schemas", () => {
  it("trims chat and journal text", () => {
    expect(chatInputSchema.parse({ text: " hello " }).text).toBe("hello");
    expect(journalInputSchema.parse({ content: " note ", mood_tag: "Tenang" }).content).toBe("note");
  });

  it("rejects unsupported mood values and unknown aid fields", () => {
    expect(journalInputSchema.safeParse({ content: "note", mood_tag: "Other" }).success).toBe(false);
    expect(aidInputSchema.safeParse({ dtks_or_low_income: true, admin: true }).success).toBe(false);
  });

  it("validates UUIDs and roadmap status", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(setActiveProfileInputSchema.safeParse({ id }).success).toBe(true);
    expect(roadmapItemInputSchema.safeParse({ id, status: "done" }).success).toBe(true);
    expect(roadmapItemInputSchema.safeParse({ id: "bad", status: "deleted" }).success).toBe(false);
  });
});
