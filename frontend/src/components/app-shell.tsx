"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { useActivePerson } from "@/features/people/active-person-context";
import { api, CurrentUser } from "@/lib/api";

const navigation = [
  { href: "/app/dashboard", label: "Beranda" },
  { href: "/journal/create/text", label: "Tulis Jurnal" },
  { href: "/journal/checkpoints/voice", label: "Checkpoint Suara" },
  { href: "/journal/checkpoints/face", label: "Checkpoint Wajah" },
  { href: "/journal/checkpoints/movement", label: "Checkpoint Gerak" },
  { href: "/journal/milestones", label: "Milestone" },
  { href: "/professional/review", label: "Review Profesional" },
];

export function AppShell({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const pathname = usePathname();
  const { activePerson, people, activePersonId, selectPerson, loading } = useActivePerson();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    api<CurrentUser>("/auth/me").then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const roleLabel = useMemo(() => {
    if (!currentUser) return "Memuat peran";
    return currentUser.role === "admin"
      ? "Administrator"
      : currentUser.role === "professional"
        ? "Profesional"
        : "Pendamping keluarga";
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-[var(--line)] bg-[var(--surface-soft)]/55 px-5 py-6">
          <div className="rounded-[24px] border border-[var(--line)] bg-white px-4 py-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden="true">
                  <path d="M16 27c5-3.2 10-7.3 10-13a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 5.7 5 9.8 10 13Z" stroke="currentColor" strokeWidth="2.2" />
                  <path d="M12 18h8M16 14v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--brand-deep)]">Rangkul</p>
                <p className="text-sm text-[var(--muted)]">Jurnal perkembangan keluarga dan profesional</p>
              </div>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-white text-[var(--brand-deep)] shadow-[var(--shadow-soft)]"
                    : "text-[var(--muted)] hover:bg-white hover:text-[var(--brand-deep)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-[24px] border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold text-[var(--brand-deep)]">{currentUser?.full_name ?? "Memuat pengguna..."}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{roleLabel}</p>
            {loading ? (
              <div className="mt-4 rounded-2xl bg-[var(--surface-soft)] px-3 py-3 text-sm text-[var(--ink-soft)]">
                Menyiapkan profil aktif.
              </div>
            ) : people.length > 0 ? (
              <label className="mt-4 block text-sm font-semibold text-[var(--brand-deep)]">
                Profil aktif
                <select
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-3 text-sm font-medium text-[var(--ink)] outline-none"
                  value={activePersonId ?? ""}
                  onChange={(event) => selectPerson(event.target.value)}
                >
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.display_name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="mt-4 rounded-2xl bg-[var(--surface-soft)] px-3 py-3 text-sm text-[var(--ink-soft)]">
                Belum ada profil aktif. Selesaikan onboarding atau tambahkan profil dulu.
              </div>
            )}
            <div className="mt-4 rounded-2xl bg-[var(--surface-soft)] px-3 py-3 text-sm text-[var(--ink-soft)]">
              {activePerson
                ? `Riwayat jurnal dan checkpoint sedang dibuka untuk ${activePerson.display_name}.`
                : "Riwayat jurnal dan checkpoint akan mengikuti profil aktif setelah tersedia."}
            </div>
          </div>
        </aside>

        <main className="px-5 py-6 lg:px-8">
          <header className="flex flex-col gap-4 rounded-[28px] border border-[var(--line)] bg-white px-6 py-6 shadow-[var(--shadow-soft)] md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Development Journal</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--brand-deep)]">{title}</h1>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">{description}</p>
            </div>
            {action}
          </header>

          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
