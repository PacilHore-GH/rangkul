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
  draft:
    "border-[var(--color-warning)]/35 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  published:
    "border-[var(--color-success)]/35 bg-[var(--color-success)]/10 text-[var(--color-success)]",
  archived:
    "border-default-border bg-subtle text-secondary",
};

const STATUS_DOT: Record<string, string> = {
  draft: "bg-[var(--color-warning)]",
  published: "bg-[var(--color-success)]",
  archived: "bg-secondary",
};

export default function AidProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [program, setProgram] = useState<AidProgram | null>(null);
  const [rules, setRules] = useState<AidRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    provider: "",
    category: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    criteria: "{\n  \n}",
    human_summary: "",
  });
  const [creatingRule, setCreatingRule] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [programData, ruleData] = await Promise.all([
        getAidProgram(id),
        getAidRules(id),
      ]);

      setProgram(programData);
      setRules(ruleData);

      setEditForm({
        name: programData.name,
        description: programData.description,
        provider: programData.provider,
        category: programData.category,
        is_active: programData.is_active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await updateAidProgram(id, editForm);
      setEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRule(event: React.FormEvent) {
    event.preventDefault();
    setCreatingRule(true);
    setError("");

    try {
      const ruleJson = JSON.parse(ruleForm.criteria);

      await createAidRule(id, {
        rule_json: ruleJson,
        human_summary: ruleForm.human_summary,
      });

      setRuleForm({
        criteria: "{\n  \n}",
        human_summary: "",
      });
      setShowRuleForm(false);

      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal membuat aturan",
      );
    } finally {
      setCreatingRule(false);
    }
  }

  async function handlePublish(ruleId: string) {
    setPublishing(ruleId);
    setError("");

    try {
      await publishAidRule(id, ruleId);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mempublikasikan aturan",
      );
    } finally {
      setPublishing(null);
    }
  }

  if (loading) {
    return (
      <div
        className="space-y-4 animate-pulse"
        aria-label="Memuat detail program"
      >
        <div className="h-6 w-48 rounded-lg bg-subtle" />
        <div className="mt-2 h-4 w-full max-w-96 rounded-lg bg-subtle" />
        <div className="mt-6 h-40 rounded-2xl border border-default-border bg-surface" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="py-20 text-center">
        <p className="text-base font-medium text-primary">
          Program tidak ditemukan
        </p>

        <p className="mt-2 text-sm text-secondary">
          Program mungkin sudah dihapus atau tidak tersedia.
        </p>

        <button
          type="button"
          onClick={() => router.push("/admin/aid")}
          className="mt-5 min-h-11 rounded-xl px-4 text-sm font-medium text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Kembali ke daftar program
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => router.push("/admin/aid")}
        className="mb-6 inline-flex min-h-11 items-center rounded-xl px-1 text-sm font-medium text-secondary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        ← Kembali ke Daftar Program
      </button>

      {/* Error feedback */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-[var(--color-error)]/35 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]"
        >
          <p className="font-medium">Terjadi kendala</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Program detail */}
      <section className="mb-8 rounded-2xl border border-default-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-8 tracking-tight text-primary sm:text-[32px] sm:leading-10">
              {program.name}
            </h1>

            <p className="mt-1 text-base text-secondary">
              {program.provider}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-xl border border-strong-border bg-surface px-4 text-sm font-medium text-primary transition-colors duration-200 hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {editing ? "Batal" : "Edit program"}
          </button>
        </div>

        {!editing && (
          <div className="mt-5">
            <p className="max-w-3xl text-base leading-6 text-secondary">
              {program.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-default-border bg-subtle px-3 text-sm font-medium text-primary">
                {getCategoryLabel(program.category)}
              </span>

              <span
                className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium ${
                  program.is_active
                    ? "border-[var(--color-success)]/35 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                    : "border-default-border bg-subtle text-secondary"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${
                    program.is_active
                      ? "bg-[var(--color-success)]"
                      : "bg-secondary"
                  }`}
                />

                {program.is_active ? "Aktif" : "Nonaktif"}
              </span>

              {program.verification_status === "verified" && (
                <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[var(--color-info)]/35 bg-[var(--color-info)]/10 px-3 text-sm font-medium text-[var(--color-info)]">
                  <VerifiedIcon />
                  Terverifikasi
                </span>
              )}
            </div>
          </div>
        )}

        {editing && (
          <form onSubmit={handleUpdate} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Nama program">
                <input
                  required
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      name: event.target.value,
                    })
                  }
                  className={inputClassName}
                />
              </FormField>

              <FormField label="Penyedia">
                <input
                  required
                  value={editForm.provider}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      provider: event.target.value,
                    })
                  }
                  className={inputClassName}
                />
              </FormField>

              <FormField label="Kategori">
                <select
                  required
                  value={editForm.category}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      category: event.target.value,
                    })
                  }
                  className={inputClassName}
                >
                  <option value="disability_support">
                    Disabilitas
                  </option>
                  <option value="health">Kesehatan</option>
                  <option value="education">Pendidikan</option>
                  <option value="financial">Keuangan</option>
                  <option value="housing">Perumahan</option>
                  <option value="other">Lainnya</option>
                </select>
              </FormField>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-primary">
                  Status program
                </legend>

                <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        is_active: event.target.checked,
                      })
                    }
                    className="h-5 w-5 accent-[var(--color-brand-primary)]"
                  />

                  <span className="text-base text-primary">
                    Program aktif
                  </span>
                </label>
              </fieldset>
            </div>

            <FormField label="Deskripsi">
              <textarea
                required
                value={editForm.description}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    description: event.target.value,
                  })
                }
                rows={4}
                className={`${inputClassName} resize-y`}
              />
            </FormField>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="min-h-11 rounded-xl border border-strong-border bg-surface px-5 text-sm font-medium text-primary transition-colors duration-200 hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={saving}
                className="min-h-11 rounded-xl bg-brand-primary px-5 text-sm font-medium text-inverse-text transition-colors duration-200 hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Menyimpan…" : "Simpan perubahan"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Rule versions */}
      <section className="rounded-2xl border border-default-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold leading-7 text-primary">
              Versi Aturan
            </h2>

            <p className="mt-1 text-sm text-secondary">
              Kelola kriteria kelayakan program
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRuleForm((value) => !value)}
            className="inline-flex min-h-11 items-center justify-center self-start rounded-xl border border-strong-border bg-surface px-4 text-sm font-medium text-primary transition-colors duration-200 hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {showRuleForm ? "Batal" : "Tambah versi"}
          </button>
        </div>

        {showRuleForm && (
          <form
            onSubmit={handleCreateRule}
            className="mt-6 space-y-5 rounded-2xl border border-default-border bg-subtle p-4 sm:p-5"
          >
            <h3 className="text-base font-semibold text-primary">
              Buat Versi Aturan Baru
            </h3>

            <FormField
              label="Kriteria dalam format JSON"
              helperText="Pastikan format JSON valid sebelum disimpan."
            >
              <textarea
                required
                value={ruleForm.criteria}
                onChange={(event) =>
                  setRuleForm({
                    ...ruleForm,
                    criteria: event.target.value,
                  })
                }
                rows={8}
                spellCheck={false}
                className={`${inputClassName} resize-y font-[family-name:var(--font-geist-mono)]`}
                placeholder='{ "min_age": 18, "max_income": 3000000 }'
              />
            </FormField>

            <FormField label="Ringkasan dalam Bahasa Indonesia">
              <textarea
                required
                value={ruleForm.human_summary}
                onChange={(event) =>
                  setRuleForm({
                    ...ruleForm,
                    human_summary: event.target.value,
                  })
                }
                rows={3}
                className={`${inputClassName} resize-y`}
                placeholder="Contoh: Warga berusia minimal 18 tahun dengan penghasilan maksimal Rp3.000.000 per bulan."
              />
            </FormField>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowRuleForm(false)}
                className="min-h-11 rounded-xl border border-strong-border bg-surface px-5 text-sm font-medium text-primary transition-colors duration-200 hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={creatingRule}
                className="min-h-11 rounded-xl bg-brand-primary px-5 text-sm font-medium text-inverse-text transition-colors duration-200 hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingRule ? "Menyimpan…" : "Simpan aturan"}
              </button>
            </div>
          </form>
        )}

        {rules.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-default-border bg-subtle px-5 py-12 text-center">
            <p className="text-base font-medium text-primary">
              Belum ada versi aturan
            </p>

            <p className="mt-2 text-sm text-secondary">
              Tambahkan aturan pertama untuk program ini.
            </p>
          </div>
        )}

        {rules.length > 0 && (
          <div className="mt-6 space-y-3">
            {rules.map((rule) => (
              <article
                key={rule.id}
                className="flex flex-col gap-4 rounded-2xl border border-default-border bg-surface p-4 transition-colors duration-200 hover:border-strong-border sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-primary">
                      Versi {rule.version}
                    </h3>

                    <span
                      className={`inline-flex min-h-7 items-center gap-2 rounded-full border px-2.5 text-xs font-medium ${
                        STATUS_STYLE[rule.status] ??
                        STATUS_STYLE.archived
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 rounded-full ${
                          STATUS_DOT[rule.status] ??
                          STATUS_DOT.archived
                        }`}
                      />

                      {getRuleStatusLabel(rule.status)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-5 text-primary">
                    {rule.human_summary}
                  </p>

                  <p className="mt-2 text-xs leading-[18px] text-secondary">
                    Dibuat{" "}
                    {new Date(rule.created_at).toLocaleDateString(
                      "id-ID",
                    )}
                    {rule.published_at &&
                      ` · Dipublikasikan ${new Date(
                        rule.published_at,
                      ).toLocaleDateString("id-ID")}`}
                  </p>
                </div>

                {rule.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => handlePublish(rule.id)}
                    disabled={publishing === rule.id}
                    className="min-h-11 shrink-0 rounded-xl bg-brand-primary px-4 text-sm font-medium text-inverse-text transition-colors duration-200 hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {publishing === rule.id
                      ? "Mempublikasikan…"
                      : "Publikasikan"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const inputClassName =
  "min-h-11 w-full rounded-xl border border-default-border bg-surface px-3 py-2.5 text-base text-primary placeholder:text-secondary/70 focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]/20 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-secondary";

function FormField({
  label,
  helperText,
  children,
}: {
  label: string;
  helperText?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-primary">
        {label}
      </span>

      {children}

      {helperText && (
        <span className="mt-2 block text-xs leading-[18px] text-secondary">
          {helperText}
        </span>
      )}
    </label>
  );
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    disability_support: "Disabilitas",
    health: "Kesehatan",
    education: "Pendidikan",
    financial: "Keuangan",
    housing: "Perumahan",
    other: "Lainnya",
  };

  return labels[category] ?? category;
}

function getRuleStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Draf",
    published: "Terpublikasi",
    archived: "Diarsipkan",
  };

  return labels[status] ?? status;
}

function VerifiedIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}