import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { RangkulLogo, RangkulMark } from "@/components/brand/Logo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getActivePersonProfile } from "@/lib/person-profile.functions";
import {
  Home,
  Compass,
  MessageCircleHeart,
  MapPin,
  BookHeart,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Landmark,
  Stethoscope,
  Shield,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/beranda", label: "Beranda", icon: Home },
  { to: "/people", label: "Profil", icon: Users },
  { to: "/roadmap", label: "Roadmap", icon: Compass },
  { to: "/asisten", label: "Asisten AI", icon: MessageCircleHeart },
  { to: "/services", label: "Layanan", icon: MapPin },
  { to: "/aid", label: "Bantuan", icon: Landmark },
  { to: "/journal", label: "Jurnal", icon: BookHeart },
  { to: "/professional", label: "Profesional", icon: Stethoscope },
  { to: "/admin", label: "Admin", icon: Shield },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

// Primary bottom-nav destinations (max 5 per 03_UX_AND_CONTENT).
const BOTTOM = NAV.filter((item) =>
  ["/beranda", "/roadmap", "/asisten", "/services", "/journal"].includes(item.to),
);

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const fetchProfile = useServerFn(getActivePersonProfile);
  const { data: profile } = useQuery({
    queryKey: ["active-person-profile"],
    queryFn: () => fetchProfile(),
  });

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border-default bg-surface md:flex md:flex-col">
        <div className="px-5 py-5">
          <Link to="/beranda" aria-label="Beranda Rangkul">
            <RangkulLogo />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-text-primary hover:bg-subtle",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border-default p-3">
          {profile && (
            <div className="mb-2 rounded-lg bg-subtle px-3 py-2 text-xs">
              <div className="text-text-secondary">Profil aktif</div>
              <div className="mt-0.5 font-medium text-text-primary">{profile.display_name}</div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-primary hover:bg-subtle"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-default bg-surface px-4 md:hidden">
        <Link to="/beranda" aria-label="Beranda Rangkul" className="flex items-center gap-2">
          <RangkulMark size={24} className="text-brand" />
          <span className="text-base font-semibold">Rangkul</span>
        </Link>
        <button
          aria-label="Buka menu"
          onClick={() => setMenuOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-subtle"
        >
          <Menu size={20} />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-surface p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <RangkulLogo />
              <button
                aria-label="Tutup menu"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-subtle"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="mt-4 space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-subtle"
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={handleSignOut}
              className="mt-auto flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-subtle"
            >
              <LogOut size={18} />
              Keluar
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="pb-20 md:ml-60 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-border-default bg-surface md:hidden"
      >
        {BOTTOM.map((item) => {
          const active = path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-brand" : "text-text-secondary",
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary md:text-base">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
