import { createFileRoute, useNavigate, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RangkulLogo } from "@/components/brand/Logo";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk atau daftar · Rangkul" },
      { name: "description", content: "Masuk ke akun Rangkul atau buat akun keluarga baru." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"family_member_caregiver" | "professional">(
    "family_member_caregiver",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/beranda" });
    });
  }, [navigate]);

  if (path !== "/auth") return <Outlet />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/beranda`,
            data: { display_name: name || email.split("@")[0], role },
          },
        });
        if (error) throw error;
        toast.success("Akun berhasil dibuat", {
          description: "Silakan lanjutkan mengisi profil.",
        });
        // Auto-signed in (email confirm off by default). If not, prompt user.
        const { data } = await supabase.auth.getSession();
        if (data.session) navigate({ to: "/onboarding" });
        else toast.info("Periksa email Anda untuk verifikasi bila diminta.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Selamat datang kembali");
        navigate({ to: "/beranda" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kendala. Coba lagi.";
      const friendly = /invalid login credentials/i.test(msg)
        ? "Email atau kata sandi salah. Periksa kembali."
        : /already registered|already been registered/i.test(msg)
          ? "Email sudah terdaftar. Silakan masuk."
          : /password/i.test(msg) && /6/.test(msg)
            ? "Kata sandi minimal 6 karakter."
            : msg;
      toast.error("Tidak dapat memproses", { description: friendly });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto max-w-6xl px-6 py-5">
        <Link to="/" aria-label="Ke beranda Rangkul">
          <RangkulLogo />
        </Link>
      </header>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-4 md:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)] md:px-6 md:pt-8">
        <div className="order-2 rounded-2xl border border-border-default bg-surface p-6 shadow-sm md:order-1 md:p-8">
          <h1 className="text-2xl font-semibold">
            {mode === "signup" ? "Buat akun keluarga" : "Masuk ke Rangkul"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {mode === "signup"
              ? "Satu akun untuk keluarga Anda. Anda dapat menambahkan profil anggota keluarga setelah masuk."
              : "Silakan masuk dengan email dan kata sandi Anda."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Nama panggilan
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bunda Alya"
                  className="mt-1 h-11 w-full rounded-lg border border-border-default bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Digunakan untuk menyapa Anda dalam aplikasi.
                </p>
                <fieldset className="mt-4">
                  <legend className="text-sm font-medium">Peran akun</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["family_member_caregiver", "Keluarga / caregiver"],
                        ["professional", "Profesional"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${role === value ? "border-brand bg-brand-soft" : "border-border-default"}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          checked={role === value}
                          onChange={() => setRole(value)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    Profesional tetap memerlukan tautan keluarga. Admin dibuat oleh pengelola
                    platform.
                  </p>
                </fieldset>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-1 h-11 w-full rounded-lg border border-border-default bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Kata sandi
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="mt-1 h-11 w-full rounded-lg border border-border-default bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-text-inverse hover:bg-brand-hover disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "signup" ? "Buat akun" : "Masuk"}
            </button>
            {mode === "signin" && (
              <div className="text-right">
                <Link to="/auth/forgot-password" className="text-sm font-medium text-text-link">
                  Lupa kata sandi?
                </Link>
              </div>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            {mode === "signup" ? (
              <>
                Sudah punya akun?{" "}
                <button
                  className="font-medium text-text-link hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Masuk di sini
                </button>
              </>
            ) : (
              <>
                Belum punya akun?{" "}
                <button
                  className="font-medium text-text-link hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Daftar sekarang
                </button>
              </>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-text-secondary">
          Dengan melanjutkan, Anda memahami bahwa Rangkul adalah pendamping — bukan pengganti tenaga
          profesional.
        </p>
        <aside className="order-1 overflow-hidden rounded-2xl bg-brand-soft md:order-2">
          <div className="p-5 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              Rangkul bersama
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Bersama untuk tumbuh, pulih, dan berdaya.
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Pendamping keluarga dan profesional—bukan alat diagnosis.
            </p>
          </div>
          <img
            src="/images/rangkul-auth-hero.png"
            alt="Ilustrasi 3D keluarga Rangkul yang saling mendukung"
            className="max-h-48 w-full object-cover object-top md:max-h-none md:aspect-[4/5]"
          />
        </aside>
      </main>
    </div>
  );
}
