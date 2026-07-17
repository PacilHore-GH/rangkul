import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { PrivacyNotice } from "@/components/product/States";
const NEEDS = [
  "communication",
  "sensory",
  "mobility",
  "daily living",
  "learning",
  "behavioral support",
  "social interaction",
  "therapy support",
];
export const Route = createFileRoute("/_authenticated/people/$personId")({
  component: PersonDetail,
});
function PersonDetail() {
  const { personId } = Route.useParams();
  return (
    <>
      <PageHeader
        title="Ringkasan profil"
        description={`Profil ${personId.slice(0, 8)} · akses dan persetujuan selalu diperiksa di server`}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border-default bg-surface p-5 lg:col-span-2">
          <h2 className="font-semibold">Kebutuhan dukungan</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {NEEDS.map((n) => (
              <span key={n} className="rounded-full bg-brand-soft px-3 py-1 text-xs text-brand">
                {n}
              </span>
            ))}
          </div>
          <h2 className="mt-6 font-semibold">Lingkar dukungan</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Pemilik dapat mengundang caregiver, profesional, atau viewer dengan tingkat akses
            praktis.
          </p>
        </section>
        <section className="rounded-2xl border border-border-default bg-surface p-5">
          <h2 className="font-semibold">Onboarding</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Lengkapi kebutuhan, lingkar dukungan, dan preferensi privasi.
          </p>
          <Link
            to="/onboarding"
            className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-4 font-semibold text-white"
          >
            Lanjutkan
          </Link>
        </section>
      </div>
      <div className="mt-4">
        <PrivacyNotice />
      </div>
    </>
  );
}
