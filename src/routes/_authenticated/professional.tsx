import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/product/States";
import { ClipboardCheck, UserRoundCheck } from "lucide-react";
import { requireRouteRole } from "@/lib/route-auth";
export const Route = createFileRoute("/_authenticated/professional")({
  beforeLoad: () => requireRouteRole("professional"),
  component: Professional,
});
function Professional() {
  return (
    <>
      <PageHeader
        title="Ruang profesional"
        description="Hanya orang yang ditautkan keluarga dan data yang telah dibagikan yang dapat ditinjau."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border-default bg-surface p-5">
          <UserRoundCheck className="text-brand" />
          <h2 className="mt-3 font-semibold">Orang tertaut</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Akses profesional berasal dari person_access, bukan akses platform global.
          </p>
        </section>
        <section className="rounded-2xl border border-border-default bg-surface p-5">
          <ClipboardCheck className="text-brand" />
          <h2 className="mt-3 font-semibold">Rekomendasi & review</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Buat rekomendasi, akui hasil, atau minta pengambilan ulang. AI tidak mengubah roadmap.
          </p>
        </section>
      </div>
      <div className="mt-5">
        <EmptyState
          title="Tidak ada review menunggu"
          description="Checkpoint yang dibagikan keluarga akan muncul di sini dengan batasan kualitas."
        />
      </div>
    </>
  );
}
