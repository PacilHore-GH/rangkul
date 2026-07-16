"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, CurrentUser } from "@/lib/api";

const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

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
    if (password.length < 12) return setError("Kata sandi minimal 12 karakter.");
    if (isRegister && (!name.trim() || !terms)) return setError("Isi nama dan setujui syarat penggunaan.");
    setLoading(true);
    try {
      const user = await api<CurrentUser>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(isRegister ? { email, password, full_name: name, terms_accepted: terms } : { email, password }),
      });
      router.push(user.has_profile ? "/app/dashboard" : "/app/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <p className="eyebrow">RANGKUL · KELUARGA</p>
    <h1>{isRegister ? "Mulai mendampingi, bersama." : "Selamat datang kembali."}</h1>
    <p className="muted">{isRegister ? "Buat akun keluarga untuk menyimpan dukungan yang paling berarti." : "Masuk untuk melanjutkan ruang pendampingan keluarga Anda."}</p>
    <form onSubmit={submit} className="space-y-4" noValidate>
      {isRegister && <label>Nama Anda<input className={inputClass} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>}
      <label>Email<input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
      <label>Kata sandi<input className={inputClass} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={isRegister ? "new-password" : "current-password"} required /><span className="hint">Minimal 12 karakter</span></label>
      {isRegister && <label className="check"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /> Saya menyetujui penggunaan data secara bertanggung jawab.</label>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="primary" disabled={loading}>{loading ? "Memproses…" : isRegister ? "Buat akun keluarga" : "Masuk"}</button>
    </form>
    <div className="auth-links">{isRegister ? <>Sudah punya akun? <Link href="/login">Masuk</Link></> : <><Link href="/forgot-password">Lupa kata sandi?</Link><br />Belum punya akun? <Link href="/register">Daftar</Link></>}</div>
  </section></main>;
}
