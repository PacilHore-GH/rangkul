import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { listPersonProfiles } from "@/lib/person-profile.functions";
import { EmptyState, ErrorState, LoadingState } from "@/components/product/States";
import { ArrowRight, Plus } from "lucide-react";
export const Route = createFileRoute("/_authenticated/people")({ component: People });
function People() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const fn = useServerFn(listPersonProfiles);
  const query = useQuery({ queryKey: ["person-profiles"], queryFn: () => fn() });
  if (path !== "/people") return <Outlet />;
  return (
    <>
      <PageHeader
        title="Profil yang didampingi"
        description="Individu yang didukung direpresentasikan sebagai profil, bukan akun atau diagnosis."
        action={
          <Link
            to="/onboarding"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-4 font-semibold text-white"
          >
            <Plus size={18} />
            Tambah profil
          </Link>
        }
      />
      {query.isLoading ? (
        <LoadingState />
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState
          title="Belum ada profil"
          description="Buat profil pertama untuk memulai roadmap dan jurnal."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {query.data.map((person) => (
            <Link
              key={person.id}
              to="/people/$personId"
              params={{ personId: person.id }}
              className="rounded-2xl border border-border-default bg-surface p-5 transition hover:border-brand"
            >
              <div className="text-xs text-text-secondary">
                {person.active ? "Profil aktif" : "Profil tertaut"}
              </div>
              <h2 className="mt-1 text-lg font-semibold">{person.display_name}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
                {person.support_summary || "Kebutuhan dukungan belum dirangkum."}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
                Lihat profil <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
