"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

const needs = [
  ["communication", "Komunikasi"], ["learning", "Belajar"], ["mobility", "Mobilitas"],
  ["sensory", "Sensori"], ["daily_living", "Aktivitas harian"], ["social_emotional", "Sosial & emosi"],
] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function next() {
    setError("");
    if (step === 1 && (!displayName.trim() || displayName.trim().length > 80 || (birthYear && (+birthYear < 1900 || +birthYear > 2026)))) return setError("Isi nama panggilan dan tahun lahir yang valid.");
    if (step === 2 && selected.length === 0) return setError("Pilih setidaknya satu kebutuhan dukungan.");
    setStep(step + 1);
  }
  function toggle(value: string) { setSelected(current => current.includes(value) ? current.filter(x => x !== value) : [...current, value]); }
  async function finish() {
    setError("");
    if (!consent) return setError("Persetujuan wajib diberikan untuk menyelesaikan profil.");
    setLoading(true);
    try {
      await api("/people", { method: "POST", body: JSON.stringify({ display_name: displayName, birth_year: birthYear ? Number(birthYear) : null, support_needs: selected, notes: notes || null, consent }) });
      router.push("/app/dashboard");
    } catch (err) { setError(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server."); }
    finally { setLoading(false); }
  }
  return <main className="wizard-shell"><section className="wizard-card">
    <p className="eyebrow">LANGKAH {step} DARI 4</p><div className="progress"><span style={{ width: `${step * 25}%` }} /></div>
    {step === 1 && <><h1>Siapa yang akan didampingi?</h1><p className="muted">Gunakan nama panggilan agar terasa nyaman dan privat.</p><label>Nama panggilan<input className="field" value={displayName} onChange={e => setDisplayName(e.target.value)} autoFocus /></label><label>Tahun lahir <span className="muted">(opsional)</span><input className="field" inputMode="numeric" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="Contoh: 2020" /></label></>}
    {step === 2 && <><h1>Kebutuhan dukungan</h1><p className="muted">Pilih yang paling relevan saat ini. Ini bukan diagnosis.</p><div className="needs">{needs.map(([code, label]) => <label key={code} className={`need ${selected.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={selected.includes(code)} onChange={() => toggle(code)} />{label}</label>)}</div></>}
    {step === 3 && <><h1>Hal penting untuk diketahui</h1><p className="muted">Opsional. Catatan ini membantu keluarga memulai dengan konteks yang tepat.</p><textarea className="field" rows={6} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contoh: lebih nyaman dengan rutinitas dan instruksi singkat." /><p className="hint">{notes.length}/1000</p></>}
    {step === 4 && <><h1>Tinjau dan mulai</h1><dl className="review"><div><dt>Nama panggilan</dt><dd>{displayName}</dd></div><div><dt>Kebutuhan dukungan</dt><dd>{selected.map(code => needs.find(n => n[0] === code)?.[1]).join(", ")}</dd></div>{birthYear && <div><dt>Tahun lahir</dt><dd>{birthYear}</dd></div>}</dl><label className="check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> Saya berwenang mengelola profil ini dan menyetujui penyimpanan data untuk pendampingan keluarga.</label></>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="actions">{step > 1 && <button className="secondary" onClick={() => { setError(""); setStep(step - 1); }}>Kembali</button>}{step < 4 ? <button className="primary" onClick={next}>Lanjut</button> : <button className="primary" disabled={loading} onClick={finish}>{loading ? "Menyimpan…" : "Selesaikan profil"}</button>}</div>
  </section></main>;
}
