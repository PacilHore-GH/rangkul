"use client";

import { useMemo, useState } from "react";

import { SectionCard } from "@/components/ui/section-card";
import { useActivePerson } from "@/features/people/active-person-context";

const reflectionPrompts = [
  {
    title: "Apa kemajuan hari ini?",
    helper: "Tulis observasi yang terlihat, misalnya respon, durasi fokus, atau kemandirian.",
  },
  {
    title: "Apa tantangan yang muncul?",
    helper: "Catat momen yang sulit, apa pemicunya, dan kapan biasanya terjadi.",
  },
  {
    title: "Apa yang membantu?",
    helper: "Simpan strategi yang terasa efektif supaya mudah diulang oleh caregiver lain.",
  },
];

const quickTags = ["Komunikasi", "Motorik Kasar", "Motorik Halus", "Daily Living", "Sensori", "Sosial"];

export function JournalTextEditor() {
  const { activePerson } = useActivePerson();
  const [title, setTitle] = useState("Sesi terapi wicara berjalan baik");
  const [body, setBody] = useState(
    "Hari ini fokus pada pelafalan /b/ dan /m/. Anak mampu meniru dengan bantuan minimal dan mulai mengucapkan suku kata secara mandiri. Respon positif saat diberi pujian dan stiker.",
  );
  const [visibility, setVisibility] = useState("team_and_family");
  const [program, setProgram] = useState("Program Wicara - Pelafalan Konsonan");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Komunikasi", "Sensori"]);
  const [savedNotice, setSavedNotice] = useState("");

  const wordCount = useMemo(() => body.trim().split(/\s+/).filter(Boolean).length, [body]);

  function toggleTag(tag: string) {
    setSelectedTags((current) => (
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    ));
  }

  function applyPrompt(titleText: string) {
    setBody((current) => `${current.trim()}\n\n${titleText}\n- `);
  }

  function saveDraft() {
    setSavedNotice(
      `Draft lokal untuk ${activePerson?.display_name ?? "profil aktif"} diperbarui pada ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}.`,
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <SectionCard title="Catatan hari ini" description="Editor ini sudah bisa dipakai untuk menulis catatan yang lebih nyata, bukan hanya mock card statis.">
        <div className="space-y-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
            placeholder="Judul jurnal"
          />

          <div className="rounded-[24px] border border-[var(--line)] bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {["Normal", "B", "I", "Daftar"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--muted)]"
                >
                  {item}
                </button>
              ))}
            </div>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-72 w-full rounded-2xl border border-transparent bg-[var(--surface-soft)] px-4 py-4 text-sm leading-7 text-[var(--ink-soft)] outline-none"
              placeholder="Tuliskan observasi hari ini..."
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--brand-deep)]">
              Terkait program
              <select
                className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
                value={program}
                onChange={(event) => setProgram(event.target.value)}
              >
                <option>Program Wicara - Pelafalan Konsonan</option>
                <option>Program Sensori - Regulasi dan Fokus</option>
                <option>Program ADL - Makan Mandiri</option>
              </select>
            </label>

            <label className="text-sm font-semibold text-[var(--brand-deep)]">
              Visibilitas
              <select
                className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
              >
                <option value="team_and_family">Hanya tim dan orang tua</option>
                <option value="family_only">Keluarga saja</option>
                <option value="professional_review">Siap untuk review profesional</option>
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--brand-deep)]">Tag cepat</p>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selected ? "bg-[var(--brand)] text-white" : "bg-[var(--surface-soft)] text-[var(--muted)]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--muted)]">
            <div>
              {activePerson ? `Jurnal ini sedang ditautkan ke ${activePerson.display_name}.` : "Menunggu profil aktif dipilih."}
            </div>
            <div>{wordCount} kata</div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)]"
            >
              Simpan draft
            </button>
            <button
              type="button"
              onClick={() => setBody("")}
              className="inline-flex rounded-2xl border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--brand-deep)]"
            >
              Kosongkan isi
            </button>
          </div>

          {savedNotice ? <p className="rounded-2xl bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--success)]">{savedNotice}</p> : null}
        </div>
      </SectionCard>

      <SectionCard title="Panduan refleksi" description="Prompt singkat ini bisa langsung disisipkan ke catatan supaya caregiver tidak mulai dari layar kosong.">
        <div className="space-y-3">
          {reflectionPrompts.map((item) => (
            <div key={item.title} className="rounded-2xl bg-[var(--surface-soft)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--brand-deep)]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.helper}</p>
              <button
                type="button"
                onClick={() => applyPrompt(item.title)}
                className="mt-3 inline-flex rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--brand-deep)]"
              >
                Sisipkan prompt
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
