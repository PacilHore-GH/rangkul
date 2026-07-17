"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { PasswordField } from "@/components/password-field";
import { assertStrongPassword, InputValidationError } from "@/lib/validation";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({
          token: params.get("token"),
          new_password: assertStrongPassword(password),
        }),
      });
      setMessage("Kata sandi diperbarui. Silakan masuk kembali.");
    } catch (err) {
      setError(err instanceof InputValidationError || err instanceof ApiError ? err.message : "Permintaan gagal.");
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <header className="auth-header">
      <p className="eyebrow">KEAMANAN AKUN</p>
      <h1>Buat kata sandi baru</h1>
      <p className="muted">Gunakan kata sandi yang kuat dan berbeda dari akun Anda yang lain.</p>
    </header>
    {message ? <p className="success">{message} <Link href="/login">Masuk</Link></p> : (
      <form onSubmit={submit} className="form-stack">
        <PasswordField
          label="Kata sandi baru"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          showRequirements
        />
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="primary">Simpan kata sandi</button>
      </form>
    )}
  </section></main>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="auth-shell">Memuat formulir reset…</main>}><ResetPasswordForm /></Suspense>;
}
