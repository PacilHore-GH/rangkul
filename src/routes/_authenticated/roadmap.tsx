import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { generateRoadmap, getActiveRoadmap, toggleRoadmapItem } from "@/lib/roadmap.functions";
import { CheckCircle2, Circle, Loader2, Sparkle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap dukungan · Rangkul" }, { name: "robots", content: "noindex" }] }),
  component: RoadmapPage,
});

const TABS = [
  { key: "weekly", label: "Minggu ini" },
  { key: "monthly", label: "Bulan ini" },
  { key: "therapy", label: "Terapi awal" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function RoadmapPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getActiveRoadmap);
  const genFn = useServerFn(generateRoadmap);
  const toggleFn = useServerFn(toggleRoadmapItem);
  const [tab, setTab] = useState<Tab>("weekly");

  const { data, isLoading } = useQuery({ queryKey: ["active-roadmap"], queryFn: () => getFn() });

  const gen = useMutation({
    mutationFn: () => genFn(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["active-roadmap"] });
      toast.success("Roadmap tersusun", {
        description: "Panduan awal, bukan diagnosis. Diskusikan dengan tenaga profesional.",
      });
    },
    onError: (e) => toast.error("Tidak dapat menyusun roadmap", { description: e instanceof Error ? e.message : "" }),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; status: "open" | "done" }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-roadmap"] }),
  });

  const items = (data?.items ?? []).filter((i) => i.category === tab);

  return (
    <>
      <PageHeader
        title="Roadmap dukungan"
        description="Rencana ini disusun asisten berdasarkan profil aktif. Bersifat awal — sesuaikan dengan kondisi nyata dan diskusi profesional."
        action={
          <button
            onClick={() => gen.mutate()}
            disabled={gen.isPending}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-text-inverse hover:bg-brand-hover disabled:opacity-60"
          >
            {gen.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkle size={16} />}
            {data?.roadmap ? "Susun ulang dengan AI" : "Susun roadmap dengan AI"}
          </button>
        }
      />

      {isLoading ? (
        <div className="text-sm text-text-secondary">Memuat roadmap...</div>
      ) : !data?.roadmap ? (
        <div className="rounded-2xl border border-dashed border-border-default bg-surface p-8 text-center">
          <h2 className="text-lg font-semibold">Belum ada roadmap</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Belum ada target aktif. Buat satu langkah kecil yang realistis — asisten akan membantu menyusun
            langkah mingguan, target bulanan, dan rekomendasi terapi awal.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-accent-warm-soft bg-accent-warm-soft px-4 py-3 text-xs text-text-primary">
            <strong className="font-semibold">Panduan awal.</strong> Hasil dihasilkan oleh AI berdasarkan
            informasi yang tersedia. Bukan diagnosis atau resep. Diskusikan dengan tenaga profesional.
          </div>

          <div role="tablist" className="mb-4 inline-flex rounded-lg border border-border-default bg-surface p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={
                  "inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors " +
                  (tab === t.key ? "bg-brand text-text-inverse" : "text-text-primary hover:bg-subtle")
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-text-secondary">Belum ada item pada kategori ini.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-border-default bg-surface p-4"
                >
                  <button
                    onClick={() =>
                      toggle.mutate({ id: item.id, status: item.status === "done" ? "open" : "done" })
                    }
                    aria-label={item.status === "done" ? "Tandai belum selesai" : "Tandai selesai"}
                    className="mt-0.5 shrink-0 text-brand hover:opacity-80"
                  >
                    {item.status === "done" ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>
                  <div className="flex-1">
                    <h3
                      className={
                        "text-base font-semibold " +
                        (item.status === "done" ? "text-text-secondary line-through" : "text-text-primary")
                      }
                    >
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
