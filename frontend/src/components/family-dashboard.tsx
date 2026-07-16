"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { useActivePerson } from "@/features/people/active-person-context";
import { relationshipOptions, supportNeedOptions } from "@/lib/person-options";

const sectionLabels: Record<string, string> = {
  basic: "Data dasar",
  support_needs: "Kebutuhan dukungan",
  preferences: "Preferensi",
  notes: "Catatan pendampingan",
};

export function FamilyDashboard() {
  const { people, activePerson, activePersonId, selectPerson, loading } = useActivePerson();

  return <main className="app-shell">
    <header className="app-header">
      <div>
        <p className="eyebrow">RANGKUL · RUANG KELUARGA</p>
        <h1>{people.length ? `Anda mendampingi ${people.length} orang.` : "Ruang keluarga Anda sudah siap."}</h1>
      </div>
      <LogoutButton />
    </header>
    {loading ? <p>Memuat ruang keluarga…</p> : activePerson ? (
      <>
        <section className="dashboard-card active-person-card">
          <div>
            <label>Orang yang sedang didampingi<select className="field" value={activePersonId ?? ""} onChange={(event) => selectPerson(event.target.value)}>
              {people.map((person) => <option key={person.id} value={person.id}>{person.display_name}</option>)}
            </select></label>
          </div>
          <Link className="primary inline" href="/app/profile">Tambah atau kelola profil</Link>
        </section>
        <section className="dashboard-card">
          <p className="eyebrow">PROFIL AKTIF</p>
          <h2>{activePerson.display_name}</h2>
          <p className="muted">
            {relationshipOptions.find(([code]) => code === activePerson.caregiver_relationship)?.[1] ?? "Hubungan belum ditentukan"}
            {" · "}
            {activePerson.support_needs.map((code) => supportNeedOptions.find(([value]) => value === code)?.[1] ?? code).join(", ")}
          </p>
          <div className="completeness">
            <div className="section-heading"><strong>Kelengkapan profil</strong><strong>{activePerson.completeness.percentage}%</strong></div>
            <div className="progress"><span style={{ width: `${activePerson.completeness.percentage}%` }} /></div>
            <ul>{activePerson.completeness.sections.map((section) => <li key={section.code} className={section.completed ? "complete" : ""}>
              {section.completed ? "✓" : "○"} {sectionLabels[section.code] ?? section.code}
            </li>)}</ul>
          </div>
        </section>
      </>
    ) : (
      <section className="dashboard-card empty-state">
        <h2>Belum ada profil aktif</h2>
        <p className="muted">Anda dapat membuat profil baru tanpa mengulangi onboarding.</p>
        <Link className="primary inline" href="/app/profile">Tambahkan profil</Link>
      </section>
    )}
  </main>;
}
