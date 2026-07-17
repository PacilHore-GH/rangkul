import { z } from "zod";

const normalizedText = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} wajib diisi.` })
    .trim()
    .min(min, `${label} wajib diisi.`)
    .max(max, `${label} maksimal ${max} karakter.`);

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} maksimal ${max} karakter.`).default("");

export const uuidSchema = z.string().uuid("ID tidak valid.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Format email tidak valid.")
  .max(254, "Email terlalu panjang.");

export const passwordSchema = z
  .string()
  .min(10, "Kata sandi minimal 10 karakter.")
  .max(128, "Kata sandi maksimal 128 karakter.")
  .regex(/[a-z]/, "Kata sandi harus memiliki huruf kecil.")
  .regex(/[A-Z]/, "Kata sandi harus memiliki huruf besar.")
  .regex(/[0-9]/, "Kata sandi harus memiliki angka.");

export const authInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: optionalText(80, "Nama panggilan"),
});

export const personProfileInputSchema = z.object({
  display_name: normalizedText(1, 80, "Nama panggilan"),
  age: z.number().int("Usia harus berupa bilangan bulat.").min(0).max(120).nullable().optional(),
  support_summary: optionalText(1_000, "Ringkasan dukungan"),
  support_needs: z
    .array(normalizedText(1, 60, "Kebutuhan dukungan"))
    .max(20, "Maksimal 20 kebutuhan dukungan.")
    .transform((values) => [...new Set(values)]),
  emergency_contact_name: optionalText(120, "Nama kontak darurat"),
  emergency_contact_phone: z
    .string()
    .trim()
    .max(40, "Nomor telepon maksimal 40 karakter.")
    .refine((value) => value === "" || /^\+?[0-9][0-9 ()-]{5,38}$/.test(value), {
      message: "Format nomor telepon tidak valid.",
    })
    .default(""),
});

export const setActiveProfileInputSchema = z.object({ id: uuidSchema });
export const chatInputSchema = z.object({ text: normalizedText(1, 1_000, "Pesan") });
export const journalInputSchema = z.object({
  content: normalizedText(1, 2_000, "Catatan"),
  mood_tag: z.enum(["Tenang", "Bersemangat", "Lelah", "Kesulitan", "Bangga"]),
});
export const aidInputSchema = z.object({ dtks_or_low_income: z.boolean().optional() }).strict();
export const roadmapItemInputSchema = z.object({
  id: uuidSchema,
  status: z.enum(["open", "done"]),
});

export function firstValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data yang dimasukkan tidak valid.";
}
