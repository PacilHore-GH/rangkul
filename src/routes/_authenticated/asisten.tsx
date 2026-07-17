import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { chatWithAssistant, listChatMessages } from "@/lib/chat.functions";
import { RangkulMark } from "@/components/brand/Logo";
import { Send, Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/asisten")({
  head: () => ({ meta: [{ title: "Asisten AI · Rangkul" }, { name: "robots", content: "noindex" }] }),
  component: AsistenPage,
});

const SUGGESTIONS = [
  "Apa itu terapi wicara dan kapan mempertimbangkannya?",
  "Bagaimana proses mengurus Kartu Penyandang Disabilitas?",
  "Apa itu SDIDTK dan bagaimana melakukannya?",
];

type Source = { id: string; title: string; source: string; source_url: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  created_at: string;
};

function AsistenPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listChatMessages);
  const sendFn = useServerFn(chatWithAssistant);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => (await listFn()) as unknown as Msg[],
  });

  const send = useMutation({
    mutationFn: (t: string) => sendFn({ data: { text: t } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-messages"] }),
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ["chat-messages"] });
      toast.error("Asisten tidak dapat merespons", { description: e instanceof Error ? e.message : "" });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, send.isPending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit(v: string) {
    const t = v.trim();
    if (!t || send.isPending) return;
    setText("");
    send.mutate(t);
    // Optimistic: refresh will pull it back; input focus stays
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <>
      <PageHeader
        title="Asisten Rangkul"
        description="Panduan umum tentang dukungan keluarga. Jawaban selalu menyebutkan sumber."
      />

      <div className="rounded-lg border border-accent-warm-soft bg-accent-warm-soft px-4 py-3 text-xs">
        <strong className="font-semibold">Batas asisten:</strong> Rangkul bukan dokter atau terapis. Tidak
        memberikan diagnosis atau resep. Untuk keputusan penting, konsultasikan dengan tenaga profesional.
      </div>

      <div className="mt-4 flex min-h-[60vh] flex-col rounded-2xl border border-border-default bg-surface">
        <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="text-sm text-text-secondary">Memuat percakapan...</div>
          ) : (messages?.length ?? 0) === 0 ? (
            <EmptyState onPick={submit} />
          ) : (
            <>
              {messages!.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
              {send.isPending && (
                <div className="flex items-start gap-3">
                  <RangkulMark size={24} className="mt-1 shrink-0 text-brand" />
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Loader2 size={14} className="animate-spin" />
                    Asisten sedang menyusun jawaban...
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
          className="border-t border-border-default p-3 md:p-4"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(text);
                }
              }}
              placeholder="Tanyakan sesuatu tentang dukungan keluarga..."
              rows={2}
              maxLength={1000}
              required
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-border-default bg-surface p-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
              aria-label="Pesan untuk asisten"
            />
            <button
              type="submit"
              disabled={!text.trim() || send.isPending}
              aria-label="Kirim pesan"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand text-text-inverse hover:bg-brand-hover disabled:opacity-50"
            >
              {send.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-text-secondary">
            Tekan Enter untuk kirim, Shift+Enter untuk baris baru.
          </p>
        </form>
      </div>
    </>
  );
}

function EmptyState({ onPick }: { onPick: (v: string) => void }) {
  return (
    <div className="mx-auto max-w-lg py-8 text-center">
      <RangkulMark size={40} className="mx-auto text-brand" />
      <h2 className="mt-4 text-lg font-semibold">Mulai percakapan</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Beberapa contoh pertanyaan yang bisa Anda coba:
      </p>
      <div className="mt-4 space-y-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="w-full rounded-lg border border-border-default bg-surface px-4 py-3 text-left text-sm hover:bg-subtle"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand px-4 py-2 text-sm text-text-inverse">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <RangkulMark size={24} className="mt-1 shrink-0 text-brand" />
      <div className="max-w-[85%] flex-1">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{msg.content}</div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-3 space-y-1 rounded-lg border border-border-default bg-subtle p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Sumber</div>
            <ul className="space-y-1">
              {msg.sources.map((s, i) => (
                <li key={s.id} className="text-xs">
                  <span className="text-text-secondary">[{i + 1}]</span>{" "}
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-text-link hover:underline"
                  >
                    {s.title} — {s.source}
                    <ExternalLink size={11} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
