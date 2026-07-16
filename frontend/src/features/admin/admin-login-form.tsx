"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, CurrentUser } from "@/lib/api";
import { PasswordField } from "@/components/password-field";
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
      if (user.role !== "admin") throw new InputValidationError("Akun tidak memiliki akses Admin.");
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof InputValidationError
        ? err.message : "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <header className="auth-header">
      <p className="eyebrow">RANGKUL · ADMIN INTERNAL</p>
      <h1>Kelola data eksternal.</h1>
      <p className="muted">Akses ini tidak memberikan izin ke profil atau data privat keluarga.</p>
    </header>
    <form className="form-stack" onSubmit={submit} noValidate>
      <label>Email Admin<input className="auth-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
      <PasswordField label="Kata sandi Admin" className="auth-input" value={password} onChange={setPassword} autoComplete="current-password" />
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="primary" disabled={loading}>{loading ? "Memproses…" : "Masuk sebagai Admin"}</button>
    </form>
  </section></main>;
}
