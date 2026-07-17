import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RangkulMark } from "@/components/brand/Logo";
import { createPersonProfile, listPersonProfiles } from "@/lib/person-profile.functions";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [{ title: "Menyiapkan profil · Rangkul" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

const SUPPORT_OPTIONS = [
  "Autisme",
  "Down syndrome",
  "Cerebral palsy",
  "ADHD",
  "Disabilitas intelektual",
  "Tuli / gangguan pendengaran",
  "Buta / gangguan penglihatan",
  "Keterlambatan bicara",
  "Keterlambatan motorik",
  "Kondisi lain",
];

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listPersonProfiles);
  const createFn = useServerFn(createPersonProfile);

  const { data: existing } = useQuery({ queryKey: ["person-profiles"], queryFn: () => listFn() });

  const [step, setStep] = useState(0);
  const [display_name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [ecName, setEcName] = useState("");
  const [ecPhone, setEcPhone] = useState("");

  useEffect(() => {
    if (existing && existing.length > 0) navigate({ to: "/beranda", replace: true });
  }, [existing, navigate]);

  const mut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          display_name: display_name.trim(),
          age: age ? Number(age) : null,
          support_needs: needs,
          support_summary: summary.trim(),
          emergency_contact_name: ecName.trim(),
          emergency_contact_phone: ecPhone.trim(),
        },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success("Profil tersimpan", { description: "Selamat datang di Rangkul." });
      navigate({ to: "/beranda", replace: true });
    },
    onError: (e) => toast.error("Tidak dapat menyimpan", { description: e instanceof Error ? e.message : "" }),
  });

  const stepsMeta = [
    { title: "Siapa yang Anda dampingi?", desc: "Sebut nama panggilan yang biasa Anda gunakan." },
    { title: "Usia dan kebutuhan dukungan", desc: "Pilih yang paling menggambarkan. Tidak apa jika masih perkiraan." },
    { title: "Ceritakan sedikit", desc: "Deskripsi singkat membantu asisten memberikan panduan yang lebih relevan." },
    { title: "Kontak darurat (opsional)", desc: "Hanya disimpan untuk Anda; Rangkul tidak membagikan data ini." },
  ];

  const canNext = () => {
    if (step === 0) return display_name.trim().length > 0;
    return true;
  };

  const toggleNeed = (n: string) =>
    setNeeds((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <RangkulMark size={28} className="text-brand" />
        <div className="text-sm text-text-secondary">Menyiapkan profil · Langkah {step + 1} dari 4</div>
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-subtle">
        <div className="h-full bg-brand transition-all" style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-border-default bg-surface p-6 md:p-8">
        <h1 className="text-xl font-semibold">{stepsMeta[step].title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{stepsMeta[step].desc}</p>

        <div className="mt-6 space-y-4">
          {step === 0 && (
            <div>
              <label htmlFor="pname" className="block text-sm font-medium">
                Nama panggilan
              </label>
              <input
                id="pname"
                value={display_name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alya"
                className="mt-1 h-11 w-full rounded-lg border border-border-default bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Anda dapat menambahkan anggota keluarga lain nanti.
              </p>
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label htmlFor="age" className="block text-sm font-medium">
                  Usia (tahun)
                </label>
                <input
                  id="age"
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="mis. 6"
                  className="mt-1 h-11 w-40 rounded-lg border border-border-default bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
                />
              </div>
              <div>
                <span className="block text-sm font-medium">Kebutuhan dukungan</span>
                <p className="text-xs text-text-secondary">Pilih satu atau lebih. Tidak wajib.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUPPORT_OPTIONS.map((n) => {
                    const on = needs.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => toggleNeed(n)}
                        aria-pressed={on}
                        className={
                          "inline-flex h-9 items-center rounded-full px-3 text-xs font-medium transition-colors " +
                          (on
                            ? "bg-brand text-text-inverse"
                            : "border border-border-default bg-surface text-text-primary hover:bg-subtle")
                        }
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div>
              <label htmlFor="sum" className="block text-sm font-medium">
                Ringkasan singkat
              </label>
              <textarea
                id="sum"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Contoh: Alya berusia 6 tahun, saat ini fokus pada terapi wicara. Suka menggambar dan musik."
                rows={5}
                className="mt-1 w-full rounded-lg border border-border-default bg-surface p-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Simpan yang membantu Anda mengingat konteks — hindari data medis sensitif.
              </p>
            </div>
          )}

          {step === 3 && (
            <>
              <div>
                <label htmlFor="ecn" className="block text-sm font-medium">
                  Nama kontak darurat
                </label>
                <input
                  id="ecn"
                  value={ecName}
                  onChange={(e) => setEcName(e.target.value)}
                  placeholder="mis. Ayah"
                  className="mt-1 h-11 w-full rounded-lg border border-border-default bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
                />
              </div>
              <div>
                <label htmlFor="ecp" className="block text-sm font-medium">
                  Nomor telepon
                </label>
                <input
                  id="ecp"
                  inputMode="tel"
                  value={ecPhone}
                  onChange={(e) => setEcPhone(e.target.value)}
                  placeholder="mis. 0812-3456-7890"
                  className="mt-1 h-11 w-full rounded-lg border border-border-default bg-surface px-3 text-sm outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex h-11 items-center gap-1 rounded-lg px-3 text-sm font-medium text-text-primary hover:bg-subtle disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Kembali
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="inline-flex h-11 items-center gap-1 rounded-lg bg-brand px-4 text-sm font-semibold text-text-inverse hover:bg-brand-hover disabled:opacity-60"
            >
              Lanjut <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => mut.mutate()}
              disabled={mut.isPending || !display_name.trim()}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-text-inverse hover:bg-brand-hover disabled:opacity-60"
            >
              {mut.isPending && <Loader2 size={16} className="animate-spin" />}
              Simpan profil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
