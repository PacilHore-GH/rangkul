"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import {
  Facility,
  FacilityInput,
  FacilityReport,
  FacilityService,
  categoryLabels,
  listAdminFacilities,
  listAdminFacilityReports,
  saveAdminFacility,
  setAdminFacilityActive,
  updateAdminFacilityReport,
} from "@/features/facilities/api";

const accessibilityOptions = [
  ["wheelchair_access", "Akses kursi roda"],
  ["accessible_toilet", "Toilet aksesibel"],
  ["sign_language", "Bahasa isyarat"],
  ["sensory_friendly", "Ramah sensorik"],
] as const;

const verificationLabels: Record<
  Facility["verification_status"],
  string
> = {
  verified: "Terverifikasi",
  unverified: "Belum diverifikasi",
  needs_review: "Perlu ditinjau",
};

const reportStatusLabels: Record<FacilityReport["status"], string> = {
  received: "Diterima",
  reviewing: "Sedang ditinjau",
  resolved: "Selesai",
  dismissed: "Ditolak",
};

const reportReasonLabels: Record<FacilityReport["reason"], string> = {
  wrong_information: "Informasi tidak sesuai",
  closed: "Fasilitas tutup",
  contact: "Kontak tidak sesuai",
  service: "Informasi layanan",
  other: "Lainnya",
};

function newService(): FacilityService {
  return {
    code: "",
    name: "",
    age_min: 0,
    age_max: null,
    accepts_bpjs: false,
    online_booking: false,
    accessibility: [],
  };
}

function emptyFacility(): FacilityInput {
  return {
    name: "",
    category: "clinic",
    description: "",
    address: "",
    city: "",
    province: "",
    latitude: 0,
    longitude: 0,
    phone: null,
    website: null,
    verification_status: "unverified",
    source_name: "",
    source_url: null,
    source_updated_at: "",
    valid_until: "",
    services: [newService()],
    active: true,
  };
}

function facilityInput(facility: Facility): FacilityInput {
  return {
    name: facility.name,
    category: facility.category,
    description: facility.description,
    address: facility.address,
    city: facility.city,
    province: facility.province,
    latitude: facility.latitude,
    longitude: facility.longitude,
    phone: facility.phone,
    website: facility.website,
    verification_status: facility.verification_status,
    source_name: facility.source_name,
    source_url: facility.source_url,
    source_updated_at: facility.source_updated_at,
    valid_until: facility.valid_until,
    services: facility.services.map((service) => ({
      ...service,
      accessibility: [...service.accessibility],
    })),
    active: facility.active,
  };
}

export default function FacilityAdminPage() {
  const [token, setToken] = useState("test-facility-admin");
  const [authenticated, setAuthenticated] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reports, setReports] = useState<FacilityReport[]>([]);
  const [draft, setDraft] = useState<FacilityInput>(emptyFacility);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadAdmin(providedToken = token) {
    setLoading(true);
    setError(null);

    try {
      const [catalog, correctionReports] = await Promise.all([
        listAdminFacilities(providedToken),
        listAdminFacilityReports(providedToken),
      ]);

      setFacilities(catalog);
      setReports(correctionReports);
      setAuthenticated(true);
      setSuccess("Koneksi admin berhasil dibuat.");
    } catch (requestError) {
      setAuthenticated(false);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Dashboard gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }

  function authenticate(event: FormEvent) {
    event.preventDefault();
    void loadAdmin();
  }

  function updateService(
    index: number,
    patch: Partial<FacilityService>,
  ) {
    setDraft((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, ...patch } : service,
      ),
    }));
  }

  function toggleAccessibility(index: number, value: string) {
    const current = draft.services[index].accessibility;

    updateService(index, {
      accessibility: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  }

  function openNewFacilityForm() {
    setEditingId(undefined);
    setDraft(emptyFacility());
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function startEdit(facility: Facility) {
    setEditingId(facility.id);
    setDraft(facilityInput(facility));
    setShowForm(true);
    setError(null);
    setSuccess(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetForm() {
    setEditingId(undefined);
    setDraft(emptyFacility());
    setShowForm(false);
  }

  async function submitFacility(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await saveAdminFacility(token, draft, editingId);

      setSuccess(
        editingId
          ? "Fasilitas berhasil diperbarui."
          : "Fasilitas berhasil ditambahkan.",
      );

      resetForm();
      await loadAdmin();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Fasilitas gagal disimpan.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(facility: Facility) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setAdminFacilityActive(
        token,
        facility.id,
        !facility.active,
      );

      setSuccess(
        facility.active
          ? "Fasilitas berhasil dinonaktifkan."
          : "Fasilitas berhasil diaktifkan.",
      );

      await loadAdmin();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Status fasilitas gagal diubah.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function moderateReport(
    report: FacilityReport,
    status: "reviewing" | "resolved" | "dismissed",
  ) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateAdminFacilityReport(
        token,
        report.id,
        status,
        notes[report.id],
      );

      setSuccess("Laporan berhasil diperbarui.");
      await loadAdmin();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Laporan gagal diperbarui.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas px-4 py-8 text-primary">
        <form
          onSubmit={authenticate}
          className="w-full max-w-md rounded-3xl border border-default-border bg-surface p-6 shadow-sm sm:p-8"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-brand-primary">
            <BuildingIcon />
          </div>

          <p className="mt-5 text-sm font-medium text-brand-primary">
            Administrasi fasilitas
          </p>

          <h1 className="mt-2 text-2xl font-semibold leading-8 text-primary">
            Masukkan token admin
          </h1>

          <p className="mt-3 text-base leading-6 text-secondary">
            Token sementara digunakan sampai autentikasi berbasis peran
            selesai diintegrasikan. Token tidak disimpan di browser.
          </p>

          <FormField
            label="Token administrasi"
            className="mt-6"
          >
            <input
              type="password"
              required
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className={inputClassName}
              autoComplete="current-password"
              placeholder="Masukkan token admin"
            />
          </FormField>

          {error && (
            <FeedbackMessage type="error">
              <p className="font-medium">Token belum dapat digunakan</p>
              <p className="mt-1">{error}</p>
            </FeedbackMessage>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`${primaryButtonClassName} mt-5 w-full`}
          >
            {loading ? "Memeriksa…" : "Buka halaman administrasi"}
          </button>

          <Link
            href="/app/services/search"
            className="mt-3 flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-secondary transition-colors hover:bg-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Kembali ke pencarian fasilitas
          </Link>
        </form>
      </main>
    );
  }

  const pendingReports = reports.filter((report) =>
    ["received", "reviewing"].includes(report.status),
  );

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 text-primary sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-primary">
              Administrasi fasilitas
            </p>

            <h1 className="mt-2 text-2xl font-semibold leading-8 tracking-tight text-primary sm:text-[32px] sm:leading-10">
              Kelola katalog fasilitas
            </h1>

            <p className="mt-2 max-w-2xl text-base leading-6 text-secondary">
              Perbarui informasi fasilitas, sumber data, masa berlaku,
              layanan, dan laporan dari pengguna.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app/services/search"
              className={secondaryButtonClassName}
            >
              Lihat katalog
            </Link>

            <button
              type="button"
              onClick={openNewFacilityForm}
              className={primaryButtonClassName}
            >
              Tambah fasilitas
            </button>
          </div>
        </header>

        <section
          aria-label="Ringkasan fasilitas"
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <SummaryCard
            label="Total fasilitas"
            value={facilities.length}
          />
          <SummaryCard
            label="Fasilitas aktif"
            value={facilities.filter((item) => item.active).length}
          />
          <SummaryCard
            label="Data kedaluwarsa"
            value={facilities.filter((item) => item.stale).length}
            warning={
              facilities.filter((item) => item.stale).length > 0
            }
          />
          <SummaryCard
            label="Laporan terbuka"
            value={pendingReports.length}
            warning={pendingReports.length > 0}
          />
        </section>

        {error && (
          <FeedbackMessage type="error">
            <p className="font-medium">Terjadi kendala</p>
            <p className="mt-1">{error}</p>
          </FeedbackMessage>
        )}

        {success && (
          <FeedbackMessage type="success">
            {success}
          </FeedbackMessage>
        )}

        {showForm && (
          <form
            onSubmit={submitFacility}
            className="mt-8 rounded-3xl border border-default-border bg-surface p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold leading-7 text-primary">
                  {editingId
                    ? "Edit fasilitas"
                    : "Tambah fasilitas"}
                </h2>

                <p className="mt-1 text-sm text-secondary">
                  Lengkapi data yang diperlukan agar informasi fasilitas
                  dapat digunakan dengan jelas.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className={secondaryButtonClassName}
              >
                Batal
              </button>
            </div>

            <section
              aria-labelledby="facility-information-title"
              className="mt-8"
            >
              <h3
                id="facility-information-title"
                className="text-base font-semibold text-primary"
              >
                Informasi fasilitas
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FormField label="Nama fasilitas">
                  <input
                    required
                    minLength={2}
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        name: event.target.value,
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Jenis fasilitas">
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        category: event.target
                          .value as FacilityInput["category"],
                      })
                    }
                    className={inputClassName}
                  >
                    <option value="hospital">Rumah sakit</option>
                    <option value="clinic">Klinik</option>
                    <option value="therapy_center">
                      Pusat terapi
                    </option>
                    <option value="inclusive_school">
                      Sekolah inklusif
                    </option>
                  </select>
                </FormField>

                <FormField label="Status verifikasi">
                  <select
                    value={draft.verification_status}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        verification_status: event.target
                          .value as FacilityInput["verification_status"],
                      })
                    }
                    className={inputClassName}
                  >
                    <option value="unverified">
                      Belum diverifikasi
                    </option>
                    <option value="needs_review">
                      Perlu ditinjau
                    </option>
                    <option value="verified">
                      Terverifikasi
                    </option>
                  </select>
                </FormField>

                <FormField
                  label="Deskripsi"
                  className="md:col-span-2 xl:col-span-3"
                >
                  <textarea
                    required
                    minLength={10}
                    rows={4}
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        description: event.target.value,
                      })
                    }
                    className={`${inputClassName} resize-y`}
                  />
                </FormField>

                <FormField
                  label="Alamat"
                  className="md:col-span-2"
                >
                  <input
                    required
                    value={draft.address}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        address: event.target.value,
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Kota atau kabupaten">
                  <input
                    required
                    value={draft.city}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        city: event.target.value,
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Provinsi">
                  <input
                    required
                    value={draft.province}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        province: event.target.value,
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="Latitude"
                  helperText="Nilai antara -90 dan 90."
                >
                  <input
                    required
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    value={draft.latitude}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        latitude: Number(event.target.value),
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="Longitude"
                  helperText="Nilai antara -180 dan 180."
                >
                  <input
                    required
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    value={draft.longitude}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        longitude: Number(event.target.value),
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Nomor telepon">
                  <input
                    value={draft.phone || ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        phone: event.target.value || null,
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Website">
                  <input
                    type="url"
                    value={draft.website || ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        website: event.target.value || null,
                      })
                    }
                    className={inputClassName}
                    placeholder="https://"
                  />
                </FormField>
              </div>
            </section>

            <section
              aria-labelledby="facility-source-title"
              className="mt-8 border-t border-default-border pt-8"
            >
              <h3
                id="facility-source-title"
                className="text-base font-semibold text-primary"
              >
                Sumber dan masa berlaku data
              </h3>

              <p className="mt-1 text-sm text-secondary">
                Informasi sumber membantu pengguna menilai kesegaran dan
                keandalan data.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField label="Nama sumber">
                  <input
                    required
                    value={draft.source_name}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        source_name: event.target.value,
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="URL sumber">
                  <input
                    type="url"
                    value={draft.source_url || ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        source_url: event.target.value || null,
                      })
                    }
                    className={inputClassName}
                    placeholder="https://"
                  />
                </FormField>

                <FormField label="Tanggal sumber diperbarui">
                  <input
                    required
                    type="date"
                    value={draft.source_updated_at}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        source_updated_at: event.target.value,
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Berlaku sampai">
                  <input
                    required
                    type="date"
                    value={draft.valid_until}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        valid_until: event.target.value,
                      })
                    }
                    className={inputClassName}
                  />
                </FormField>
              </div>
            </section>

            <section
              aria-labelledby="facility-services-title"
              className="mt-8 border-t border-default-border pt-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3
                    id="facility-services-title"
                    className="text-base font-semibold text-primary"
                  >
                    Layanan
                  </h3>

                  <p className="mt-1 text-sm text-secondary">
                    Tambahkan layanan dan dukungan aksesibilitas yang
                    benar-benar tersedia.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      services: [
                        ...draft.services,
                        newService(),
                      ],
                    })
                  }
                  className={secondaryButtonClassName}
                >
                  Tambah layanan
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {draft.services.map((service, index) => (
                  <fieldset
                    key={index}
                    className="rounded-2xl border border-default-border bg-subtle p-4 sm:p-5"
                  >
                    <legend className="px-2 text-sm font-semibold text-primary">
                      Layanan {index + 1}
                    </legend>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <FormField
                        label="Kode layanan"
                        helperText="Gunakan huruf kecil, angka, atau garis bawah."
                      >
                        <input
                          required
                          pattern="[a-z0-9_]+"
                          value={service.code}
                          onChange={(event) =>
                            updateService(index, {
                              code: event.target.value,
                            })
                          }
                          className={inputClassName}
                          placeholder="contoh_layanan"
                        />
                      </FormField>

                      <FormField label="Nama layanan">
                        <input
                          required
                          value={service.name}
                          onChange={(event) =>
                            updateService(index, {
                              name: event.target.value,
                            })
                          }
                          className={inputClassName}
                        />
                      </FormField>

                      <FormField label="Usia minimum">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={service.age_min}
                          onChange={(event) =>
                            updateService(index, {
                              age_min: Number(event.target.value),
                            })
                          }
                          className={inputClassName}
                        />
                      </FormField>

                      <FormField label="Usia maksimum">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={service.age_max ?? ""}
                          onChange={(event) =>
                            updateService(index, {
                              age_max: event.target.value
                                ? Number(event.target.value)
                                : null,
                            })
                          }
                          className={inputClassName}
                        />
                      </FormField>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-medium text-primary">
                        Dukungan layanan
                      </p>

                      <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-3">
                        <CheckboxField
                          checked={service.accepts_bpjs}
                          onChange={(checked) =>
                            updateService(index, {
                              accepts_bpjs: checked,
                            })
                          }
                          label="Menerima BPJS"
                        />

                        <CheckboxField
                          checked={service.online_booking}
                          onChange={(checked) =>
                            updateService(index, {
                              online_booking: checked,
                            })
                          }
                          label="Pendaftaran online"
                        />

                        {accessibilityOptions.map(
                          ([value, label]) => (
                            <CheckboxField
                              key={value}
                              checked={service.accessibility.includes(
                                value,
                              )}
                              onChange={() =>
                                toggleAccessibility(index, value)
                              }
                              label={label}
                            />
                          ),
                        )}
                      </div>
                    </div>

                    {draft.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            services: draft.services.filter(
                              (_, serviceIndex) =>
                                serviceIndex !== index,
                            ),
                          })
                        }
                        className="mt-4 min-h-11 rounded-xl px-3 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        Hapus layanan ini
                      </button>
                    )}
                  </fieldset>
                ))}
              </div>
            </section>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-default-border pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                className={secondaryButtonClassName}
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={loading}
                className={primaryButtonClassName}
              >
                {loading
                  ? "Menyimpan…"
                  : editingId
                    ? "Simpan perubahan"
                    : "Simpan fasilitas"}
              </button>
            </div>
          </form>
        )}

        <section
          aria-labelledby="catalog-title"
          className="mt-10"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="catalog-title"
                className="text-2xl font-semibold leading-8 text-primary"
              >
                Katalog fasilitas
              </h2>

              <p className="mt-1 text-sm text-secondary">
                Tinjau dan kelola seluruh fasilitas yang tersedia.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadAdmin()}
              disabled={loading}
              className={secondaryButtonClassName}
            >
              {loading ? "Memuat…" : "Muat ulang"}
            </button>
          </div>

          {facilities.length === 0 ? (
            <EmptyState
              title="Belum ada fasilitas"
              description="Tambahkan fasilitas pertama agar dapat ditampilkan dalam katalog."
            />
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {facilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  loading={loading}
                  onEdit={() => startEdit(facility)}
                  onToggle={() => void toggleActive(facility)}
                />
              ))}
            </div>
          )}
        </section>

        <section
          aria-labelledby="reports-title"
          className="mt-10 pb-12"
        >
          <div>
            <h2
              id="reports-title"
              className="text-2xl font-semibold leading-8 text-primary"
            >
              Laporan pengguna
            </h2>

            <p className="mt-1 text-sm text-secondary">
              Tinjau laporan koreksi informasi yang dikirim pengguna.
            </p>
          </div>

          {reports.length === 0 ? (
            <EmptyState
              title="Belum ada laporan pengguna"
              description="Laporan koreksi informasi akan muncul di bagian ini."
            />
          ) : (
            <div className="mt-5 space-y-4">
              {reports.map((report) => {
                const isClosed = [
                  "resolved",
                  "dismissed",
                ].includes(report.status);

                return (
                  <article
                    key={report.id}
                    className="rounded-2xl border border-default-border bg-surface p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-primary">
                          {reportReasonLabels[report.reason]}
                        </p>

                        <p className="mt-2 text-base leading-6 text-secondary">
                          {report.details}
                        </p>

                        <p className="mt-3 text-xs leading-[18px] text-secondary">
                          Fasilitas: {report.facility_id}
                          {" · "}
                          {new Date(
                            report.created_at,
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>

                      <ReportStatusBadge
                        status={report.status}
                      />
                    </div>

                    {!isClosed && (
                      <div className="mt-5 border-t border-default-border pt-5">
                        <FormField
                          label="Catatan penyelesaian"
                          helperText="Catatan wajib diisi ketika laporan diselesaikan atau ditolak."
                        >
                          <textarea
                            value={notes[report.id] || ""}
                            onChange={(event) =>
                              setNotes({
                                ...notes,
                                [report.id]:
                                  event.target.value,
                              })
                            }
                            rows={3}
                            className={`${inputClassName} resize-y`}
                          />
                        </FormField>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                          {report.status === "received" && (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                void moderateReport(
                                  report,
                                  "reviewing",
                                )
                              }
                              className={secondaryButtonClassName}
                            >
                              Mulai tinjau
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={
                              loading ||
                              !(notes[report.id] || "").trim()
                            }
                            onClick={() =>
                              void moderateReport(
                                report,
                                "resolved",
                              )
                            }
                            className="min-h-11 rounded-xl bg-[var(--color-success)] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Selesaikan laporan
                          </button>

                          <button
                            type="button"
                            disabled={
                              loading ||
                              !(notes[report.id] || "").trim()
                            }
                            onClick={() =>
                              void moderateReport(
                                report,
                                "dismissed",
                              )
                            }
                            className="min-h-11 rounded-xl border border-[var(--color-error)]/50 bg-surface px-4 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Tolak laporan
                          </button>
                        </div>
                      </div>
                    )}

                    {report.resolution_note && (
                      <div className="mt-5 rounded-xl border border-default-border bg-subtle p-4">
                        <p className="text-xs font-medium text-secondary">
                          Catatan penyelesaian
                        </p>

                        <p className="mt-1 text-sm leading-5 text-primary">
                          {report.resolution_note}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FacilityCard({
  facility,
  loading,
  onEdit,
  onToggle,
}: {
  facility: Facility;
  loading: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-default-border bg-surface p-5 transition-colors hover:border-strong-border">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-primary">
            {categoryLabels[facility.category]}
          </p>

          <h3 className="mt-1 text-lg font-semibold leading-6 text-primary">
            {facility.name}
          </h3>

          <p className="mt-2 text-sm text-secondary">
            {facility.city}, {facility.province}
          </p>
        </div>

        <StatusBadge
          active={facility.active}
          label={facility.active ? "Aktif" : "Nonaktif"}
        />
      </div>

      <div className="mt-5 space-y-2">
        <p
          className={`text-sm leading-5 ${
            facility.stale
              ? "text-[var(--color-warning)]"
              : "text-secondary"
          }`}
        >
          Sumber: {facility.source_name}
        </p>

        <p
          className={`text-sm leading-5 ${
            facility.stale
              ? "font-medium text-[var(--color-warning)]"
              : "text-secondary"
          }`}
        >
          Berlaku sampai {formatDate(facility.valid_until)}
          {facility.stale && " · Data kedaluwarsa"}
        </p>

        <p className="text-sm text-secondary">
          {facility.services.length} layanan
          {" · "}
          {verificationLabels[facility.verification_status]}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row">
        <button
          type="button"
          disabled={loading}
          onClick={onEdit}
          className={primaryButtonClassName}
        >
          Edit fasilitas
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={onToggle}
          className={
            facility.active
              ? "min-h-11 rounded-xl border border-[var(--color-warning)]/50 bg-surface px-4 text-sm font-medium text-[var(--color-warning)] transition-colors hover:bg-[var(--color-warning)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
              : secondaryButtonClassName
          }
        >
          {facility.active
            ? "Nonaktifkan"
            : "Aktifkan fasilitas"}
        </button>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-default-border bg-surface p-5">
      <p className="text-sm text-secondary">{label}</p>

      <p
        className={`mt-2 text-3xl font-semibold leading-10 ${
          warning
            ? "text-[var(--color-warning)]"
            : "text-primary"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function StatusBadge({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex min-h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium ${
        active
          ? "border-[var(--color-success)]/35 bg-[var(--color-success)]/10 text-[var(--color-success)]"
          : "border-default-border bg-subtle text-secondary"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${
          active
            ? "bg-[var(--color-success)]"
            : "bg-secondary"
        }`}
      />

      {label}
    </span>
  );
}

function ReportStatusBadge({
  status,
}: {
  status: FacilityReport["status"];
}) {
  const className: Record<FacilityReport["status"], string> = {
    received:
      "border-[var(--color-info)]/35 bg-[var(--color-info)]/10 text-[var(--color-info)]",
    reviewing:
      "border-[var(--color-warning)]/35 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    resolved:
      "border-[var(--color-success)]/35 bg-[var(--color-success)]/10 text-[var(--color-success)]",
    dismissed:
      "border-[var(--color-error)]/35 bg-[var(--color-error)]/10 text-[var(--color-error)]",
  };

  return (
    <span
      className={`inline-flex min-h-8 shrink-0 items-center rounded-full border px-3 text-sm font-medium ${className[status]}`}
    >
      {reportStatusLabels[status]}
    </span>
  );
}

function CheckboxField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-base text-primary transition-colors hover:bg-surface">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[var(--color-brand-primary)]"
      />

      <span>{label}</span>
    </label>
  );
}

function FormField({
  label,
  helperText,
  className = "",
  children,
}: {
  label: string;
  helperText?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
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

function FeedbackMessage({
  type,
  children,
}: {
  type: "error" | "success";
  children: ReactNode;
}) {
  const style =
    type === "error"
      ? "border-[var(--color-error)]/35 bg-[var(--color-error)]/10 text-[var(--color-error)]"
      : "border-[var(--color-success)]/35 bg-[var(--color-success)]/10 text-[var(--color-success)]";

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`mt-6 rounded-xl border px-4 py-3 text-sm ${style}`}
    >
      {children}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-default-border bg-surface px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-brand-primary">
        <BuildingIcon />
      </div>

      <p className="mt-4 text-lg font-semibold text-primary">
        {title}
      </p>

      <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-secondary">
        {description}
      </p>
    </div>
  );
}

function BuildingIcon() {
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
      <path d="M3 21h18" />
      <path d="M6 21V5l6-3 6 3v16" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
      <path d="M9 13h.01" />
      <path d="M15 13h.01" />
      <path d="M9 17h.01" />
      <path d="M15 17h.01" />
    </svg>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const inputClassName =
  "min-h-11 w-full rounded-xl border border-default-border bg-surface px-3 py-2.5 text-base text-primary placeholder:text-secondary/70 focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]/20 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-secondary";

const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-primary px-4 text-sm font-medium text-inverse-text transition-colors duration-200 hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-strong-border bg-surface px-4 text-sm font-medium text-primary transition-colors duration-200 hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50";