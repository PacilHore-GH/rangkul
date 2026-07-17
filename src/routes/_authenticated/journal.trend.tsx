import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { PrivacyNotice } from "@/components/product/States";
export const Route = createFileRoute("/_authenticated/journal/trend")({ component: Trend });
function Trend() {
  return (
    <>
      <PageHeader
        title="Tren temporal"
        description="Perubahan diamati selama periode rekomendasi."
      />
      <PrivacyNotice />
      <div className="mt-5 rounded-2xl border border-border-default bg-surface p-5">
        <h2 className="font-semibold">Belum cukup data untuk tren otomatis</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Minimal 5 checkpoint valid pada 3 tanggal, dengan kualitas rata-rata ≥ 0,60. Baseline,
          nilai terbaru, rolling average, adherence, missingness, dan jarak-ke-referensi ditampilkan
          per tugas—tanpa satu skor kesehatan.
        </p>
        <div
          className="mt-5 grid h-44 grid-cols-5 items-end gap-3"
          aria-label="Contoh visual checkpoint yang belum cukup"
        >
          {[30, 48, 42, 64, 58].map((v, i) => (
            <div key={i} className="rounded-t bg-brand-soft" style={{ height: `${v}%` }}>
              <span className="sr-only">Nilai {v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
