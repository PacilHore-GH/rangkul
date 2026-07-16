"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, createIdempotencyKey } from "@/lib/api";
import {
  accessibilityOptions,
  communicationOptions,
  languageOptions,
  supportNeedOptions,
} from "@/lib/person-options";
import { sanitizeMultiline, sanitizeSingleLine } from "@/lib/validation";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [communication, setCommunication] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [primaryLanguage, setPrimaryLanguage] = useState("id");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(createIdempotencyKey);

  function toggle(setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) {
    setter((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  }

  function next() {
    setError("");
    const cleanName = sanitizeSingleLine(displayName, 1000);
    if (step === 1 && !cleanName) return setError("Masukkan nama panggilan orang yang akan didampingi.");
    if (step === 1 && cleanName.length > 80) return setError("Nama panggilan tidak boleh lebih dari 80 karakter.");
    if (step === 1 && birthYear && (+birthYear < 1900 || +birthYear > 2026)) {
      return setError("Masukkan tahun lahir antara 1900 dan 2026.");
    }
    if (step === 2 && selected.length === 0) {
      return setError("Pilih minimal satu kebutuhan dukungan untuk melanjutkan.");
    }
    setStep((current) => current + 1);
  }

  async function finish() {
    setError("");
    if (!consent) return setError("Centang pernyataan kewenangan untuk menyelesaikan onboarding.");
    setLoading(true);
    try {
      await api("/people/onboarding", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          display_name: sanitizeSingleLine(displayName, 1000),
          birth_year: birthYear ? Number(birthYear) : null,
          support_needs: selected,
          communication_preferences: communication,
          accessibility_preferences: accessibility,
          primary_language: primaryLanguage,
          notes: notes ? sanitizeMultiline(notes, 1000) : null,
          consent,
        }),
      });
      router.push("/app/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="wizard-shell"><section className="wizard-card">
    <p className="eyebrow">LANGKAH {step} DARI 5</p>
    <div className="progress"><span style={{ width: `${step * 20}%` }} /></div>
    {step === 1 && <>
      <h1>Siapa yang akan didampingi?</h1>
      <p className="muted">Gunakan nama panggilan agar terasa nyaman dan privat.</p>
      <label>Nama panggilan<input className="field" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={100} autoFocus /></label>
      <label>Tahun lahir <span className="muted">(opsional)</span><input className="field" inputMode="numeric" value={birthYear} onChange={(event) => setBirthYear(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Contoh: 2020" /></label>
    </>}
    {step === 2 && <>
      <h1>Kebutuhan dukungan</h1>
      <p className="muted">Pilih yang paling relevan saat ini. Ini bukan diagnosis.</p>
      <div className="needs">{supportNeedOptions.map(([code, label]) => <label key={code} className={`need ${selected.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={selected.includes(code)} onChange={() => toggle(setSelected, code)} />{label}</label>)}</div>
    </>}
    {step === 3 && <>
      <h1>Preferensi komunikasi dan aksesibilitas</h1>
      <p className="muted">Opsional. Pilih penyesuaian yang membantu aktivitas terasa lebih nyaman.</p>
      <fieldset className="profile-fieldset"><legend>Komunikasi</legend><div className="needs">
        {communicationOptions.map(([code, label]) => <label key={code} className={`need ${communication.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={communication.includes(code)} onChange={() => toggle(setCommunication, code)} />{label}</label>)}
      </div></fieldset>
      <fieldset className="profile-fieldset"><legend>Aksesibilitas</legend><div className="needs">
        {accessibilityOptions.map(([code, label]) => <label key={code} className={`need ${accessibility.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={accessibility.includes(code)} onChange={() => toggle(setAccessibility, code)} />{label}</label>)}
      </div></fieldset>
      <label>Bahasa utama<select className="field" value={primaryLanguage} onChange={(event) => setPrimaryLanguage(event.target.value)}>
        {languageOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select></label>
    </>}
    {step === 4 && <>
      <h1>Hal penting untuk diketahui</h1>
      <p className="muted">Opsional. Catatan ini membantu keluarga memulai dengan konteks yang tepat.</p>
      <textarea className="field" rows={6} maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Contoh: lebih nyaman dengan rutinitas dan instruksi singkat." />
      <p className="hint">{notes.length}/1000</p>
    </>}
    {step === 5 && <>
      <h1>Tinjau dan mulai</h1>
      <dl className="review">
        <div><dt>Nama panggilan</dt><dd>{displayName}</dd></div>
        <div><dt>Kebutuhan dukungan</dt><dd>{selected.map((code) => supportNeedOptions.find(([value]) => value === code)?.[1]).join(", ")}</dd></div>
        <div><dt>Bahasa utama</dt><dd>{languageOptions.find(([code]) => code === primaryLanguage)?.[1]}</dd></div>
        {birthYear && <div><dt>Tahun lahir</dt><dd>{birthYear}</dd></div>}
      </dl>
      <label className="check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Saya berwenang mengelola profil ini dan menyetujui penyimpanan data untuk pendampingan keluarga.</label>
    </>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="actions">
      {step > 1 && <button className="secondary" onClick={() => { setError(""); setStep((current) => current - 1); }}>Kembali</button>}
      {step < 5
        ? <button className="primary" onClick={next}>Lanjut</button>
        : <button className="primary" disabled={loading} onClick={finish}>{loading ? "Menyimpan…" : "Selesaikan profil"}</button>}
    </div>
  </section></main>;
}
