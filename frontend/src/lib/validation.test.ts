import { describe, expect, it } from "vitest";

import {
  InputValidationError,
  assertStrongPassword,
  assertValidEmail,
  passwordRequirements,
  sanitizeMultiline,
  sanitizeSingleLine,
} from "./validation";

describe("assertValidEmail", () => {
  it.each(["test123@mailashiodoiashd", "test@localhost", "test@mail.", "@mail.com", "test mail@mail.com"])("throws an exception for invalid public email %s", (email) => {
    expect(() => assertValidEmail(email)).toThrow(InputValidationError);
  });

  it.each(["test123@mail.com", "ibu@example.co.id", " USER@MAIL.ID "])("accepts and normalizes %s", (email) => {
    expect(assertValidEmail(email)).toMatch(/^[a-z0-9]+@.+\..+$/);
  });
});

describe("assertStrongPassword", () => {
  it.each(["Short1!", "lowercaseonly1!", "UPPERCASEONLY1!", "NoNumberSymbol!", "NoSymbol123A", "Contains space1A!"])("throws an exception for weak password", (password) => {
    expect(() => assertStrongPassword(password)).toThrow(InputValidationError);
  });

  it.each(["Password-Aman12!", "KataSandi#2026A"])("accepts a strong password", (password) => {
    expect(assertStrongPassword(password)).toBe(password);
  });
});

describe("passwordRequirements", () => {
  it("reports partial progress without treating weak input as valid", () => {
    const requirements = passwordRequirements("Password");
    expect(requirements.filter((item) => item.met).map((item) => item.key)).toEqual([
      "lowercase",
      "uppercase",
      "whitespace",
    ]);
  });
});

describe("text sanitization", () => {
  it("normalizes single-line input and removes markup and control characters", () => {
    expect(sanitizeSingleLine("  <b>Ibu</b>\u0000   Rani  ", 80)).toBe("Ibu Rani");
  });

  it("preserves safe line breaks while removing script content", () => {
    expect(sanitizeMultiline("Catatan <b>aman</b>\r\n<script>alert(1)</script>Baris dua", 1000))
      .toBe("Catatan aman\nBaris dua");
  });
});
