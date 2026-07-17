import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { Building2, Landmark, Users } from "lucide-react";
import { requireRouteRole } from "@/lib/route-auth";
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => requireRouteRole("admin"),
  component: Admin,
});
function Admin() {
  return (
    <>
      <PageHeader
        title="Administrasi platform"
        description="Kelola katalog dan metadata. Peran admin tidak otomatis membuka jurnal atau media privat."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [Users, "Pengguna", "Kelola status dan peran platform."],
          [Building2, "Fasilitas", "Kurasi katalog layanan demo."],
          [Landmark, "Program bantuan", "Versikan aturan dan sumber resmi."],
        ].map(([Icon, title, body]) => (
          <button
            key={String(title)}
            className="min-h-40 rounded-2xl border border-border-default bg-surface p-5 text-left hover:border-brand"
          >
            <Icon className="text-brand" />
            <h2 className="mt-3 font-semibold">{title as string}</h2>
            <p className="mt-1 text-sm text-text-secondary">{body as string}</p>
          </button>
        ))}
      </div>
      <p className="mt-5 rounded-xl bg-subtle p-4 text-sm">
        Operasi mutasi admin wajib melalui fungsi server tervalidasi dan kebijakan{" "}
        <code>has_role('admin')</code>.
      </p>
    </>
  );
}
