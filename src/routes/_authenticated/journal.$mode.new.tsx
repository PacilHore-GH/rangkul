import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { CheckpointCapture } from "@/components/product/CheckpointCapture";
export const Route = createFileRoute("/_authenticated/journal/$mode/new")({
  component: NewJournal,
});
function NewJournal() {
  const { mode } = Route.useParams();
  if (mode === "voice" || mode === "face_behavior" || mode === "movement_video")
    return (
      <>
        <PageHeader
          title={
            mode === "voice"
              ? "Checkpoint suara"
              : mode === "face_behavior"
                ? "Facial Behavior Observation"
                : "Checkpoint video gerakan"
          }
          description="Ikuti instruksi singkat. Kualitas dan kegagalan perangkat akan dijelaskan."
        />
        <CheckpointCapture mode={mode} />
      </>
    );
  return (
    <>
      <PageHeader
        title={
          mode === "milestone"
            ? "Milestone baru"
            : mode === "photo"
              ? "Foto perkembangan"
              : "Catatan teks baru"
        }
        description="Simpan pengamatan faktual tanpa memberi label diagnosis."
      />
      <div className="rounded-2xl border border-border-default bg-surface p-5">
        <label className="text-sm font-medium">
          Judul
          <input
            className="mt-2 h-11 w-full rounded-lg border border-border-default px-3"
            required
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Catatan
          <textarea
            className="mt-2 min-h-40 w-full rounded-lg border border-border-default p-3"
            required
          />
        </label>
        <div className="mt-4 flex gap-3">
          <button className="h-11 rounded-lg bg-brand px-4 font-semibold text-white">
            Simpan jurnal
          </button>
          <Link to="/journal" className="h-11 rounded-lg border border-border-default px-4 py-2.5">
            Batal
          </Link>
        </div>
        <p className="mt-3 text-xs text-text-secondary">
          Validasi server dan RLS memastikan entri hanya tersimpan pada profil tertaut.
        </p>
      </div>
    </>
  );
}
