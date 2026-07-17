"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Facility,
  categoryLabels,
  compareFacilities,
} from "@/features/facilities/api";

function Comparison() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ids = [...new Set(idsParam.split(",").filter(Boolean))].slice(0, 4);
    if (ids.length < 2) {
      const timer = window.setTimeout(() => {
        setError("Pilih minimal dua fasilitas dari halaman pencarian.");
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      compareFacilities(ids, controller.signal)
        .then(setFacilities)
        .catch(() => setError("Perbandingan tidak dapat dimuat. Periksa koneksi lalu coba lagi."))
        .finally(() => setLoading(false));
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [idsParam]);

  if (loading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-surface motion-reduce:animate-none" aria-label="Memuat perbandingan" />;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-error/30 bg-surface p-8 text-center">
        <p className="text-error">{error}</p>
        <Link href="/app/services/search" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-primary px-4 font-semibold text-inverse-text">Pilih fasilitas</Link>
      </div>
    );
  }

  const rows = [
    { label: "Jenis", value: (item: Facility) => categoryLabels[item.category] },
    { label: "Lokasi", value: (item: Facility) => `${item.city}, ${item.province}` },
    { label: "Layanan", value: (item: Facility) => item.services.map((service) => service.name).join(", ") },
    { label: "Menerima BPJS", value: (item: Facility) => item.services.some((service) => service.accepts_bpjs) ? "Ya" : "Belum tercatat" },
    { label: "Pendaftaran online", value: (item: Facility) => item.services.some((service) => service.online_booking) ? "Ya" : "Belum tercatat" },
    { label: "Aksesibilitas", value: (item: Facility) => [...new Set(item.services.flatMap((service) => service.accessibility))].join(", ") || "Belum tercatat" },
    { label: "Kesegaran data", value: (item: Facility) => item.stale ? "Kedaluwarsa" : `Berlaku sampai ${item.valid_until}` },
    { label: "Sumber", value: (item: Facility) => item.source_name },
  ];

  return (
    <>
      <div className="grid gap-4 md:hidden">
        {facilities.map((facility) => (
          <article key={facility.id} className="rounded-2xl border border-default-border bg-surface p-5">
            <Link href={`/app/services/${facility.id}`} className="text-lg font-semibold text-link hover:underline">
              {facility.name}
            </Link>
            <dl className="mt-4 divide-y divide-default-border">
              {rows.map((row) => (
                <div key={row.label} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                  <dt className="text-sm font-medium text-secondary">{row.label}</dt>
                  <dd className={row.label === "Kesegaran data" && facility.stale ? "text-sm text-warning" : "text-sm text-primary"}>
                    {row.value(facility)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-default-border md:block">
        <table className="min-w-[760px] w-full border-collapse bg-surface text-left text-sm">
          <caption className="sr-only">Perbandingan fasilitas terpilih</caption>
          <thead>
            <tr className="border-b border-strong-border bg-subtle/60">
              <th scope="col" className="w-44 p-4 text-secondary">Kriteria</th>
              {facilities.map((facility) => (
                <th scope="col" key={facility.id} className="min-w-56 p-4 align-top">
                  <Link href={`/app/services/${facility.id}`} className="text-base text-link hover:underline">{facility.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-default-border last:border-0">
                <th scope="row" className="p-4 font-medium text-secondary">{row.label}</th>
                {facilities.map((facility) => (
                  <td key={facility.id} className={`p-4 align-top ${row.label === "Kesegaran data" && facility.stale ? "text-warning" : "text-primary"}`}>
                    {row.value(facility)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/app/services/search" className="inline-flex min-h-11 items-center text-sm text-link">← Kembali memilih</Link>
      <div className="mb-8 mt-4">
        <p className="text-sm font-semibold text-link">Perbandingan</p>
        <h1 className="mt-2 text-3xl font-bold">Bandingkan fasilitas</h1>
        <p className="mt-3 text-secondary">Periksa layanan, aksesibilitas, BPJS, sumber, dan kesegaran data berdampingan.</p>
      </div>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-surface motion-reduce:animate-none" />}>
        <Comparison />
      </Suspense>
    </main>
  );
}
