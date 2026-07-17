"use client";

import { useEffect, useMemo, useState } from "react";

import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActivePerson } from "@/features/people/active-person-context";

type MilestoneItem = {
  id: string;
  title: string;
  category: string;
  target: string;
  checked: boolean;
  note: string;
};

const defaultMilestones: MilestoneItem[] = [
  {
    id: "communication-3-words",
    title: "Menyebut 3 kata baru",
    category: "Komunikasi",
    target: "3 kata mandiri minggu ini",
    checked: true,
    note: "Sudah muncul saat sesi bermain dan makan.",
  },
  {
    id: "daily-living-eat",
    title: "Makan mandiri",
    category: "Daily Living",
    target: "Sendok ke mulut tanpa bantuan penuh",
    checked: true,
    note: "Masih butuh pengingat saat awal.",
  },
  {
    id: "motor-follow-steps",
    title: "Mengikuti instruksi sederhana",
    category: "Motor Skills",
    target: "2 langkah berurutan",
    checked: false,
    note: "Baru konsisten untuk langkah pertama.",
  },
  {
    id: "social-turn-taking",
    title: "Bermain bergiliran",
    category: "Social Interaction",
    target: "Bergiliran 3 ronde",
    checked: false,
    note: "Perlu reminder verbal.",
  },
];

function loadMilestones(personId?: string) {
  if (!personId || typeof window === "undefined") return defaultMilestones;
  const raw = window.localStorage.getItem(`rangkul:milestones:${personId}`);
  if (!raw) return defaultMilestones;
  try {
    return JSON.parse(raw) as MilestoneItem[];
  } catch {
    return defaultMilestones;
  }
}

export function MilestoneBoard() {
  const { activePerson } = useActivePerson();

  return (
    <MilestoneBoardContent
      key={activePerson?.id ?? "no-person"}
      activePerson={activePerson}
    />
  );
}

function MilestoneBoardContent({
  activePerson,
}: {
  activePerson: ReturnType<typeof useActivePerson>["activePerson"];
}) {
  const [items, setItems] = useState<MilestoneItem[]>(() => loadMilestones(activePerson?.id));
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Komunikasi");

  useEffect(() => {
    if (!activePerson) return;
    window.localStorage.setItem(
      `rangkul:milestones:${activePerson.id}`,
      JSON.stringify(items),
    );
  }, [activePerson, items]);

  const groupedSummary = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const item of items) {
      const current = map.get(item.category) ?? { done: 0, total: 0 };
      current.total += 1;
      if (item.checked) current.done += 1;
      map.set(item.category, current);
    }
    return Array.from(map.entries());
  }, [items]);

  function toggleItem(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  function updateNote(id: string, note: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, note } : item)),
    );
  }

  function addMilestone() {
    if (!newTitle.trim()) return;
    setItems((current) => [
      {
        id: `${newCategory}-${Date.now()}`,
        title: newTitle.trim(),
        category: newCategory,
        target: "Checklist caregiver",
        checked: false,
        note: "",
      },
      ...current,
    ]);
    setNewTitle("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <SectionCard
        title="Checklist milestone"
        description="Caregiver sekarang bisa menandai aktivitas yang sudah dilakukan, bukan cuma membaca status statis."
      >
        <div className="space-y-4">
          <div className="grid gap-3 rounded-[24px] bg-[var(--surface-soft)] p-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Tambah target baru"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none"
            />
            <select
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none"
            >
              <option>Komunikasi</option>
              <option>Daily Living</option>
              <option>Motor Skills</option>
              <option>Social Interaction</option>
            </select>
            <button
              type="button"
              onClick={addMilestone}
              className="rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)]"
            >
              Tambah
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-[24px] border border-[var(--line)] bg-white p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleItem(item.id)}
                        className="mt-1 h-5 w-5 rounded accent-[var(--brand)]"
                      />
                      <span>
                        <span className="block text-lg font-semibold text-[var(--brand-deep)]">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm text-[var(--muted)]">
                          {item.category} · {item.target}
                        </span>
                      </span>
                    </label>
                  </div>
                  <StatusBadge tone={item.checked ? "success" : "neutral"}>
                    {item.checked ? "Tercapai" : "Belum diceklis"}
                  </StatusBadge>
                </div>

                <textarea
                  value={item.note}
                  onChange={(event) => updateNote(item.id, event.target.value)}
                  className="mt-4 min-h-24 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--ink-soft)] outline-none"
                  placeholder="Catatan caregiver: konteks, bantuan yang dibutuhkan, atau hal yang berhasil."
                />
              </article>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Ringkasan pencapaian"
        description="Ikhtisar ini mengikuti checklist per profil aktif, jadi progres tidak terasa seperti angka hardcoded."
      >
        <div className="space-y-4">
          {groupedSummary.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[var(--surface-soft)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--brand-deep)]">{label}</p>
                <p className="text-sm text-[var(--muted)]">
                  {value.done}/{value.total} tercapai
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[var(--brand)]"
                  style={{ width: `${value.total === 0 ? 0 : (value.done / value.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <div className="rounded-2xl bg-white px-4 py-4 text-sm leading-6 text-[var(--muted)]">
            {activePerson
              ? `Checklist ini disimpan lokal per profil aktif: ${activePerson.display_name}.`
              : "Pilih profil aktif agar checklist milestone menempel ke orang yang tepat."}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
