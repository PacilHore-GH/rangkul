import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { createJournalEntry, listJournalEntries } from "@/lib/journal.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/jurnal")({
  head: () => ({ meta: [{ title: "Jurnal perkembangan · Rangkul" }, { name: "robots", content: "noindex" }] }),
  component: JurnalPage,
});

const MOODS = ["Tenang", "Bersemangat", "Lelah", "Kesulitan", "Bangga"];

function JurnalPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listJournalEntries);
  const createFn = useServerFn(createJournalEntry);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(MOODS[0]);

  const { data: entries, isLoading } = useQuery({ queryKey: ["journal-entries"], queryFn: () => listFn() });

  const mut = useMutation({
    mutationFn: () => createFn({ data: { content: content.trim(), mood_tag: mood } }),
    onSuccess: () => {
      setContent("");
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Catatan tersimpan");
    },
    onError: (e) => toast.error("Tidak dapat menyimpan", { description: e instanceof Error ? e.message : "" }),
  });

  return (
    <>
      <PageHeader
        title="Jurnal perkembangan"
        description="Catat hal kecil yang terjadi hari ini. Hanya Anda yang dapat melihatnya."
      />

      <div className="rounded-2xl border border-border-default bg-surface p-5">
        <label htmlFor="j" className="block text-sm font-medium">
          Apa yang terjadi hari ini?
        </label>
        <textarea
          id="j"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Contoh: Alya berhasil menyebut nama warna favoritnya untuk pertama kali."
          className="mt-1 w-full rounded-lg border border-border-default bg-surface p-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary">Suasana hari ini:</span>
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              aria-pressed={mood === m}
              className={
                "inline-flex h-8 items-center rounded-full px-3 text-xs font-medium " +
                (mood === m
                  ? "bg-brand text-text-inverse"
                  : "border border-border-default bg-surface hover:bg-subtle")
              }
            >
              {m}
            </button>
          ))}
          <button
            onClick={() => mut.mutate()}
            disabled={!content.trim() || mut.isPending}
            className="ml-auto inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-text-inverse hover:bg-brand-hover disabled:opacity-60"
          >
            {mut.isPending && <Loader2 size={16} className="animate-spin" />}
            Simpan catatan
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Memuat catatan...</p>
        ) : (entries?.length ?? 0) === 0 ? (
          <p className="rounded-lg border border-dashed border-border-default bg-surface p-6 text-sm text-text-secondary">
            Belum ada catatan perkembangan. Mulai dari hal kecil yang terjadi hari ini.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries!.map((e) => (
              <li key={e.id} className="rounded-xl border border-border-default bg-surface p-4">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>{e.entry_date}</span>
                  {e.mood_tag && (
                    <span className="rounded-full bg-accent-warm-soft px-2 py-0.5 font-medium text-text-primary">
                      {e.mood_tag}
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{e.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
