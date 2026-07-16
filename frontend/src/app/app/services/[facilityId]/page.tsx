"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Facility,
  categoryLabels,
  getFacility,
  getSavedFacilityIds,
  osmEmbedUrl,
  toggleSavedFacility,
} from "@/features/facilities/api";

const accessibilityLabels: Record<string, string> = {
  wheelchair_access: "Akses kursi roda",
  accessible_toilet: "Toilet aksesibel",
  sign_language: "Bahasa isyarat",
  sensory_friendly: "Ramah sensorik",
};

export default function FacilityDetailPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSaved(getSavedFacilityIds().includes(facilityId));
      getFacility(facilityId, controller.signal)
        .then(setFacility)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [facilityId]);

  if (loading) {
    return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6" aria-busy="true"><div className="h-64 animate-pulse rounded-2xl bg-slate-900" /></main>;
  }

  if (error || !facility) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Fasilitas tidak dapat ditampilkan</h1>
        <p className="mt-2 text-slate-400">Periksa koneksi atau kembali ke hasil pencarian.</p>
        <Link href="/app/services/search" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 font-semibold">Kembali mencari</Link>
      </main>
    );
  }

  function toggleSaved() {
    setSaved(toggleSavedFacility(facilityId).includes(facilityId));
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/app/services/search" className="inline-flex min-h-11 items-center text-sm text-indigo-300 hover:text-indigo-200">← Kembali ke pencarian</Link>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-indigo-300">{categoryLabels[facility.category]}</p>
            <h1 className="mt-2 text-3xl font-bold">{facility.name}</h1>
            <p className="mt-3 text-slate-400">{facility.address}</p>
          </div>
          <button onClick={toggleSaved} className="min-h-11 rounded-lg border border-slate-700 px-4 font-semibold hover:bg-slate-800">
            {saved ? "Hapus simpanan" : "Simpan fasilitas"}
          </button>
        </div>

        {facility.stale && <div role="alert" className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100">Informasi ini melewati masa berlaku. Konfirmasi langsung sebelum membuat keputusan.</div>}
        <p className="mt-6 leading-7 text-slate-300">{facility.description}</p>

        <dl className="mt-8 grid gap-4 rounded-xl bg-slate-950 p-5 sm:grid-cols-2">
          <div><dt className="text-xs uppercase text-slate-500">Telepon</dt><dd className="mt-1">{facility.phone || "Belum tersedia"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Status verifikasi</dt><dd className="mt-1">{facility.verification_status === "verified" ? "Terverifikasi" : "Belum terverifikasi"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Sumber</dt><dd className="mt-1">{facility.source_name}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Berlaku sampai</dt><dd className="mt-1">{facility.valid_until}</dd></div>
        </dl>
      </div>

      <section aria-labelledby="services-title" className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <h2 id="services-title" className="text-2xl font-bold">Layanan tersedia</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {facility.services.map((service) => (
            <article key={service.code} className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold">{service.name}</h3>
              <ul className="mt-3 space-y-1 text-sm text-slate-400">
                <li>Usia: {service.age_min}–{service.age_max ?? "dewasa"} tahun</li>
                <li>BPJS: {service.accepts_bpjs ? "Ya" : "Belum tercatat"}</li>
                <li>Pendaftaran online: {service.online_booking ? "Ya" : "Belum tercatat"}</li>
                {service.accessibility.map((item) => <li key={item}>Akses: {accessibilityLabels[item] || item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="location-title" className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="p-6">
          <h2 id="location-title" className="text-2xl font-bold">Lokasi</h2>
          <p className="mt-2 text-sm text-slate-400">Jika peta tidak tersedia, gunakan alamat tertulis di atas.</p>
        </div>
        <iframe title={`Peta ${facility.name}`} src={osmEmbedUrl(facility)} className="h-80 w-full border-0" loading="lazy" />
      </section>
    </main>
  );
}
