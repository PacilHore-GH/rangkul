"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  type AidProgram,
  type AidRule,
  getAidProgram,
  updateAidProgram,
  getAidRules,
  createAidRule,
  publishAidRule,
} from "@/lib/api";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  published: "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  archived: "bg-zinc-800 text-zinc-500 border-zinc-700",
};

const STATUS_DOT: Record<string, string> = {
  draft: "bg-yellow-400",
  published: "bg-emerald-400",
  archived: "bg-zinc-500",
};

export default function AidProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [program, setProgram] = useState<AidProgram | null>(null);
  const [rules, setRules] = useState<AidRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", provider: "", category: "", is_active: true });
  const [saving, setSaving] = useState(false);

  // New rule form
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({ criteria: "{\n  \n}", human_summary: "" });
  const [creatingRule, setCreatingRule] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [p, r] = await Promise.all([getAidProgram(id), getAidRules(id)]);
      setProgram(p);
      setRules(r);
      setEditForm({
        name: p.name,
        description: p.description,
        provider: p.provider,
        category: p.category,
        is_active: p.is_active,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAidProgram(id, editForm);
      setEditing(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    setCreatingRule(true);
    try {
      const ruleJson = JSON.parse(ruleForm.criteria);
      await createAidRule(id, { rule_json: ruleJson, human_summary: ruleForm.human_summary });
      setRuleForm({ criteria: "{\n  \n}", human_summary: "" });
      setShowRuleForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat aturan");
    } finally {
      setCreatingRule(false);
    }
  }

  async function handlePublish(ruleId: string) {
    setPublishing(ruleId);
    try {
      await publishAidRule(id, ruleId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mempublikasikan");
    } finally {
      setPublishing(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-zinc-800 rounded w-48" />
        <div className="h-4 bg-zinc-800/60 rounded w-96 mt-2" />
        <div className="h-40 bg-zinc-800/40 rounded-xl mt-6" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400">Program tidak ditemukan</p>
        <button
          onClick={() => router.push("/admin/aid")}
          className="text-sm text-zinc-500 hover:text-zinc-300 mt-4 underline cursor-pointer"
        >
          ← Kembali
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back + title */}
      <button
        onClick={() => router.push("/admin/aid")}
        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6 cursor-pointer"
      >
        ← Kembali ke Daftar Program
      </button>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Program detail card */}
      <div className="border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">{program.provider}</p>
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-sm px-4 py-1.5 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {editing ? "Batal" : "✏️ Edit"}
          </button>
        </div>

        {!editing && (
          <>
            <p className="text-sm text-zinc-300 mb-4">{program.description}</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-full border bg-zinc-800 border-zinc-700 text-zinc-300">
                {program.category}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                  program.is_active
                    ? "bg-emerald-900/40 text-emerald-400 border-emerald-800"
                    : "bg-zinc-800 text-zinc-500 border-zinc-700"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    program.is_active ? "bg-emerald-400" : "bg-zinc-500"
                  }`}
                />
                {program.is_active ? "Aktif" : "Nonaktif"}
              </span>
              {program.verification_status === "verified" && (
                <span className="px-2.5 py-1 rounded-full border bg-blue-900/40 text-blue-400 border-blue-800">
                  ✓ Terverifikasi
                </span>
              )}
            </div>
          </>
        )}

        {editing && (
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-zinc-400 mb-1 block">Nama</span>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400 mb-1 block">Penyedia</span>
                <input
                  required
                  value={editForm.provider}
                  onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400 mb-1 block">Kategori</span>
                <select
                  required
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
                >
                  <option value="disability_support">Disabilitas</option>
                  <option value="health">Kesehatan</option>
                  <option value="education">Pendidikan</option>
                  <option value="financial">Keuangan</option>
                  <option value="housing">Perumahan</option>
                  <option value="other">Lainnya</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400 mb-1 block">Status</span>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="accent-emerald-500"
                  />
                  <span className="text-sm text-zinc-300">Aktif</span>
                </div>
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1 block">Deskripsi</span>
              <textarea
                required
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-medium bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Rule versions section */}
      <div className="border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Versi Aturan</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola kriteria kelayakan program
            </p>
          </div>
          <button
            onClick={() => setShowRuleForm((v) => !v)}
            className="text-sm px-4 py-1.5 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {showRuleForm ? "Batal" : "＋ Tambah Versi"}
          </button>
        </div>

        {/* New rule form */}
        {showRuleForm && (
          <form
            onSubmit={handleCreateRule}
            className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-5 mb-6 space-y-4"
          >
            <h3 className="text-sm font-medium text-zinc-300">
              Buat Versi Aturan Baru
            </h3>
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1 block">
                Kriteria (JSON)
              </span>
              <textarea
                required
                value={ruleForm.criteria}
                onChange={(e) => setRuleForm({ ...ruleForm, criteria: e.target.value })}
                rows={8}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-geist-mono)] focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
                placeholder='{ "min_age": 18, "max_income": 3000000 }'
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1 block">
                Ringkasan (Bahasa Indonesia)
              </span>
              <textarea
                required
                value={ruleForm.human_summary}
                onChange={(e) => setRuleForm({ ...ruleForm, human_summary: e.target.value })}
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
                placeholder="Warga berusia minimal 18 tahun dengan penghasilan maksimal Rp 3.000.000/bulan…"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creatingRule}
                className="px-5 py-2 text-sm font-medium bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {creatingRule ? "Menyimpan…" : "Simpan Aturan"}
              </button>
            </div>
          </form>
        )}

        {/* Rules list */}
        {rules.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📜</p>
            <p className="text-zinc-500 text-sm">
              Belum ada versi aturan untuk program ini
            </p>
          </div>
        )}

        {rules.length > 0 && (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between border border-zinc-800 rounded-lg px-5 py-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-zinc-200">
                      Versi {rule.version}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border ${
                        STATUS_STYLE[rule.status]
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[rule.status]}`}
                      />
                      {rule.status === "draft"
                        ? "Draf"
                        : rule.status === "published"
                        ? "Terpublikasi"
                        : "Diarsipkan"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">
                    {rule.human_summary}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Dibuat: {new Date(rule.created_at).toLocaleDateString("id-ID")}
                    {rule.published_at &&
                      ` · Dipublikasikan: ${new Date(rule.published_at).toLocaleDateString("id-ID")}`}
                  </p>
                </div>

                {rule.status === "draft" && (
                  <button
                    onClick={() => handlePublish(rule.id)}
                    disabled={publishing === rule.id}
                    className="ml-4 shrink-0 text-sm px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {publishing === rule.id ? "…" : "Publikasikan"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
