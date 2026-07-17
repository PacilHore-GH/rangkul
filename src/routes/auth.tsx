import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RangkulLogo } from "@/components/brand/Logo";
import { Loader2 } from "lucide-react";
import { authInputSchema, firstValidationMessage } from "@/lib/validation";

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
  const navigate = useNavigate();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/beranda" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = authInputSchema.safeParse({ email, password, displayName: name });
    if (!parsed.success) {
      toast.error("Periksa data Anda", { description: firstValidationMessage(parsed.error) });
      return;
    }
    setLoading(true);
    try {
      const input = parsed.data;
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            emailRedirectTo: `${window.location.origin}/beranda`,
            data: { display_name: input.displayName || input.email.split("@")[0] },
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
        const { error } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });
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
      <main className="mx-auto flex max-w-md flex-col px-6 pb-16 pt-6">
        <div className="rounded-2xl border border-border-default bg-surface p-6 shadow-sm md:p-8">
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
                  maxLength={80}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bunda Alya"
                  className="mt-1 h-11 w-full rounded-lg border border-border-default bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Digunakan untuk menyapa Anda dalam aplikasi.
                </p>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                maxLength={254}
                autoComplete="email"
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
                minLength={10}
                maxLength={128}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 10 karakter, huruf besar dan angka"
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
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            {mode === "signup" ? (
              <>
                Sudah punya akun?{" "}
                <button className="font-medium text-text-link hover:underline" onClick={() => setMode("signin")}>
                  Masuk di sini
                </button>
              </>
            ) : (
              <>
                Belum punya akun?{" "}
                <button className="font-medium text-text-link hover:underline" onClick={() => setMode("signup")}>
                  Daftar sekarang
                </button>
              </>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-text-secondary">
          Dengan melanjutkan, Anda memahami bahwa Rangkul adalah pendamping — bukan pengganti tenaga profesional.
        </p>
      </main>
    </div>
  );
}
