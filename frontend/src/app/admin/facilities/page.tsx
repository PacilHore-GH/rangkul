"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
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
    services: facility.services.map((service) => ({ ...service, accessibility: [...service.accessibility] })),
    active: facility.active,
  };
}

export default function FacilityAdminPage() {
  const [token, setToken] = useState("");
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
    } catch (requestError) {
      setAuthenticated(false);
      setError(requestError instanceof Error ? requestError.message : "Dashboard gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  function authenticate(event: FormEvent) {
    event.preventDefault();
    void loadAdmin();
  }

  function updateService(index: number, patch: Partial<FacilityService>) {
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

  function startEdit(facility: Facility) {
    setEditingId(facility.id);
    setDraft(facilityInput(facility));
    setShowForm(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setSuccess(editingId ? "Fasilitas berhasil diperbarui." : "Fasilitas berhasil ditambahkan.");
      resetForm();
      await loadAdmin();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Fasilitas gagal disimpan.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(facility: Facility) {
    setLoading(true);
    setError(null);
    try {
      await setAdminFacilityActive(token, facility.id, !facility.active);
      await loadAdmin();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Status gagal diubah.");
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
    try {
      await updateAdminFacilityReport(token, report.id, status, notes[report.id]);
      await loadAdmin();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Laporan gagal diperbarui.");
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
        <form onSubmit={authenticate} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7">
          <p className="text-sm font-semibold text-indigo-300">Facility Administration</p>
          <h1 className="mt-2 text-2xl font-bold">Masukkan token admin</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Token bootstrap hanya digunakan sampai autentikasi berbasis role milik tim selesai diintegrasikan. Token tidak disimpan di browser.</p>
          <label className="mt-6 block text-sm font-medium">
            Bootstrap token
            <input type="password" required value={token} onChange={(event) => setToken(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 outline-none focus:border-indigo-400" />
          </label>
          {error && <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          <button disabled={loading} className="mt-5 min-h-11 w-full rounded-lg bg-indigo-600 px-4 font-semibold hover:bg-indigo-500 disabled:opacity-50">{loading ? "Memeriksa…" : "Buka dashboard"}</button>
          <Link href="/app/services/search" className="mt-4 flex min-h-11 items-center justify-center text-sm text-slate-400 hover:text-white">Kembali ke pencarian</Link>
        </form>
      </main>
    );
  }

  const pendingReports = reports.filter((report) => ["received", "reviewing"].includes(report.status));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-300">Facility Administration</p>
            <h1 className="mt-2 text-3xl font-bold">Kelola katalog fasilitas</h1>
            <p className="mt-2 text-slate-400">Perbarui data, sumber, masa berlaku, layanan, dan laporan pengguna.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/app/services/search" className="flex min-h-11 items-center rounded-lg border border-slate-700 px-4 text-sm hover:bg-slate-800">Lihat katalog</Link>
            <button onClick={() => { setEditingId(undefined); setDraft(emptyFacility()); setShowForm(true); }} className="min-h-11 rounded-lg bg-indigo-600 px-4 text-sm font-semibold hover:bg-indigo-500">Tambah fasilitas</button>
          </div>
        </header>

        <section aria-label="Ringkasan" className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            ["Total", facilities.length],
            ["Aktif", facilities.filter((item) => item.active).length],
            ["Data kedaluwarsa", facilities.filter((item) => item.stale).length],
            ["Laporan terbuka", pendingReports.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>
          ))}
        </section>

        {error && <p role="alert" className="mt-6 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200">{error}</p>}
        {success && <p role="status" className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">{success}</p>}

        {showForm && (
          <form onSubmit={submitFacility} className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">{editingId ? "Edit fasilitas" : "Tambah fasilitas"}</h2><button type="button" onClick={resetForm} className="min-h-11 rounded-lg border border-slate-700 px-4">Batal</button></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm">Nama<input required minLength={2} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Jenis<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as FacilityInput["category"] })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3"><option value="hospital">Rumah sakit</option><option value="clinic">Klinik</option><option value="therapy_center">Pusat terapi</option><option value="inclusive_school">Sekolah inklusif</option></select></label>
              <label className="text-sm">Status verifikasi<select value={draft.verification_status} onChange={(event) => setDraft({ ...draft, verification_status: event.target.value as FacilityInput["verification_status"] })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3"><option value="unverified">Belum diverifikasi</option><option value="needs_review">Perlu ditinjau</option><option value="verified">Terverifikasi</option></select></label>
              <label className="text-sm md:col-span-2 lg:col-span-3">Deskripsi<textarea required minLength={10} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></label>
              <label className="text-sm md:col-span-2">Alamat<input required value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Kota<input required value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Provinsi<input required value={draft.province} onChange={(event) => setDraft({ ...draft, province: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Latitude<input required type="number" step="any" min={-90} max={90} value={draft.latitude} onChange={(event) => setDraft({ ...draft, latitude: Number(event.target.value) })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Longitude<input required type="number" step="any" min={-180} max={180} value={draft.longitude} onChange={(event) => setDraft({ ...draft, longitude: Number(event.target.value) })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Telepon<input value={draft.phone || ""} onChange={(event) => setDraft({ ...draft, phone: event.target.value || null })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Website<input type="url" value={draft.website || ""} onChange={(event) => setDraft({ ...draft, website: event.target.value || null })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Nama sumber<input required value={draft.source_name} onChange={(event) => setDraft({ ...draft, source_name: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">URL sumber<input type="url" value={draft.source_url || ""} onChange={(event) => setDraft({ ...draft, source_url: event.target.value || null })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Sumber diperbarui<input required type="date" value={draft.source_updated_at} onChange={(event) => setDraft({ ...draft, source_updated_at: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
              <label className="text-sm">Berlaku sampai<input required type="date" value={draft.valid_until} onChange={(event) => setDraft({ ...draft, valid_until: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3" /></label>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4"><h3 className="font-semibold">Layanan</h3><button type="button" onClick={() => setDraft({ ...draft, services: [...draft.services, newService()] })} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm">Tambah layanan</button></div>
            <div className="mt-4 space-y-4">
              {draft.services.map((service, index) => (
                <fieldset key={index} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                  <legend className="px-2 text-sm font-semibold">Layanan {index + 1}</legend>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm">Kode<input required pattern="[a-z0-9_]+" value={service.code} onChange={(event) => updateService(index, { code: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3" /></label>
                    <label className="text-sm">Nama<input required value={service.name} onChange={(event) => updateService(index, { name: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3" /></label>
                    <label className="text-sm">Usia minimum<input type="number" min={0} max={120} value={service.age_min} onChange={(event) => updateService(index, { age_min: Number(event.target.value) })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3" /></label>
                    <label className="text-sm">Usia maksimum<input type="number" min={0} max={120} value={service.age_max ?? ""} onChange={(event) => updateService(index, { age_max: event.target.value ? Number(event.target.value) : null })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3" /></label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={service.accepts_bpjs} onChange={(event) => updateService(index, { accepts_bpjs: event.target.checked })} className="size-5" />BPJS</label>
                    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={service.online_booking} onChange={(event) => updateService(index, { online_booking: event.target.checked })} className="size-5" />Pendaftaran online</label>
                    {accessibilityOptions.map(([value, label]) => <label key={value} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={service.accessibility.includes(value)} onChange={() => toggleAccessibility(index, value)} className="size-5" />{label}</label>)}
                  </div>
                  {draft.services.length > 1 && <button type="button" onClick={() => setDraft({ ...draft, services: draft.services.filter((_, serviceIndex) => serviceIndex !== index) })} className="mt-3 min-h-11 text-sm text-rose-300">Hapus layanan</button>}
                </fieldset>
              ))}
            </div>
            <button disabled={loading} className="mt-6 min-h-11 rounded-lg bg-indigo-600 px-6 font-semibold hover:bg-indigo-500 disabled:opacity-50">{loading ? "Menyimpan…" : "Simpan fasilitas"}</button>
          </form>
        )}

        <section aria-labelledby="catalog-title" className="mt-10">
          <div className="flex items-center justify-between"><h2 id="catalog-title" className="text-2xl font-bold">Katalog</h2><button onClick={() => void loadAdmin()} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm">Muat ulang</button></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {facilities.map((facility) => (
              <article key={facility.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-indigo-300">{categoryLabels[facility.category]}</p><h3 className="mt-1 text-lg font-bold">{facility.name}</h3><p className="mt-1 text-sm text-slate-400">{facility.city}, {facility.province}</p></div><span className={`rounded-full px-3 py-1 text-xs ${facility.active ? "bg-emerald-500/10 text-emerald-200" : "bg-slate-800 text-slate-400"}`}>{facility.active ? "Aktif" : "Nonaktif"}</span></div>
                <p className={`mt-4 text-sm ${facility.stale ? "text-amber-200" : "text-slate-400"}`}>Sumber: {facility.source_name} · berlaku sampai {facility.valid_until}{facility.stale ? " · kedaluwarsa" : ""}</p>
                <p className="mt-2 text-sm text-slate-400">{facility.services.length} layanan · {facility.verification_status}</p>
                <div className="mt-4 flex gap-2"><button onClick={() => startEdit(facility)} className="min-h-11 rounded-lg bg-indigo-600 px-4 text-sm font-semibold">Edit</button><button onClick={() => void toggleActive(facility)} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm">{facility.active ? "Nonaktifkan" : "Aktifkan"}</button></div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="reports-title" className="mt-10 pb-12">
          <h2 id="reports-title" className="text-2xl font-bold">Laporan pengguna</h2>
          {reports.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">Belum ada laporan.</p> : (
            <div className="mt-4 space-y-4">
              {reports.map((report) => (
                <article key={report.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm font-semibold">{report.reason.replaceAll("_", " ")}</p><p className="mt-2 text-slate-300">{report.details}</p><p className="mt-2 text-xs text-slate-500">Fasilitas: {report.facility_id} · {new Date(report.created_at).toLocaleString("id-ID")}</p></div><span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{report.status}</span></div>
                  {!["resolved", "dismissed"].includes(report.status) && <div className="mt-4"><label className="text-sm">Catatan penyelesaian<textarea value={notes[report.id] || ""} onChange={(event) => setNotes({ ...notes, [report.id]: event.target.value })} rows={2} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></label><div className="mt-3 flex flex-wrap gap-2">{report.status === "received" && <button onClick={() => void moderateReport(report, "reviewing")} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm">Mulai tinjau</button>}<button onClick={() => void moderateReport(report, "resolved")} className="min-h-11 rounded-lg bg-emerald-600 px-4 text-sm font-semibold">Selesaikan</button><button onClick={() => void moderateReport(report, "dismissed")} className="min-h-11 rounded-lg border border-rose-500/50 px-4 text-sm text-rose-200">Tolak laporan</button></div></div>}
                  {report.resolution_note && <p className="mt-4 rounded-lg bg-slate-950 p-3 text-sm text-slate-300">Catatan: {report.resolution_note}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
