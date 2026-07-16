"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type AidProgram,
  getAidPrograms,
  createAidProgram,
} from "@/lib/api";

// ponytail: map backend enum values to colors and Indonesian labels
const CATEGORIES = [
  { value: "disability_support", label: "Disabilitas", colors: "bg-purple-900/50 text-purple-300 border-purple-800" },
  { value: "health", label: "Kesehatan", colors: "bg-emerald-900/50 text-emerald-300 border-emerald-800" },
  { value: "education", label: "Pendidikan", colors: "bg-blue-900/50 text-blue-300 border-blue-800" },
  { value: "financial", label: "Keuangan", colors: "bg-amber-900/50 text-amber-300 border-amber-800" },
  { value: "housing", label: "Perumahan", colors: "bg-orange-900/50 text-orange-300 border-orange-800" },
  { value: "other", label: "Lainnya", colors: "bg-zinc-800 text-zinc-300 border-zinc-700" },
];

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.colors])
);

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

function categoryBadgeClass(category: string) {
  return (
    CATEGORY_COLORS[category.toLowerCase()] ||
    "bg-zinc-800 text-zinc-300 border-zinc-700"
  );
}

// ponytail: skeleton inline, no shared component
function CardSkeleton() {
  return (
    <div className="border border-zinc-800 rounded-xl p-5 animate-pulse">
      <div className="h-5 bg-zinc-800 rounded w-2/3 mb-3" />
      <div className="h-4 bg-zinc-800/60 rounded w-1/3 mb-4" />
      <div className="flex gap-2">
        <div className="h-5 bg-zinc-800 rounded-full w-20" />
        <div className="h-5 bg-zinc-800 rounded-full w-16" />
      </div>
    </div>
  );
}

const INITIAL_FORM = {
  name: "",
  description: "",
  provider: "",
  category: "",
  jurisdiction: "",
  is_active: true,
};

export default function AidProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<AidProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setPrograms(await getAidPrograms());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAidProgram(form);
      setForm(INITIAL_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat program");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Program Bantuan
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kelola program bantuan pemerintah
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 text-sm font-medium bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
        >
          {showForm ? "Batal" : "＋ Tambah Program"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-zinc-800 rounded-xl p-6 mb-8 space-y-4 bg-zinc-900/50"
        >
          <h2 className="text-lg font-semibold mb-2">Program Baru</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1 block">
                Nama Program
              </span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Contoh: Program Keluarga Harapan"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1 block">
                Penyedia
              </span>
              <input
                required
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Contoh: Kemensos RI"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1 block">
                Kategori
              </span>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="">Pilih kategori…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1 block">Wilayah</span>
              <input
                required
                value={form.jurisdiction}
                onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Contoh: Nasional / DKI Jakarta"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1 block">Status</span>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="accent-emerald-500"
                />
                <span className="text-sm text-zinc-300">Aktif</span>
              </div>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-zinc-400 mb-1 block">
              Deskripsi
            </span>
            <textarea
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
              placeholder="Deskripsi singkat program…"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && programs.length === 0 && !error && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-zinc-400 text-lg">Belum ada program bantuan</p>
          <p className="text-zinc-600 text-sm mt-1">
            Klik &quot;Tambah Program&quot; untuk memulai
          </p>
        </div>
      )}

      {/* Program grid */}
      {!loading && programs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/admin/aid/${p.id}`)}
              className="text-left border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-zinc-100 group-hover:text-white leading-tight">
                  {p.name}
                </h3>
                {p.is_verified && (
                  <span title="Terverifikasi" className="text-blue-400 ml-2">
                    ✓
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-500 mb-4">{p.provider}</p>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${categoryBadgeClass(
                    p.category
                  )}`}
                >
                  {CATEGORY_LABELS[p.category] || p.category}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border ${
                    p.is_active
                      ? "bg-emerald-900/40 text-emerald-400 border-emerald-800"
                      : "bg-zinc-800 text-zinc-500 border-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      p.is_active ? "bg-emerald-400" : "bg-zinc-500"
                    }`}
                  />
                  {p.is_active ? "Aktif" : "Nonaktif"}
                </span>

                {p.rule_version_count > 0 && (
                  <span className="text-[11px] text-zinc-500">
                    {p.rule_version_count} aturan
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
