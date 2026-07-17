import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { Camera, FileText, Mic, PersonStanding, Image, Trophy } from "lucide-react";
const MODES = [
  { mode: "text", label: "Catatan teks", icon: FileText },
  { mode: "voice", label: "Checkpoint suara", icon: Mic },
  { mode: "face_behavior", label: "Facial Behavior Observation", icon: Camera },
  { mode: "movement_video", label: "Video gerakan", icon: PersonStanding },
  { mode: "photo", label: "Foto", icon: Image },
  { mode: "milestone", label: "Milestone", icon: Trophy },
] as const;
export const Route = createFileRoute("/_authenticated/journal")({ component: Journal });
function Journal() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  if (path !== "/journal") return <Outlet />;
  return (
    <>
      <PageHeader
        title="Jurnal perkembangan"
        description="Catatan harian dan checkpoint multimodal yang terhubung dengan profil aktif."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((item) => (
          <Link
            key={item.mode}
            to="/journal/$mode/new"
            params={{ mode: item.mode }}
            className="flex min-h-28 items-center gap-4 rounded-2xl border border-border-default bg-surface p-5 hover:border-brand"
          >
            <item.icon className="text-brand" />
            <div>
              <h2 className="font-semibold">{item.label}</h2>
              <p className="mt-1 text-xs text-text-secondary">Buat entri baru</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <Link
          to="/jurnal"
          className="h-11 rounded-lg border border-border-default px-4 py-2.5 text-sm font-medium"
        >
          Lihat entri tersimpan
        </Link>
        <Link
          to="/journal/trend"
          className="h-11 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          Tren temporal
        </Link>
      </div>
    </>
  );
}
