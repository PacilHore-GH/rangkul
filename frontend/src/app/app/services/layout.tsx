import Link from "next/link";

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-primary">
      <header className="sticky top-0 z-50 border-b border-default-border bg-surface/95 backdrop-blur">
        <nav
          aria-label="Navigasi layanan"
          className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link href="/" className="flex min-h-11 items-center gap-3 font-bold">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-primary text-inverse-text">R</span>
            Rangkul
          </Link>
          <div className="flex items-center gap-1 text-sm sm:gap-2">
            <Link
              href="/app/services/search"
              className="flex min-h-11 items-center rounded-xl px-3 hover:bg-subtle focus-visible:outline-2 focus-visible:outline-focus"
            >
              Cari layanan
            </Link>
            <Link
              href="/app/services/compare"
              className="flex min-h-11 items-center rounded-xl px-3 hover:bg-subtle focus-visible:outline-2 focus-visible:outline-focus"
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
