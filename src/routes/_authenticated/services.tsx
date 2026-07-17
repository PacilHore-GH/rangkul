/* eslint-disable @typescript-eslint/no-explicit-any -- catalog rows are typed after applying the additive Supabase migration */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, MapPin, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { listCatalogs } from "@/lib/platform.functions";
import { EmptyState, ErrorState, LoadingState } from "@/components/product/States";
export const Route = createFileRoute("/_authenticated/services")({ component: Services });
function Services() {
  const fn = useServerFn(listCatalogs);
  const query = useQuery({ queryKey: ["catalogs"], queryFn: () => fn() });
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [bpjs, setBpjs] = useState(false);
  const facilities = useMemo(() => query.data?.facilities ?? [], [query.data?.facilities]);
  const cities: string[] = [...new Set<string>(facilities.map((f: any) => String(f.city)))];
  const filtered = useMemo(
    () =>
      facilities.filter(
        (f: any) =>
          (city === "all" || f.city === city) &&
          (!bpjs || f.accepts_bpjs) &&
          `${f.name} ${f.services?.join(" ")}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [facilities, search, city, bpjs],
  );
  return (
    <>
      <PageHeader
        title="Navigator rumah sakit & terapi"
        description="Cari fasilitas demo berdasarkan kota, layanan, BPJS, dan aksesibilitas. Selalu verifikasi sebelum berkunjung."
      />
      <div className="grid gap-3 rounded-2xl border border-border-default bg-surface p-4 sm:grid-cols-3">
        <label className="relative">
          <span className="sr-only">Cari</span>
          <Search className="absolute left-3 top-3 text-text-secondary" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari layanan"
            className="h-11 w-full rounded-lg border border-border-default pl-10 pr-3"
          />
        </label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-11 rounded-lg border border-border-default px-3"
        >
          <option value="all">Semua kota</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={bpjs} onChange={(e) => setBpjs(e.target.checked)} />{" "}
          Menerima BPJS
        </label>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        {query.isLoading ? (
          <LoadingState />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => query.refetch()} />
        ) : !filtered.length ? (
          <EmptyState
            title="Belum ada fasilitas"
            description="Coba perluas pencarian atau terapkan seed demo."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((f: any) => (
              <article
                key={f.id}
                className="rounded-xl border border-border-default bg-surface p-5"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium uppercase text-brand">
                      {f.category} {f.is_demo && "· DEMO"}
                    </span>
                    <h2 className="mt-1 font-semibold">{f.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
                      <MapPin size={14} />
                      {f.city} · {f.address}
                    </p>
                  </div>
                  {f.accepts_bpjs && (
                    <span className="h-fit rounded-full bg-brand-soft px-2 py-1 text-xs text-brand">
                      BPJS
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {f.services?.map((s: string) => (
                    <span key={s} className="rounded-full bg-subtle px-2 py-1 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${f.latitude}&mlon=${f.longitude}#map=16/${f.latitude}/${f.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand"
                >
                  Petunjuk arah <ExternalLink size={15} />
                </a>
              </article>
            ))}
          </div>
        )}
        <aside className="min-h-80 overflow-hidden rounded-2xl border border-border-default bg-brand-soft">
          <div className="p-4">
            <h2 className="font-semibold">Peta OpenStreetMap</h2>
            <p className="text-sm text-text-secondary">
              Tanpa kunci API berbayar. Pilih petunjuk arah pada fasilitas.
            </p>
          </div>
          <div className="grid h-72 place-items-center bg-[radial-gradient(circle_at_center,var(--color-brand-soft),transparent_65%)]">
            <MapPin className="text-brand" size={48} />
          </div>
        </aside>
      </div>
    </>
  );
}
