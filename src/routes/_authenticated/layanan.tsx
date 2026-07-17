import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { FACILITIES, PROVINCES, type Facility } from "@/lib/facilities";
import { matchAidForActiveProfile } from "@/lib/aid.functions";
import { MapPin, ExternalLink, ShieldCheck, Loader2 } from "lucide-react";
import type { AidMatch } from "@/lib/aid-rule-engine";

export const Route = createFileRoute("/_authenticated/layanan")({
  head: () => ({ meta: [{ title: "Layanan & bantuan · Rangkul" }, { name: "robots", content: "noindex" }] }),
  component: LayananPage,
});

const TABS = [
  { key: "fasilitas", label: "Fasilitas" },
  { key: "bantuan", label: "Bantuan pemerintah" },
] as const;

const CAT_LABEL: Record<Facility["category"], string> = {
  rumah_sakit: "Rumah sakit",
  klinik_terapi: "Klinik terapi",
  slb: "Sekolah Luar Biasa",
  puskesmas: "Puskesmas",
};

function LayananPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("fasilitas");

  return (
    <>
      <PageHeader
        title="Layanan & bantuan"
        description="Daftar fasilitas dan program bantuan yang relevan. Data dikurasi manual untuk demo — verifikasi ulang sebelum kunjungan atau pengajuan."
      />

      <div role="tablist" className="mb-6 inline-flex rounded-lg border border-border-default bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={
              "inline-flex h-9 items-center rounded-md px-4 text-sm font-medium " +
              (tab === t.key ? "bg-brand text-text-inverse" : "text-text-primary hover:bg-subtle")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "fasilitas" ? <FacilityList /> : <AidList />}
    </>
  );
}

function FacilityList() {
  const [province, setProvince] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const filtered = useMemo(
    () =>
      FACILITIES.filter(
        (f) => (province === "all" || f.province === province) && (category === "all" || f.category === category),
      ),
    [province, category],
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-secondary">Provinsi</span>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="h-9 rounded-md border border-border-default bg-surface px-2 text-sm"
          >
            <option value="all">Semua</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-secondary">Kategori</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-border-default bg-surface px-2 text-sm"
          >
            <option value="all">Semua</option>
            {Object.entries(CAT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-default bg-surface p-6 text-sm text-text-secondary">
          Belum ada layanan yang cocok dengan filter ini. Coba ubah kategori atau perluas area pencarian.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((f) => (
            <li key={f.id} className="rounded-xl border border-border-default bg-surface p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                {CAT_LABEL[f.category]}
              </div>
              <h3 className="mt-1 text-base font-semibold">{f.name}</h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                <MapPin size={12} /> {f.city}, {f.province}
              </div>
              <p className="mt-2 text-sm text-text-secondary">{f.address}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {f.services.map((s) => (
                  <span key={s} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] text-brand">
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-text-secondary">{f.verification_note}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function AidList() {
  const matchFn = useServerFn(matchAidForActiveProfile);
  const [dtks, setDtks] = useState<"unset" | "yes" | "no">("unset");
  const mut = useMutation({
    mutationFn: () =>
      matchFn({
        data: dtks === "unset" ? {} : { dtks_or_low_income: dtks === "yes" },
      }) as Promise<{ matches: AidMatch[] }>,
  });

  return (
    <div>
      <div className="rounded-2xl border border-border-default bg-surface p-5">
        <h3 className="text-base font-semibold">Kecocokan awal bantuan</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Perhitungan sederhana berdasarkan profil aktif. Keputusan akhir tetap berada pada instansi resmi.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-text-secondary">Status ekonomi (opsional):</span>
          {(
            [
              { key: "unset", label: "Tidak dijawab" },
              { key: "yes", label: "Terdaftar DTKS / kurang mampu" },
              { key: "no", label: "Tidak terdaftar" },
            ] as const
          ).map((o) => (
            <label key={o.key} className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="dtks"
                checked={dtks === o.key}
                onChange={() => setDtks(o.key)}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              {o.label}
            </label>
          ))}
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="ml-auto inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-text-inverse hover:bg-brand-hover disabled:opacity-60"
          >
            {mut.isPending && <Loader2 size={16} className="animate-spin" />}
            Cek kecocokan awal
          </button>
        </div>
      </div>

      {mut.data && (
        <ul className="mt-4 space-y-3">
          {mut.data.matches.map(({ program, status, missing_requirements }) => (
            <li key={program.id} className="rounded-xl border border-border-default bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    {program.provider}
                  </div>
                  <h3 className="mt-1 text-base font-semibold">{program.name}</h3>
                </div>
                <StatusPill status={status} />
              </div>
              <p className="mt-2 text-sm text-text-secondary">{program.summary}</p>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-text-link">Persyaratan umum</summary>
                <ul className="mt-2 list-disc pl-5 text-sm text-text-secondary">
                  {program.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </details>

              {missing_requirements.length > 0 && (
                <div className="mt-3 rounded-lg bg-accent-warm-soft p-3 text-xs">
                  <strong>Data yang perlu dilengkapi:</strong>
                  <ul className="mt-1 list-disc pl-4">
                    {missing_requirements.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              <a
                href={program.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-text-link hover:underline"
              >
                <ShieldCheck size={12} /> Sumber resmi: {program.official_source} <ExternalLink size={11} />
              </a>
            </li>
          ))}
        </ul>
      )}
      {!mut.data && !mut.isPending && (
        <p className="mt-6 text-sm text-text-secondary">
          Tekan tombol di atas untuk melihat kecocokan awal berdasarkan profil aktif. Hasil bersifat awal.
        </p>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: AidMatch["status"] }) {
  const map: Record<AidMatch["status"], { label: string; className: string }> = {
    cocok_awal: { label: "Cocok awal", className: "bg-brand-soft text-brand" },
    perlu_data_tambahan: { label: "Perlu data tambahan", className: "bg-accent-warm-soft text-warning" },
    belum_cocok: { label: "Belum cocok", className: "bg-subtle text-text-secondary" },
  };
  const m = map[status];
  return (
    <span className={"shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold " + m.className}>
      {m.label}
    </span>
  );
}
