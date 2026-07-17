import { ActivePersonProvider } from "@/features/people/active-person-context";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { SkeletonViewer } from "@/features/journal/components/skeleton-viewer";
import { TrendChart } from "@/features/journal/components/trend-chart";
import { reviewQueue } from "@/features/journal/lib/journal-demo-data";

export default function ProfessionalReviewPage() {
  return (
    <ActivePersonProvider>
      <AppShell
        title="Workspace Review Profesional"
        description="Antrian review, hasil terstruktur, pembandingan referensi, dan keputusan profesional ditempatkan dalam satu workspace desktop yang rapi."
        action={<button className="rounded-2xl border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--brand-deep)]">Export Audit</button>}
      >
        <div className="grid gap-6 xl:grid-cols-[320px_1fr_360px]">
          <SectionCard title="Antrian review" description="Daftar checkpoint yang menunggu tindakan profesional.">
            <div className="space-y-3">
              {reviewQueue.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[var(--surface-soft)] px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--brand-deep)]">{item.person}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{item.checkpoint}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>{item.status}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="Hasil checkpoint" description="Area tengah menampilkan metrik observabel, timeline event, visualisasi skeleton, dan draft ringkasan AI.">
              <div className="grid gap-6 lg:grid-cols-2">
                <SkeletonViewer />
                <TrendChart />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  ["Kualitas capture", "0.82"],
                  ["Reference similarity", "0.74"],
                  ["Trend draft", "stable_observation"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[var(--surface-soft)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--brand-deep)]">{value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Keputusan profesional" description="Observasi dapat diperbaiki sebelum hasil disetujui, ditolak, atau diminta recapture.">
            <div className="space-y-4">
              <div className="rounded-2xl bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
                Ringkasan AI tetap berupa draft dan harus diperiksa terhadap target rekomendasi, kualitas data, serta konteks sesi.
              </div>
              <div className="min-h-48 rounded-[24px] border border-[var(--line)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                Tulis koreksi observasi profesional di sini.
              </div>
              <div className="grid gap-3">
                <button className="rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)]">Approve</button>
                <button className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm font-semibold text-[var(--accent)]">Request Recapture</button>
                <button className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--brand-deep)]">Reject</button>
              </div>
            </div>
          </SectionCard>
        </div>
      </AppShell>
    </ActivePersonProvider>
  );
}
