"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type AidProgram,
  getAidPrograms,
  createAidProgram,
} from "@/lib/api";

const CATEGORIES = [
  { value: "disability_support", label: "Disabilitas" },
  { value: "health", label: "Kesehatan" },
  { value: "education", label: "Pendidikan" },
  { value: "financial", label: "Keuangan" },
  { value: "housing", label: "Perumahan" },
  { value: "other", label: "Lainnya" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category.label]),
);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createAidProgram(form);
      setForm(INITIAL_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal membuat program",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-8 tracking-tight text-primary sm:text-[32px] sm:leading-10">
            Program Bantuan
          </h1>

          <p className="mt-1 text-base text-secondary">
            Kelola program bantuan pemerintah
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-brand-primary px-4 text-sm font-medium text-inverse-text transition-colors duration-200 hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {showForm ? "Batal" : "Tambah program"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 space-y-5 rounded-2xl border border-default-border bg-surface p-5 sm:p-6"
        >
          <div>
            <h2 className="text-xl font-semibold leading-7 text-primary">
              Program Baru
            </h2>

            <p className="mt-1 text-sm text-secondary">
              Lengkapi informasi dasar program bantuan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nama program">
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className={inputClassName}
                placeholder="Contoh: Program Keluarga Harapan"
              />
            </FormField>

            <FormField label="Penyedia">
              <input
                required
                value={form.provider}
                onChange={(event) =>
                  setForm({ ...form, provider: event.target.value })
                }
                className={inputClassName}
                placeholder="Contoh: Kementerian Sosial"
              />
            </FormField>

            <FormField label="Kategori">
              <select
                required
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                className={inputClassName}
              >
                <option value="">Pilih kategori</option>

                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Wilayah">
              <input
                required
                value={form.jurisdiction}
                onChange={(event) =>
                  setForm({
                    ...form,
                    jurisdiction: event.target.value,
                  })
                }
                className={inputClassName}
                placeholder="Contoh: Nasional atau DKI Jakarta"
              />
            </FormField>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-primary">
                Status program
              </legend>

              <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm({
                      ...form,
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
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
              rows={4}
              className={`${inputClassName} resize-y`}
              placeholder="Deskripsi singkat program"
            />
          </FormField>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-11 rounded-xl border border-strong-border bg-surface px-5 text-sm font-medium text-primary transition-colors duration-200 hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-xl bg-brand-primary px-5 text-sm font-medium text-inverse-text transition-colors duration-200 hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Menyimpan…" : "Simpan program"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-[var(--color-error)]/35 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]"
        >
          <p className="font-medium">Program belum dapat dimuat</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Memuat program bantuan"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && programs.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-default-border bg-surface px-5 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-brand-primary">
            <ClipboardIcon />
          </div>

          <p className="mt-4 text-lg font-semibold text-primary">
            Belum ada program bantuan
          </p>

          <p className="mt-2 text-sm text-secondary">
            Tambahkan program pertama untuk mulai mengelola data bantuan.
          </p>
        </div>
      )}

      {/* Program grid */}
      {!loading && programs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((program) => (
            <button
              key={program.id}
              type="button"
              onClick={() => router.push(`/admin/aid/${program.id}`)}
              className="group flex min-h-44 flex-col rounded-2xl border border-default-border bg-surface p-5 text-left transition-colors duration-200 hover:border-strong-border hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold leading-6 text-primary">
                  {program.name}
                </h2>

                {program.verification_status === "verified" && (
                  <span
                    title="Terverifikasi"
                    aria-label="Program terverifikasi"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-info)]/10 text-[var(--color-info)]"
                  >
                    <VerifiedIcon />
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-secondary">
                {program.provider}
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                <span
                  className={`inline-flex min-h-8 items-center rounded-full border px-3 text-sm font-medium ${getCategoryBadgeClass(
                    program.category,
                  )}`}
                >
                  {CATEGORY_LABELS[program.category] ??
                    program.category}
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

                {(program.rule_version_count ?? 0) > 0 && (
                  <span className="text-sm text-secondary">
                    {program.rule_version_count} aturan
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

const inputClassName =
  "min-h-11 w-full rounded-xl border border-default-border bg-surface px-3 py-2.5 text-base text-primary placeholder:text-secondary/70 focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]/20 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-secondary";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-primary">
        {label}
      </span>

      {children}
    </label>
  );
}

function CardSkeleton() {
  return (
    <div className="min-h-44 animate-pulse rounded-2xl border border-default-border bg-surface p-5">
      <div className="h-5 w-3/4 rounded-lg bg-subtle" />
      <div className="mt-4 h-4 w-2/5 rounded-lg bg-subtle" />

      <div className="mt-8 flex gap-2">
        <div className="h-8 w-24 rounded-full bg-subtle" />
        <div className="h-8 w-20 rounded-full bg-subtle" />
      </div>
    </div>
  );
}

function getCategoryBadgeClass(category: string) {
  const classes: Record<string, string> = {
    disability_support:
      "border-[var(--color-info)]/35 bg-[var(--color-info)]/10 text-[var(--color-info)]",
    health:
      "border-[var(--color-success)]/35 bg-[var(--color-success)]/10 text-[var(--color-success)]",
    education:
      "border-[var(--color-info)]/35 bg-[var(--color-info)]/10 text-[var(--color-info)]",
    financial:
      "border-[var(--color-warning)]/35 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    housing:
      "border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/15 text-primary",
    other: "border-default-border bg-subtle text-secondary",
  };

  return classes[category] ?? classes.other;
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
      className="h-4 w-4"
    >
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <rect width="16" height="18" x="4" y="3" rx="2" />
      <path d="M9 3h6v4H9z" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}