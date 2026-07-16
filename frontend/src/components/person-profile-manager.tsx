"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, createIdempotencyKey, Person } from "@/lib/api";
import {
  accessibilityOptions,
  communicationOptions,
  languageOptions,
  supportNeedOptions,
} from "@/lib/person-options";
import { sanitizeMultiline, sanitizeSingleLine } from "@/lib/validation";

export function PersonProfileManager() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [supportNeeds, setSupportNeeds] = useState<string[]>([]);
  const [communication, setCommunication] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [primaryLanguage, setPrimaryLanguage] = useState("id");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  useEffect(() => {
    api<Person[]>("/people")
      .then(setPeople)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.replace("/login");
        else setError("Daftar orang yang didampingi belum dapat dimuat. Silakan coba lagi.");
      })
      .finally(() => setLoading(false));
  // Load the caregiver's profiles once when entering this protected page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setSelected(null);
    setDisplayName("");
    setBirthYear("");
    setSupportNeeds([]);
    setCommunication([]);
    setAccessibility([]);
    setPrimaryLanguage("id");
    setNotes("");
    setConsent(false);
    setIdempotencyKey(createIdempotencyKey());
    setError("");
  }

  function startCreate() {
    resetForm();
    setMode("create");
  }

  function startEdit(person: Person) {
    setSelected(person);
    setDisplayName(person.display_name);
    setBirthYear(person.birth_year?.toString() ?? "");
    setSupportNeeds(person.support_needs);
    setCommunication(person.communication_preferences);
    setAccessibility(person.accessibility_preferences);
    setPrimaryLanguage(person.primary_language);
    setNotes(person.notes ?? "");
    setError("");
    setMode("edit");
  }

  function toggleNeed(code: string) {
    setSupportNeeds((current) => current.includes(code)
      ? current.filter((item) => item !== code)
      : [...current, code]);
  }

  function togglePreference(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    code: string,
  ) {
    setter((current) => current.includes(code)
      ? current.filter((item) => item !== code)
      : [...current, code]);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    const cleanName = sanitizeSingleLine(displayName, 1000);
    if (!cleanName) return setError("Masukkan nama panggilan.");
    if (cleanName.length > 80) return setError("Nama panggilan tidak boleh lebih dari 80 karakter.");
    if (birthYear && (+birthYear < 1900 || +birthYear > 2026)) {
      return setError("Masukkan tahun lahir antara 1900 dan 2026.");
    }
    if (supportNeeds.length === 0) return setError("Pilih minimal satu kebutuhan dukungan.");
    if (mode === "create" && !consent) {
      return setError("Centang pernyataan kewenangan untuk menyimpan profil.");
    }

    setSaving(true);
    try {
      const payload = {
        display_name: cleanName,
        birth_year: birthYear ? Number(birthYear) : null,
        support_needs: supportNeeds,
        communication_preferences: communication,
        accessibility_preferences: accessibility,
        primary_language: primaryLanguage,
        notes: notes ? sanitizeMultiline(notes, 1000) : null,
        ...(mode === "create" ? { consent } : {}),
      };
      const saved = await api<Person>(mode === "create" ? "/people" : `/people/${selected!.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: mode === "create" ? { "Idempotency-Key": idempotencyKey } : undefined,
        body: JSON.stringify(payload),
      });
      setPeople((current) => mode === "create"
        ? [...current, saved]
        : current.map((person) => person.id === saved.id ? saved : person));
      resetForm();
      setMode("list");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Profil belum berhasil disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(person: Person) {
    if (!window.confirm(`Hapus profil ${person.display_name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setSaving(true);
    setError("");
    try {
      await api(`/people/${person.id}`, { method: "DELETE" });
      setPeople((current) => current.filter((item) => item.id !== person.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Profil belum berhasil dihapus.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Memuat profil…</p>;

  if (mode === "list") {
    return <section className="dashboard-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ORANG YANG DIDAMPINGI</p>
          <h2>Profil pendampingan</h2>
          <p className="muted">Kelola seluruh anggota keluarga yang Anda dampingi dalam satu akun.</p>
        </div>
        <button className="primary compact" onClick={startCreate}>Tambah orang yang didampingi</button>
      </div>
      {people.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada profil aktif.</p>
          <button className="primary" onClick={startCreate}>Tambahkan profil</button>
        </div>
      ) : (
        <div className="profile-list">
          {people.map((person) => <article className="profile-list-item" key={person.id}>
            <div>
              <h3>{person.display_name}</h3>
              <p className="muted">{person.birth_year ? `Lahir ${person.birth_year} · ` : ""}
                {person.support_needs.map((code) => supportNeedOptions.find(([value]) => value === code)?.[1] ?? code).join(", ")}
              </p>
              {person.notes && <p>{person.notes}</p>}
            </div>
            <div className="button-row">
              <button className="secondary compact" onClick={() => startEdit(person)}>Edit profil</button>
              <button className="danger-button compact" disabled={saving} onClick={() => remove(person)}>Hapus profil</button>
            </div>
          </article>)}
        </div>
      )}
      {error && <p role="alert" className="form-error">{error}</p>}
    </section>;
  }

  return <section className="dashboard-card">
    <p className="eyebrow">{mode === "create" ? "TAMBAH PROFIL" : "EDIT PROFIL"}</p>
    <h2>{mode === "create" ? "Tambahkan orang yang didampingi" : "Perbarui profil pendampingan"}</h2>
    <form className="form-stack" onSubmit={save} noValidate>
      <label>Nama panggilan<input className="field" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={100} /></label>
      <label>Tahun lahir <span className="muted">(opsional)</span><input className="field" inputMode="numeric" value={birthYear} onChange={(event) => setBirthYear(event.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
      <fieldset className="profile-fieldset"><legend>Kebutuhan dukungan</legend><div className="needs">
        {supportNeedOptions.map(([code, label]) => <label key={code} className={`need ${supportNeeds.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={supportNeeds.includes(code)} onChange={() => toggleNeed(code)} />{label}</label>)}
      </div></fieldset>
      <fieldset className="profile-fieldset"><legend>Preferensi komunikasi</legend><div className="needs">
        {communicationOptions.map(([code, label]) => <label key={code} className={`need ${communication.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={communication.includes(code)} onChange={() => togglePreference(setCommunication, code)} />{label}</label>)}
      </div></fieldset>
      <fieldset className="profile-fieldset"><legend>Preferensi aksesibilitas</legend><div className="needs">
        {accessibilityOptions.map(([code, label]) => <label key={code} className={`need ${accessibility.includes(code) ? "chosen" : ""}`}><input type="checkbox" checked={accessibility.includes(code)} onChange={() => togglePreference(setAccessibility, code)} />{label}</label>)}
      </div></fieldset>
      <label>Bahasa utama<select className="field" value={primaryLanguage} onChange={(event) => setPrimaryLanguage(event.target.value)}>
        {languageOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select></label>
      <label>Catatan <span className="muted">(opsional)</span><textarea className="field" rows={5} maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      {mode === "create" && <label className="check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Saya berwenang mengelola profil orang yang didampingi.</label>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="button-row">
        <button type="button" className="secondary" onClick={() => { resetForm(); setMode("list"); }}>Batal</button>
        <button className="primary" disabled={saving}>{saving ? "Menyimpan…" : mode === "create" ? "Simpan profil" : "Simpan perubahan"}</button>
      </div>
    </form>
  </section>;
}
