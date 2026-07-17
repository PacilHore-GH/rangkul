import { createFileRoute, Link } from "@tanstack/react-router";
import { RangkulLogo, RangkulMark } from "@/components/brand/Logo";
import { ArrowRight, HeartHandshake, Compass, MessageCircleHeart, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rangkul — Tidak sendiri dalam setiap langkah" },
      {
        name: "description",
        content:
          "Pendamping digital untuk keluarga yang mendukung orang dengan kebutuhan dukungan khusus di Indonesia.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <RangkulLogo />
        <nav className="flex items-center gap-3">
          <Link
            to="/auth"
            className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-text-primary hover:bg-subtle"
          >
            Masuk
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" } as never}
            className="inline-flex h-10 items-center gap-1 rounded-lg bg-brand px-4 text-sm font-medium text-text-inverse hover:bg-brand-hover"
          >
            Mulai gratis <ArrowRight size={16} />
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 pt-10 pb-16 text-center md:pt-20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border-default bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
            <HeartHandshake size={14} className="text-brand" />
            Pendamping keluarga · Bahasa Indonesia
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Dipahami kebutuhannya.
            <br className="hidden md:block" /> Dipandu langkahnya.
            <br className="hidden md:block" /> Dirangkul perjalanannya.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-text-secondary md:text-lg">
            Rangkul membantu keluarga yang mendampingi anggota dengan kebutuhan dukungan khusus:
            memahami kondisi, menyusun langkah realistis, menemukan layanan, dan mempersiapkan
            konsultasi profesional dengan lebih baik.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-text-inverse hover:bg-brand-hover"
            >
              Mulai gratis <ArrowRight size={18} />
            </Link>
            <Link
              to="/auth"
              className="inline-flex h-12 items-center rounded-lg border border-border-default bg-surface px-6 text-sm font-semibold hover:bg-subtle"
            >
              Sudah punya akun · Masuk
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-secondary">
            Rangkul bukan alat diagnosis dan tidak menggantikan tenaga profesional.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3">
          {[
            {
              icon: Compass,
              title: "Rencana dukungan personal",
              body: "Asisten menyusun langkah mingguan, target bulanan, dan rekomendasi terapi awal yang bisa Anda diskusikan dengan profesional.",
            },
            {
              icon: MessageCircleHeart,
              title: "Asisten yang menyebutkan sumber",
              body: "Jawaban selalu merujuk pada dokumen terpercaya (WHO, Kemenkes) dan menyertakan catatan batas: panduan umum, bukan diagnosis.",
            },
            {
              icon: MapPin,
              title: "Layanan & bantuan pemerintah",
              body: "Daftar rumah sakit, klinik terapi, dan SLB terkurasi, plus kecocokan awal program bantuan seperti KIS, PKH, dan Kartu Disabilitas.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border-default bg-surface p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{body}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-24">
          <div className="rounded-2xl bg-inverse p-8 text-text-inverse md:p-12">
            <div className="flex items-start gap-4">
              <RangkulMark size={40} className="text-accent-warm" />
              <div>
                <h2 className="text-2xl font-semibold">Tidak sendiri dalam setiap langkah.</h2>
                <p className="mt-2 text-sm opacity-90">
                  Rangkul dirancang untuk keluarga yang mendampingi orang dengan kebutuhan dukungan
                  khusus — dengan bahasa yang hangat, jelas, dan menghormati martabat setiap orang.
                </p>
                <Link
                  to="/auth"
                  search={{ mode: "signup" } as never}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-accent-warm px-5 text-sm font-semibold text-inverse hover:opacity-95"
                >
                  Buat akun keluarga <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-default bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 md:flex-row md:items-center">
          <RangkulLogo />
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} Rangkul · Hackathon MVP. Bukan alat diagnosis medis.
          </p>
        </div>
      </footer>
    </div>
  );
}
