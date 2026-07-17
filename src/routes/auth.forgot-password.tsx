import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RangkulLogo } from "@/components/brand/Logo";
export const Route = createFileRoute("/auth/forgot-password")({ component: ForgotPassword });
function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Mengirim…");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setStatus(error ? error.message : "Jika email terdaftar, tautan pemulihan telah dikirim.");
  }
  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border-default bg-surface p-6 shadow-sm"
      >
        <RangkulLogo />
        <h1 className="mt-6 text-2xl font-semibold">Lupa kata sandi</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Kami akan mengirim tautan pemulihan yang aman.
        </p>
        <label className="mt-5 block text-sm font-medium">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-border-default px-3"
          />
        </label>
        <button className="mt-4 h-11 w-full rounded-lg bg-brand font-semibold text-white">
          Kirim tautan
        </button>
        {status && (
          <p role="status" className="mt-3 text-sm">
            {status}
          </p>
        )}
        <Link to="/auth" className="mt-4 block text-center text-sm text-text-link">
          Kembali masuk
        </Link>
      </form>
    </main>
  );
}
