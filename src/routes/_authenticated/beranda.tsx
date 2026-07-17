import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { getActivePersonProfile, listPersonProfiles } from "@/lib/person-profile.functions";
import { getActiveRoadmap } from "@/lib/roadmap.functions";
import { listJournalEntries } from "@/lib/journal.functions";
import { getPlatformOverview } from "@/lib/platform.functions";
import { Compass, MessageCircleHeart, MapPin, BookHeart, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/beranda")({
  head: () => ({ meta: [{ title: "Beranda · Rangkul" }, { name: "robots", content: "noindex" }] }),
  component: Beranda,
});

function Beranda() {
  const navigate = useNavigate();
  const listFn = useServerFn(listPersonProfiles);
  const activeFn = useServerFn(getActivePersonProfile);
  const roadmapFn = useServerFn(getActiveRoadmap);
  const journalFn = useServerFn(listJournalEntries);
  const overviewFn = useServerFn(getPlatformOverview);

  const { data: profiles, isLoading: pl } = useQuery({
    queryKey: ["person-profiles"],
    queryFn: () => listFn(),
  });
  const { data: active } = useQuery({
    queryKey: ["active-person-profile"],
    queryFn: () => activeFn(),
  });
  const { data: roadmap } = useQuery({ queryKey: ["active-roadmap"], queryFn: () => roadmapFn() });
  const { data: journal } = useQuery({ queryKey: ["journal-entries"], queryFn: () => journalFn() });
  const { data: overview } = useQuery({
    queryKey: ["platform-overview"],
    queryFn: () => overviewFn(),
    retry: false,
  });

  useEffect(() => {
    if (!pl && profiles && profiles.length === 0) navigate({ to: "/onboarding", replace: true });
  }, [pl, profiles, navigate]);

  if (!active) {
    return <div className="text-sm text-text-secondary">Memuat profil...</div>;
  }

  const openItems = roadmap?.items?.filter((i) => i.status === "open") ?? [];
  const nextItem = openItems[0];
  const recentJournal = journal?.[0];

  return (
    <>
      <PageHeader
        title={`Halo, keluarga ${active.display_name}`}
        description="Ini rangkuman singkat perjalanan Anda hari ini."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border-default bg-surface p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Langkah berikutnya
          </div>
          {nextItem ? (
            <>
              <h2 className="mt-2 text-lg font-semibold">{nextItem.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{nextItem.description}</p>
              <Link
                to="/roadmap"
                className="mt-4 inline-flex h-11 items-center gap-1 rounded-lg bg-brand px-4 text-sm font-semibold text-text-inverse hover:bg-brand-hover"
              >
                Buka roadmap <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-lg font-semibold">Belum ada langkah aktif</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Buat rencana dukungan awal berbasis profil {active.display_name}.
              </p>
              <Link
                to="/roadmap"
                className="mt-4 inline-flex h-11 items-center gap-1 rounded-lg bg-brand px-4 text-sm font-semibold text-text-inverse hover:bg-brand-hover"
              >
                Susun roadmap <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border-default bg-surface p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Aktivitas jurnal terbaru
          </div>
          {recentJournal ? (
            <>
              <h2 className="mt-2 text-lg font-semibold">{recentJournal.entry_date}</h2>
              <p className="mt-1 line-clamp-3 text-sm text-text-secondary">
                {recentJournal.content}
              </p>
              {recentJournal.mood_tag && (
                <span className="mt-3 inline-flex h-7 items-center rounded-full bg-accent-warm-soft px-3 text-xs font-medium text-text-primary">
                  {recentJournal.mood_tag}
                </span>
              )}
            </>
          ) : (
            <>
              <h2 className="mt-2 text-lg font-semibold">Belum ada catatan</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Belum ada catatan perkembangan. Mulai dari hal kecil yang terjadi hari ini.
              </p>
              <Link
                to="/jurnal"
                className="mt-4 inline-flex h-11 items-center gap-1 rounded-lg border border-border-default bg-surface px-4 text-sm font-medium hover:bg-subtle"
              >
                Tulis catatan
              </Link>
            </>
          )}
        </div>
      </section>

      <section
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Ringkasan data terhubung"
      >
        {[
          [
            "Tugas hari ini",
            overview?.tasks?.length ?? openItems.length,
            overview?.tasks?.[0]?.title ?? nextItem?.title ?? "Belum ada tugas",
          ],
          [
            "Janji berikutnya",
            overview?.appointments?.length ?? 0,
            overview?.appointments?.[0]?.title ?? "Belum dijadwalkan",
          ],
          [
            "Checkpoint terbaru",
            overview?.analyses?.length ?? 0,
            overview?.analyses?.[0]?.task_code ?? "Belum ada checkpoint",
          ],
          [
            "Pengajuan bantuan",
            overview?.applications?.length ?? 0,
            overview?.applications?.[0]?.next_step ?? "Belum ada pengajuan",
          ],
        ].map(([label, value, detail]) => (
          <article
            key={String(label)}
            className="rounded-xl border border-border-default bg-surface p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-brand">{value}</p>
            <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{detail}</p>
          </article>
        ))}
      </section>

      {overview?.recommendations?.[0] && (
        <section className="mt-4 rounded-xl border border-brand-soft bg-brand-soft/50 p-4">
          <p className="text-xs font-medium uppercase text-brand">Rekomendasi profesional</p>
          <h2 className="mt-1 font-semibold">{overview.recommendations[0].title}</h2>
          <p className="mt-1 text-sm text-text-secondary">{overview.recommendations[0].guidance}</p>
        </section>
      )}

      <section className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          { to: "/roadmap", label: "Roadmap", icon: Compass, tone: "brand" },
          { to: "/asisten", label: "Tanya asisten", icon: MessageCircleHeart, tone: "brand" },
          { to: "/layanan", label: "Cari layanan", icon: MapPin, tone: "utility" },
          { to: "/jurnal", label: "Jurnal", icon: BookHeart, tone: "utility" },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-xl border border-border-default bg-surface p-4 text-sm font-medium hover:bg-subtle"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Icon size={18} />
            </div>
            {label}
          </Link>
        ))}
      </section>

      <p className="mt-8 text-xs text-text-secondary">
        Rangkul memberikan panduan umum, bukan diagnosis. Diskusikan keputusan penting dengan tenaga
        profesional.
      </p>
    </>
  );
}
