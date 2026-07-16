"use client";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
function ResetPasswordForm() { const params = useSearchParams(); const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); async function submit(e: FormEvent) { e.preventDefault(); try { await api("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token: params.get("token"), new_password: password }) }); setMessage("Kata sandi diperbarui. Silakan masuk kembali."); } catch (e) { setError(e instanceof ApiError ? e.message : "Permintaan gagal."); } } return <main className="auth-shell"><section className="auth-card"><h1>Buat kata sandi baru</h1>{message ? <p className="success">{message} <Link href="/login">Masuk</Link></p> : <form onSubmit={submit}><label>Kata sandi baru<input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} required /><span className="hint">Minimal 12 karakter</span></label>{error && <p className="form-error">{error}</p>}<button className="primary">Simpan kata sandi</button></form>}</section></main>; }

export default function ResetPasswordPage() { return <Suspense fallback={<main className="auth-shell">Memuat formulir reset…</main>}><ResetPasswordForm /></Suspense>; }
