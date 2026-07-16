import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Portal — Rangkul",
  description: "Portal administrasi program bantuan pemerintah",
};

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊", disabled: true },
  { href: "/admin/aid", label: "Program Bantuan", icon: "🏛️", disabled: false },
  { href: "/admin", label: "Pengaturan", icon: "⚙️", disabled: true },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-[family-name:var(--font-geist-sans)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-zinc-800 flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Rangkul</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Portal Administrasi</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-disabled={item.disabled}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.disabled
                  ? "text-zinc-600 cursor-not-allowed"
                  : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.disabled && (
                <span className="ml-auto text-[10px] text-zinc-600">Segera</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <p className="text-[11px] text-zinc-600">
            © 2026 Rangkul · v0.1
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
