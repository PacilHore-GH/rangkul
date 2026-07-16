"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [done, setDone] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); try { await api("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email }) }); setDone(true); } catch { setError("Tidak dapat mengirim permintaan. Coba lagi."); } }
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">BANTUAN AKUN</p><h1>Atur ulang kata sandi</h1>{done ? <p className="success">Jika email terdaftar, tautan reset telah dikirim. Pada demo lokal, cek log backend.</p> : <form onSubmit={submit}><label>Email<input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary">Kirim tautan reset</button></form>}<div className="auth-links"><Link href="/login">Kembali ke masuk</Link></div></section></main>;
}
