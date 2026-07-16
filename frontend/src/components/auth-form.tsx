"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, CurrentUser } from "@/lib/api";
import { PasswordField } from "@/components/password-field";
import {
  assertStrongPassword,
  assertValidEmail,
  InputValidationError,
  sanitizeSingleLine,
} from "@/lib/validation";

const inputClass = "auth-input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    let normalizedEmail: string;
    let sanitizedName = "";
    try {
      normalizedEmail = assertValidEmail(email);
      if (isRegister) {
        assertStrongPassword(password);
        sanitizedName = sanitizeSingleLine(name, 1000);
        if (sanitizedName.length > 80) {
          throw new InputValidationError("Nama tidak boleh lebih dari 80 karakter.");
        }
      } else if (!password) {
        throw new InputValidationError("Masukkan kata sandi Anda.");
      }
    } catch (err) {
      setError(err instanceof InputValidationError ? err.message : "Input tidak valid.");
      return;
    }

    if (isRegister && !sanitizedName) {
      setError("Masukkan nama Anda.");
      return;
    }
    if (isRegister && !terms) {
      setError("Centang persetujuan penggunaan data untuk melanjutkan.");
      return;
    }

    setLoading(true);
    try {
      const payload = isRegister
        ? { email: normalizedEmail, password, full_name: sanitizedName, terms_accepted: terms }
        : { email: normalizedEmail, password };
      const user = await api<CurrentUser>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(user.onboarding_completed ? "/app/dashboard" : "/app/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <header className="auth-header">
      <p className="eyebrow">RANGKUL · KELUARGA</p>
      <h1>{isRegister ? "Mulai mendampingi, bersama." : "Selamat datang kembali."}</h1>
      <p className="muted">{isRegister ? "Buat akun keluarga untuk menyimpan dukungan yang paling berarti." : "Masuk untuk melanjutkan ruang pendampingan keluarga Anda."}</p>
    </header>
    <form onSubmit={submit} className="form-stack" noValidate>
      {isRegister && <label>Nama Anda<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} /></label>}
      <label>Email<input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} required /></label>
      <PasswordField
        label="Kata sandi"
        className={inputClass}
        value={password}
        onChange={setPassword}
        autoComplete={isRegister ? "new-password" : "current-password"}
        showRequirements={isRegister}
      />
      {isRegister && <label className="check"><input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} /> Saya menyetujui penggunaan data secara bertanggung jawab.</label>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="primary" disabled={loading}>{loading ? "Memproses…" : isRegister ? "Buat akun keluarga" : "Masuk"}</button>
    </form>
    <div className="auth-links">{isRegister ? <>Sudah punya akun? <Link href="/login">Masuk</Link></> : <><Link href="/forgot-password">Lupa kata sandi?</Link><br />Belum punya akun? <Link href="/register">Daftar</Link></>}</div>
  </section></main>;
}
