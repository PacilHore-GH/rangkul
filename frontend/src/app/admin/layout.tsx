"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  {
    href: "/admin",
    label: "Beranda",
    disabled: true,
    icon: DashboardIcon,
  },
  {
    href: "/admin/aid",
    label: "Program Bantuan",
    disabled: false,
    icon: LandmarkIcon,
  },
  {
    href: "/admin",
    label: "Pengaturan",
    disabled: true,
    icon: SettingsIcon,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /*
   * Tutup drawer ketika pengguna berpindah halaman.
   */
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  /*
   * Saat drawer terbuka:
   * - cegah halaman di belakang ikut scroll;
   * - izinkan tombol Escape untuk menutup drawer.
   */
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-canvas text-primary">
      {/* Mobile top app bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-default-border bg-surface px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Buka menu navigasi"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-admin-navigation"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <MenuIcon />
          <span>Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-primary">
            Rangkul
          </span>

          <span className="rounded-full border border-default-border bg-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary">
            Admin
          </span>
        </div>
      </header>

      {/* Mobile overlay */}
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
        />
      )}

      {/* Mobile navigation drawer */}
      <aside
        id="mobile-admin-navigation"
        aria-label="Navigasi admin"
        className={`fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-80 flex-col border-r border-default-border bg-surface shadow-xl transition-transform duration-200 ease-out lg:hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          onNavigate={() => setIsMenuOpen(false)}
          onClose={() => setIsMenuOpen(false)}
          showCloseButton
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-default-border bg-surface lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Existing page content */}
      <main className="min-h-screen lg:pl-60">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  onClose,
  showCloseButton = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}) {
  return (
    <>
      {/* Brand */}
      <div className="flex min-h-20 items-center justify-between border-b border-default-border px-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-primary">
              Rangkul
            </span>

            <span className="rounded-full border border-default-border bg-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary">
              Admin
            </span>
          </div>

          <p className="mt-1 text-xs text-secondary">
            Portal Administrasi
          </p>
        </div>

        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-secondary transition-colors duration-200 hover:bg-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Main navigation */}
      <nav
        className="flex-1 space-y-1.5 p-3"
        aria-label="Menu utama admin"
      >
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            !item.disabled &&
            (pathname === item.href ||
              (item.href !== "/admin" &&
                pathname.startsWith(`${item.href}/`)));

          if (item.disabled) {
            return (
              <div
                key={item.label}
                aria-disabled="true"
                className="flex min-h-12 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm text-secondary opacity-55"
              >
                <Icon />

                <span className="flex-1">{item.label}</span>

                <span className="text-xs">Segera</span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                isActive
                  ? "bg-subtle text-brand-primary shadow-[inset_4px_0_0_var(--color-brand-primary)]"
                  : "text-secondary hover:bg-subtle hover:text-primary"
              }`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar footer */}
      <div className="border-t border-default-border px-5 py-4">
        <p className="text-xs text-secondary">
          © 2026 Rangkul · v0.1
        </p>
      </div>
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function LandmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <path d="m3 10 9-6 9 6" />
      <path d="M5 10v8" />
      <path d="M9 10v8" />
      <path d="M15 10v8" />
      <path d="M19 10v8" />
      <path d="M3 18h18" />
      <path d="M2 22h20" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}