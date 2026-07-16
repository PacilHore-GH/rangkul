export class InputValidationError extends Error {
  name = "InputValidationError";
}

export function assertValidEmail(value: string): string {
  const email = value.trim().toLowerCase();
  const [localPart, domain, ...rest] = email.split("@");
  const labels = domain?.split(".") ?? [];
  const hasValidTld = labels.length >= 2 && labels.every(Boolean) && labels.at(-1)!.length >= 2;

  if (!localPart || !domain || rest.length > 0 || /\s/.test(email) || !hasValidTld) {
    throw new InputValidationError("Masukkan alamat email yang valid, misalnya nama@mail.com.");
  }
  return email;
}

export const passwordRequirements = (value: string) => [
  { key: "length", label: "12–128 karakter", met: value.length >= 12 && value.length <= 128 },
  { key: "lowercase", label: "Satu huruf kecil", met: /[a-z]/.test(value) },
  { key: "uppercase", label: "Satu huruf besar", met: /[A-Z]/.test(value) },
  { key: "number", label: "Satu angka", met: /\d/.test(value) },
  { key: "symbol", label: "Satu simbol", met: /[^\w\s]/.test(value) },
  { key: "whitespace", label: "Tanpa spasi", met: value.length > 0 && !/\s/.test(value) },
];

export function assertStrongPassword(value: string): string {
  if (value.length < 12 || value.length > 128) {
    throw new InputValidationError("Kata sandi harus terdiri dari 12–128 karakter.");
  }
  if (/\s/.test(value)) throw new InputValidationError("Kata sandi tidak boleh mengandung spasi.");
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^\w\s]/.test(value)) {
    throw new InputValidationError("Kata sandi harus memiliki huruf besar, huruf kecil, angka, dan simbol.");
  }
  return value;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "");
}

export function sanitizeSingleLine(value: string, maxLength: number): string {
  return normalizeText(value)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultiline(value: string, maxLength: number): string {
  return normalizeText(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength);
}
