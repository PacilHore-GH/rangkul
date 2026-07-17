"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Permintaan belum berhasil dikirim. Periksa koneksi Anda lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <header className="auth-header">
      <p className="eyebrow">BANTUAN AKUN</p>
      <h1>Atur ulang kata sandi</h1>
      <p className="muted">Masukkan email akun Anda. Kami akan menyiapkan tautan untuk membuat kata sandi baru.</p>
    </header>
    {done ? (
      <p className="success">Jika email tersebut terdaftar, tautan reset sudah dibuat. Untuk demo lokal, lihat log backend.</p>
    ) : (
      <form onSubmit={submit} className="form-stack" noValidate>
        <label>Email<input className="auth-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} required /></label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="primary" disabled={loading}>{loading ? "Mengirim…" : "Kirim tautan reset"}</button>
      </form>
    )}
    <div className="auth-links"><Link href="/login">Kembali ke halaman masuk</Link></div>
  </section></main>;
}
