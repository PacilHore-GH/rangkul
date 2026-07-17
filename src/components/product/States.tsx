import { AlertCircle, Inbox, Loader2 } from "lucide-react";

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-border-default bg-surface text-sm text-text-secondary">
      <Loader2 className="animate-spin" size={18} />
      {label}
    </div>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-default bg-surface p-8 text-center">
      <Inbox className="mx-auto text-text-secondary" />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </div>
  );
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900"
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle size={18} />
        Data tidak dapat dimuat
      </div>
      <p className="mt-1">
        {error instanceof Error ? error.message : "Terjadi kendala. Coba lagi."}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="mt-3 h-11 rounded-lg border border-red-300 px-4 font-medium"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}
export function PrivacyNotice() {
  return (
    <aside className="rounded-xl border border-brand-soft bg-brand-soft/40 p-4 text-sm">
      <strong>Privasi pertama.</strong> Media mentah diproses sementara dan dihapus setelah analisis
      kecuali penyimpanan disetujui. Metrik bukan diagnosis atau skor kesehatan.
    </aside>
  );
}
