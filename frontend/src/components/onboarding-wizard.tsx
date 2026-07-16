"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, createIdempotencyKey } from "@/lib/api";
import {
  accessibilityOptions,
  communicationOptions,
  languageOptions,
  relationshipOptions,
  supportNeedOptions,
} from "@/lib/person-options";
import { sanitizeMultiline, sanitizeSingleLine } from "@/lib/validation";
import { useOnboardingDraft } from "@/features/people/use-onboarding-draft";

export function OnboardingWizard() {
  const router = useRouter();
  const { step, setStep, data, setData, restored, setRestored, clear, reset } = useOnboardingDraft();
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(createIdempotencyKey);

  function update<K extends keyof typeof data>(field: K, value: (typeof data)[K]) {
    setData((current) => ({ ...current, [field]: value }));
  }

  function toggle(field: "supportNeeds" | "communication" | "accessibility", value: string) {
    update(field, data[field].includes(value)
      ? data[field].filter((item) => item !== value)
      : [...data[field], value]);
  }

  function next() {
    setError("");
    const cleanName = sanitizeSingleLine(data.displayName, 1000);
    if (step === 1 && !cleanName) return setError("Masukkan nama panggilan orang yang akan didampingi.");
    if (step === 1 && cleanName.length > 80) return setError("Nama panggilan tidak boleh lebih dari 80 karakter.");
    if (step === 1 && data.birthYear && (+data.birthYear < 1900 || +data.birthYear > 2026)) {
      return setError("Masukkan tahun lahir antara 1900 dan 2026.");
    }
    if (step === 1 && !data.relationship) return setError("Pilih hubungan Anda dengan orang yang didampingi.");
    if (step === 2 && data.supportNeeds.length === 0) {
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
          display_name: sanitizeSingleLine(data.displayName, 1000),
          birth_year: data.birthYear ? Number(data.birthYear) : null,
          support_needs: data.supportNeeds,
          communication_preferences: data.communication,
          accessibility_preferences: data.accessibility,
          primary_language: data.primaryLanguage,
          notes: data.notes ? sanitizeMultiline(data.notes, 1000) : null,
          caregiver_relationship: data.relationship,
          consent,
        }),
      });
      clear();
      router.push("/app/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="wizard-shell"><section className="wizard-card">
    {restored && <div className="success draft-notice">
      <span>Draft onboarding dipulihkan.</span>
      <button className="secondary compact" onClick={() => setRestored(false)}>Tutup</button>
    </div>}
    <div className="section-heading">
      <p className="eyebrow">LANGKAH {step} DARI 5</p>
      <button className="secondary compact" type="button" onClick={() => { reset(); setConsent(false); }}>Mulai ulang</button>
    </div>
    <div className="progress"><span style={{ width: `${step * 20}%` }} /></div>
    {step === 1 && <>
      <h1>Siapa yang akan didampingi?</h1>
      <p className="muted">Gunakan nama panggilan agar terasa nyaman dan privat.</p>
      <label>Nama panggilan<input className="field" value={data.displayName} onChange={(event) => update("displayName", event.target.value)} maxLength={100} autoFocus /></label>
      <label>Tahun lahir <span className="muted">(opsional)</span><input className="field" inputMode="numeric" value={data.birthYear} onChange={(event) => update("birthYear", event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Contoh: 2020" /></label>
      <label>Hubungan Anda<select className="field" value={data.relationship} onChange={(event) => update("relationship", event.target.value)}>
        <option value="">Pilih hubungan</option>
        {relationshipOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select></label>
    </>}
    {step === 2 && <>
      <h1>Kebutuhan dukungan</h1>
      <p className="muted">Pilih yang paling relevan saat ini. Ini bukan diagnosis.</p>
      <div className="needs">{supportNeedOptions.map(([code, label]) => <label key={code} className={`need ${data.supportNeeds.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={data.supportNeeds.includes(code)} onChange={() => toggle("supportNeeds", code)} />{label}</label>)}</div>
    </>}
    {step === 3 && <>
      <h1>Preferensi komunikasi dan aksesibilitas</h1>
      <p className="muted">Opsional. Pilih penyesuaian yang membantu aktivitas terasa lebih nyaman.</p>
      <fieldset className="profile-fieldset"><legend>Komunikasi</legend><div className="needs">
        {communicationOptions.map(([code, label]) => <label key={code} className={`need ${data.communication.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={data.communication.includes(code)} onChange={() => toggle("communication", code)} />{label}</label>)}
      </div></fieldset>
      <fieldset className="profile-fieldset"><legend>Aksesibilitas</legend><div className="needs">
        {accessibilityOptions.map(([code, label]) => <label key={code} className={`need ${data.accessibility.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={data.accessibility.includes(code)} onChange={() => toggle("accessibility", code)} />{label}</label>)}
      </div></fieldset>
      <label>Bahasa utama<select className="field" value={data.primaryLanguage} onChange={(event) => update("primaryLanguage", event.target.value)}>
        {languageOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select></label>
    </>}
    {step === 4 && <>
      <h1>Hal penting untuk diketahui</h1>
      <p className="muted">Opsional. Catatan ini membantu keluarga memulai dengan konteks yang tepat.</p>
      <textarea className="field" rows={6} maxLength={1000} value={data.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Contoh: lebih nyaman dengan rutinitas dan instruksi singkat." />
      <p className="hint">{data.notes.length}/1000</p>
    </>}
    {step === 5 && <>
      <h1>Tinjau dan mulai</h1>
      <dl className="review">
        <div><dt>Nama panggilan</dt><dd>{data.displayName}</dd></div>
        <div><dt>Hubungan</dt><dd>{relationshipOptions.find(([code]) => code === data.relationship)?.[1]}</dd></div>
        <div><dt>Kebutuhan dukungan</dt><dd>{data.supportNeeds.map((code) => supportNeedOptions.find(([value]) => value === code)?.[1]).join(", ")}</dd></div>
        <div><dt>Bahasa utama</dt><dd>{languageOptions.find(([code]) => code === data.primaryLanguage)?.[1]}</dd></div>
        {data.birthYear && <div><dt>Tahun lahir</dt><dd>{data.birthYear}</dd></div>}
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
