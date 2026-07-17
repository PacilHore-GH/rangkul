"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { PasswordField } from "@/components/password-field";
import { api, ApiError, CurrentUser } from "@/lib/api";
import { assertValidEmail, InputValidationError } from "@/lib/validation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const normalizedEmail = assertValidEmail(email);
      if (!password) throw new InputValidationError("Masukkan kata sandi Admin.");
      setLoading(true);
      const user = await api<CurrentUser>("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      if (user.role !== "admin") {
        throw new InputValidationError("Akun tidak memiliki akses Admin.");
      }
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof InputValidationError
          ? err.message
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="RANGKUL · ADMIN INTERNAL"
      title="Kelola data eksternal."
      description="Akses ini tidak memberikan izin ke profil atau data privat keluarga."
      heroTitle="Panel internal tetap rapi dan tenang."
      heroDescription="Admin memakai pintu masuk yang terpisah supaya area keluarga dan area operasional tidak bercampur."
      form={
        <>
          <form className="form-stack" onSubmit={submit} noValidate>
            <AuthTextField
              label="Email Admin"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <PasswordField
              label="Kata sandi Admin"
              className="auth-input"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              hint="Masukkan kata sandi admin internal"
            />
            {error ? (
              <p role="alert" className="form-error">
                {error}
              </p>
            ) : null}
            <button className="primary" disabled={loading}>
              {loading ? "Memproses..." : "Masuk sebagai Admin"}
            </button>
          </form>
          <div className="auth-links">
            Kembali ke akun keluarga? <Link href="/login">Masuk di sini</Link>
          </div>
        </>
      }
    />
  );
}
