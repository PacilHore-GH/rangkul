import Link from "next/link";

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <nav
          aria-label="Navigasi layanan"
          className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link href="/" className="flex min-h-11 items-center gap-3 font-bold">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600">R</span>
            Rangkul
          </Link>
          <div className="flex gap-2 text-sm">
            <Link
              href="/app/services/search"
              className="flex min-h-11 items-center rounded-lg px-3 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-400"
            >
              Cari layanan
            </Link>
            <Link
              href="/app/services/compare"
              className="flex min-h-11 items-center rounded-lg px-3 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-400"
            >
              Bandingkan
            </Link>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
