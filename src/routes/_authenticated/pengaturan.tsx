import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { listPersonProfiles, setActivePersonProfile } from "@/lib/person-profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { FUTURE_ROLES_NOTE } from "@/lib/future-roles";
import { CheckCircle2, LogOut, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan · Rangkul" }, { name: "robots", content: "noindex" }] }),
  component: PengaturanPage,
});

function PengaturanPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listPersonProfiles);
  const setActiveFn = useServerFn(setActivePersonProfile);

  const { data: profiles } = useQuery({ queryKey: ["person-profiles"], queryFn: () => listFn() });

  async function setActive(id: string) {
    await setActiveFn({ data: { id } });
    await qc.invalidateQueries();
    toast.success("Profil aktif diperbarui");
  }

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <>
      <PageHeader title="Pengaturan" description="Kelola profil anggota keluarga dan sesi masuk Anda." />

      <section className="rounded-2xl border border-border-default bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Profil anggota keluarga</h2>
          <button
            onClick={() => navigate({ to: "/onboarding" })}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-border-default bg-surface px-3 text-sm font-medium hover:bg-subtle"
          >
            <UserPlus size={14} /> Tambah profil
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {(profiles ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border-default bg-surface p-3"
            >
              <div>
                <div className="font-medium">{p.display_name}</div>
                <div className="text-xs text-text-secondary">
                  {p.age != null ? `${p.age} tahun · ` : ""}
                  {(p.support_needs ?? []).join(", ") || "Belum ada kebutuhan tercatat"}
                </div>
              </div>
              {p.active ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                  <CheckCircle2 size={12} /> Aktif
                </span>
              ) : (
                <button
                  onClick={() => setActive(p.id)}
                  className="inline-flex h-9 items-center rounded-md border border-border-default bg-surface px-3 text-xs font-medium hover:bg-subtle"
                >
                  Jadikan aktif
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border-default bg-surface p-5">
        <h2 className="text-base font-semibold">Arsitektur peran (masa depan)</h2>
        <p className="mt-2 text-sm text-text-secondary">
          MVP saat ini hanya membangun peran <strong>Family Member / Caregiver</strong>. Peran lain
          direncanakan dengan skema <code className="rounded bg-subtle px-1">user_roles</code> terpisah
          dan sistem <code className="rounded bg-subtle px-1">profile_access_grants</code> untuk berbagi
          data dengan tenaga profesional secara aman dan dapat dicabut.
        </p>
        <p className="mt-2 text-xs text-text-secondary">{FUTURE_ROLES_NOTE}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-border-default bg-surface p-5">
        <h2 className="text-base font-semibold">Sesi</h2>
        <button
          onClick={handleSignOut}
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg border border-border-default bg-surface px-4 text-sm font-medium hover:bg-subtle"
        >
          <LogOut size={16} /> Keluar dari Rangkul
        </button>
      </section>
    </>
  );
}
