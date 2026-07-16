"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError, Person } from "@/lib/api";
import { LogoutButton } from "@/components/logout-button";

export function FamilyDashboard() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Person[]>("/people")
      .then(setPeople)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 404)) {
          setError("Profil pendampingan belum dapat dimuat. Silakan coba lagi.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return <main className="app-shell">
    <header className="app-header">
      <div>
        <p className="eyebrow">RANGKUL · RUANG KELUARGA</p>
        <h1>{people.length ? `Anda mendampingi ${people.length} orang.` : "Ruang keluarga Anda sudah siap."}</h1>
      </div>
      <LogoutButton />
    </header>
    {loading ? <p>Memuat ruang keluarga…</p> : people.length ? (
      <>
        <p className="muted">Kelola kebutuhan dukungan setiap anggota keluarga dalam satu ruang pendampingan.</p>
        <section className="dashboard-card">
          <div className="section-heading">
            <h2>Orang yang didampingi</h2>
            <Link className="primary inline" href="/app/profile">Kelola dan tambah profil</Link>
          </div>
          <div className="profile-list">
            {people.map((person) => <article className="profile-list-item" key={person.id}>
              <div>
                <h3>{person.display_name}</h3>
                <p className="muted">
                  {person.birth_year ? `Lahir ${person.birth_year} · ` : ""}
                  {person.support_needs.join(" · ")}
                </p>
              </div>
            </article>)}
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
    {error && <p role="alert" className="form-error">{error}</p>}
  </main>;
}
